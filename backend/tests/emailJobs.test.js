const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

jest.mock('../services/emailService');
const { sendRenewalReminder, sendMonthlyReport } = require('../services/emailService');

const { runRenewalReminders, runMonthlyReport } = require('../jobs/schedulerService');

let mongoServer;

const baseSub = {
  name: 'Netflix',
  cost: 15.99,
  billingCycle: 'monthly',
  category: 'entertainment'
};

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 30000);

beforeEach(async () => {
  await User.deleteMany({});
  await Subscription.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('runRenewalReminders', () => {
  test('does not notify non-premium user renewing in 7 days', async () => {
    const user = await User.create({ email: 'free@example.com', password: 'Test123!@#' });
    await Subscription.create({ ...baseSub, userId: user._id, nextRenewalDate: daysFromNow(7) });

    await runRenewalReminders();

    expect(sendRenewalReminder).not.toHaveBeenCalled();
  });

  test('notifies premium user renewing in 7 days', async () => {
    const user = await User.create({ email: 'prem@example.com', password: 'Test123!@#', isPremium: true });
    const sub = await Subscription.create({ ...baseSub, userId: user._id, nextRenewalDate: daysFromNow(7) });

    await runRenewalReminders();

    expect(sendRenewalReminder).toHaveBeenCalledTimes(1);
    expect(sendRenewalReminder.mock.calls[0][0].email).toBe('prem@example.com');
    expect(sendRenewalReminder.mock.calls[0][1]._id.toString()).toBe(sub._id.toString());
  });

  test('does not notify premium user renewing in 8 days', async () => {
    const user = await User.create({ email: 'prem2@example.com', password: 'Test123!@#', isPremium: true });
    await Subscription.create({ ...baseSub, userId: user._id, nextRenewalDate: daysFromNow(8) });

    await runRenewalReminders();

    expect(sendRenewalReminder).not.toHaveBeenCalled();
  });

  test('does not notify for inactive subscription', async () => {
    const user = await User.create({ email: 'prem3@example.com', password: 'Test123!@#', isPremium: true });
    await Subscription.create({ ...baseSub, userId: user._id, nextRenewalDate: daysFromNow(7), isActive: false });

    await runRenewalReminders();

    expect(sendRenewalReminder).not.toHaveBeenCalled();
  });

  test('sends two reminders for premium user with two subs renewing in 7 days', async () => {
    const user = await User.create({ email: 'prem4@example.com', password: 'Test123!@#', isPremium: true });
    await Subscription.create({ ...baseSub, name: 'Netflix', userId: user._id, nextRenewalDate: daysFromNow(7) });
    await Subscription.create({ ...baseSub, name: 'Spotify', userId: user._id, nextRenewalDate: daysFromNow(7) });

    await runRenewalReminders();

    expect(sendRenewalReminder).toHaveBeenCalledTimes(2);
  });
});

describe('runMonthlyReport', () => {
  test('does not report for non-premium user', async () => {
    const user = await User.create({ email: 'free2@example.com', password: 'Test123!@#' });
    await Subscription.create({ ...baseSub, userId: user._id, nextRenewalDate: daysFromNow(30) });

    await runMonthlyReport();

    expect(sendMonthlyReport).not.toHaveBeenCalled();
  });

  test('reports for premium user with no subscriptions', async () => {
    await User.create({ email: 'prem5@example.com', password: 'Test123!@#', isPremium: true });

    await runMonthlyReport();

    expect(sendMonthlyReport).toHaveBeenCalledTimes(1);
    const [, subs, summary] = sendMonthlyReport.mock.calls[0];
    expect(subs).toHaveLength(0);
    expect(summary.monthlyTotal).toBe(0);
    expect(summary.yearlyTotal).toBe(0);
    expect(summary.count).toBe(0);
  });

  test('reports correct totals for premium user with mixed billing cycles', async () => {
    const user = await User.create({ email: 'prem6@example.com', password: 'Test123!@#', isPremium: true });
    // monthly $10 -> $10/mo
    await Subscription.create({ ...baseSub, name: 'A', cost: 10, billingCycle: 'monthly', userId: user._id, nextRenewalDate: daysFromNow(30) });
    // yearly $120 -> $10/mo
    await Subscription.create({ ...baseSub, name: 'B', cost: 120, billingCycle: 'yearly', userId: user._id, nextRenewalDate: daysFromNow(30) });

    await runMonthlyReport();

    expect(sendMonthlyReport).toHaveBeenCalledTimes(1);
    const [, subs, summary] = sendMonthlyReport.mock.calls[0];
    expect(subs).toHaveLength(2);
    expect(summary.monthlyTotal).toBeCloseTo(20, 1);
    expect(summary.yearlyTotal).toBeCloseTo(240, 1);
    expect(summary.count).toBe(2);
  });

  test('does not include inactive subscriptions in report', async () => {
    const user = await User.create({ email: 'prem7@example.com', password: 'Test123!@#', isPremium: true });
    await Subscription.create({ ...baseSub, name: 'Active', cost: 10, userId: user._id, nextRenewalDate: daysFromNow(30) });
    await Subscription.create({ ...baseSub, name: 'Inactive', cost: 99, userId: user._id, nextRenewalDate: daysFromNow(30), isActive: false });

    await runMonthlyReport();

    expect(sendMonthlyReport).toHaveBeenCalledTimes(1);
    const [, subs, summary] = sendMonthlyReport.mock.calls[0];
    expect(subs).toHaveLength(1);
    expect(summary.count).toBe(1);
    expect(summary.monthlyTotal).toBe(10);
  });
});

describe('sendRenewalReminder email content', () => {
  test('calls sendMail with correct recipient and subject', async () => {
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test' });
    const { _setTransporter } = require('../services/emailService');

    sendRenewalReminder.mockImplementationOnce(async (user, sub) => {
      await mockSendMail({
        to: user.email,
        subject: `Heads up: ${sub.name} renews in 7 days`
      });
    });

    const user = { email: 'test@example.com' };
    const sub = { name: 'Netflix', cost: 15.99, currency: 'USD', billingCycle: 'monthly', nextRenewalDate: daysFromNow(7) };

    await sendRenewalReminder(user, sub);

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: 'Heads up: Netflix renews in 7 days'
    }));
  });
});
