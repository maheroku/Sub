const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

function _setTransporter(t) {
  transporter = t;
}

async function sendRenewalReminder(user, subscription) {
  const renewalDate = new Date(subscription.nextRenewalDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'Laftel Sub <noreply@laftelsub.com>',
    to: user.email,
    subject: `Heads up: ${subscription.name} renews in 7 days`,
    text: [
      `Hi,`,
      ``,
      `Your ${subscription.name} subscription renews on ${renewalDate}.`,
      `Cost: ${subscription.currency} ${subscription.cost} (${subscription.billingCycle})`,
      ``,
      `— Laftel Sub`
    ].join('\n'),
    html: `
      <p>Hi,</p>
      <p>Your <strong>${subscription.name}</strong> subscription renews on <strong>${renewalDate}</strong>.</p>
      <p>Cost: ${subscription.currency} ${subscription.cost} (${subscription.billingCycle})</p>
      <p>— Laftel Sub</p>
    `
  });
}

async function sendMonthlyReport(user, subscriptions, summary) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const rows = subscriptions.map(s =>
    `  • ${s.name}: ${s.currency} ${s.cost}/${s.billingCycle} (~$${s.monthlyCost}/mo)`
  ).join('\n');

  const textBody = [
    `Hi,`,
    ``,
    `Here is your ${monthLabel} subscription spending report.`,
    ``,
    rows || '  No active subscriptions.',
    ``,
    `Monthly total: $${summary.monthlyTotal}`,
    `Yearly projection: $${summary.yearlyTotal}`,
    `Active subscriptions: ${summary.count}`,
    ``,
    `— Laftel Sub`
  ].join('\n');

  const htmlRows = subscriptions.map(s =>
    `<tr><td>${s.name}</td><td>${s.currency} ${s.cost}/${s.billingCycle}</td><td>$${s.monthlyCost}/mo</td></tr>`
  ).join('');

  const htmlBody = `
    <p>Hi,</p>
    <p>Here is your <strong>${monthLabel}</strong> subscription spending report.</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Name</th><th>Cost</th><th>Monthly</th></tr>
      ${htmlRows || '<tr><td colspan="3">No active subscriptions.</td></tr>'}
    </table>
    <p>
      <strong>Monthly total:</strong> $${summary.monthlyTotal}<br>
      <strong>Yearly projection:</strong> $${summary.yearlyTotal}<br>
      <strong>Active subscriptions:</strong> ${summary.count}
    </p>
    <p>— Laftel Sub</p>
  `;

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'Laftel Sub <noreply@laftelsub.com>',
    to: user.email,
    subject: `Your ${monthLabel} subscription spending report`,
    text: textBody,
    html: htmlBody
  });
}

module.exports = { sendRenewalReminder, sendMonthlyReport, _setTransporter };
