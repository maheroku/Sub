const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const { generateUserToken } = require('../middleware/userAuth');

jest.mock('stripe', () => {
  const mockStripe = {
    customers: {
      create: jest.fn()
    },
    checkout: {
      sessions: {
        create: jest.fn()
      }
    },
    billingPortal: {
      sessions: {
        create: jest.fn()
      }
    },
    subscriptions: {
      retrieve: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  };
  return jest.fn(() => mockStripe);
});

const stripe = require('stripe')();

let mongoServer;
let app;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = require('../server');
}, 30000);

beforeEach(async () => {
  await User.deleteMany({});
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

describe('Billing Routes', () => {
  describe('POST /api/billing/create-checkout-session', () => {
    test('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .send({ plan: 'monthly' })
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    test('should create a Stripe customer and checkout session for monthly plan', async () => {
      process.env.STRIPE_MONTHLY_PRICE_ID = 'price_monthly_test';
      process.env.APP_URL = 'http://localhost:3000';

      const user = await User.create({ email: 'pay@example.com', password: 'Test123!@#' });
      const token = generateUserToken(user._id);

      stripe.customers.create.mockResolvedValue({ id: 'cus_test123' });
      stripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'monthly' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.url).toBe('https://checkout.stripe.com/test');
      expect(stripe.customers.create).toHaveBeenCalledWith({ email: 'pay@example.com' });
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          mode: 'subscription',
          line_items: [{ price: 'price_monthly_test', quantity: 1 }]
        })
      );

      const updated = await User.findById(user._id);
      expect(updated.stripeCustomerId).toBe('cus_test123');
    });

    test('should reuse existing stripeCustomerId', async () => {
      process.env.STRIPE_YEARLY_PRICE_ID = 'price_yearly_test';
      process.env.APP_URL = 'http://localhost:3000';

      const user = await User.create({
        email: 'existing@example.com',
        password: 'Test123!@#',
        stripeCustomerId: 'cus_existing'
      });
      const token = generateUserToken(user._id);

      stripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/yearly' });

      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'yearly' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(stripe.customers.create).not.toHaveBeenCalled();
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_existing' })
      );
    });

    test('should return 400 for invalid plan', async () => {
      delete process.env.STRIPE_MONTHLY_PRICE_ID;

      const user = await User.create({ email: 'bad@example.com', password: 'Test123!@#' });
      const token = generateUserToken(user._id);

      stripe.customers.create.mockResolvedValue({ id: 'cus_test' });

      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ plan: 'monthly' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/billing/portal', () => {
    test('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/billing/portal')
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    test('should return 400 if no stripeCustomerId', async () => {
      const user = await User.create({ email: 'noportal@example.com', password: 'Test123!@#' });
      const token = generateUserToken(user._id);

      const res = await request(app)
        .post('/api/billing/portal')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No billing account');
    });

    test('should return portal URL for premium user', async () => {
      process.env.APP_URL = 'http://localhost:3000';

      const user = await User.create({
        email: 'premium@example.com',
        password: 'Test123!@#',
        isPremium: true,
        stripeCustomerId: 'cus_portal123'
      });
      const token = generateUserToken(user._id);

      stripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/session/test' });

      const res = await request(app)
        .post('/api/billing/portal')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.url).toBe('https://billing.stripe.com/session/test');
    });
  });

  describe('POST /api/billing/webhook', () => {
    test('should reject invalid webhook signature', async () => {
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'bad_sig')
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{}'))
        .expect(400);

      expect(res.body.error).toContain('Webhook signature verification failed');
    });

    test('should set isPremium on checkout.session.completed', async () => {
      const user = await User.create({ email: 'webhook@example.com', password: 'Test123!@#' });
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            subscription: 'sub_test123',
            metadata: { userId: user._id.toString() }
          }
        }
      };

      stripe.webhooks.constructEvent.mockReturnValue(event);
      stripe.subscriptions.retrieve.mockResolvedValue({
        current_period_end: periodEnd
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(Buffer.from(JSON.stringify(event)))
        .expect(200);

      expect(res.body.received).toBe(true);

      const updated = await User.findById(user._id);
      expect(updated.isPremium).toBe(true);
      expect(updated.stripeSubscriptionId).toBe('sub_test123');
    });

    test('should revoke premium on customer.subscription.deleted', async () => {
      const user = await User.create({
        email: 'cancel@example.com',
        password: 'Test123!@#',
        isPremium: true,
        stripeSubscriptionId: 'sub_cancel123'
      });

      const event = {
        type: 'customer.subscription.deleted',
        data: { object: { id: 'sub_cancel123' } }
      };

      stripe.webhooks.constructEvent.mockReturnValue(event);

      await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(Buffer.from(JSON.stringify(event)))
        .expect(200);

      const updated = await User.findById(user._id);
      expect(updated.isPremium).toBe(false);
      expect(updated.stripeSubscriptionId).toBeNull();
    });

    test('should revoke premium on invoice.payment_failed', async () => {
      const user = await User.create({
        email: 'failed@example.com',
        password: 'Test123!@#',
        isPremium: true,
        stripeSubscriptionId: 'sub_failed123'
      });

      const event = {
        type: 'invoice.payment_failed',
        data: { object: { subscription: 'sub_failed123' } }
      };

      stripe.webhooks.constructEvent.mockReturnValue(event);

      await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(Buffer.from(JSON.stringify(event)))
        .expect(200);

      const updated = await User.findById(user._id);
      expect(updated.isPremium).toBe(false);
    });
  });
});
