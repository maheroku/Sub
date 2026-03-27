const cron = require('node-cron');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { sendRenewalReminder, sendMonthlyReport } = require('../services/emailService');

async function runRenewalReminders() {
  const today = new Date();
  const targetStart = new Date(today);
  targetStart.setDate(today.getDate() + 7);
  targetStart.setHours(0, 0, 0, 0);
  const targetEnd = new Date(targetStart);
  targetEnd.setHours(23, 59, 59, 999);

  const upcomingSubs = await Subscription.find({
    isActive: true,
    nextRenewalDate: { $gte: targetStart, $lte: targetEnd }
  });

  if (upcomingSubs.length === 0) return;

  const userIds = [...new Set(upcomingSubs.map(s => s.userId.toString()))];
  const premiumUsers = await User.find({ _id: { $in: userIds }, isPremium: true });
  const premiumUserMap = new Map(premiumUsers.map(u => [u._id.toString(), u]));

  for (const sub of upcomingSubs) {
    const user = premiumUserMap.get(sub.userId.toString());
    if (!user) continue;
    try {
      await sendRenewalReminder(user, sub);
    } catch (err) {
      console.error(`Renewal reminder failed for ${user.email}:`, err.message);
    }
  }
}

async function runMonthlyReport() {
  const premiumUsers = await User.find({ isPremium: true });

  for (const user of premiumUsers) {
    try {
      const subscriptions = await Subscription.find({ userId: user._id, isActive: true });
      const subsWithCost = subscriptions.map(sub => ({
        ...sub.toJSON(),
        monthlyCost: parseFloat(Subscription.monthlyCost(sub).toFixed(2))
      }));
      const monthlyTotal = parseFloat(
        subsWithCost.reduce((sum, s) => sum + s.monthlyCost, 0).toFixed(2)
      );
      const summary = {
        monthlyTotal,
        yearlyTotal: parseFloat((monthlyTotal * 12).toFixed(2)),
        count: subsWithCost.length
      };
      await sendMonthlyReport(user, subsWithCost, summary);
    } catch (err) {
      console.error(`Monthly report failed for ${user.email}:`, err.message);
    }
  }
}

function startScheduler() {
  // Daily at 09:00 — renewal reminders
  cron.schedule('0 9 * * *', runRenewalReminders);

  // 1st of every month at 08:00 — monthly spending reports
  cron.schedule('0 8 1 * *', runMonthlyReport);
}

module.exports = { startScheduler, runRenewalReminders, runMonthlyReport };
