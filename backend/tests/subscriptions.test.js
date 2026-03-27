const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { generateUserToken } = require('../middleware/userAuth');

let mongoServer;
let userA, userB, tokenA, tokenB;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 30000);

beforeEach(async () => {
  await User.deleteMany({});
  await Subscription.deleteMany({});

  userA = await User.create({ email: 'usera@example.com', password: 'Test123!@#' });
  userB = await User.create({ email: 'userb@example.com', password: 'Test123!@#' });
  tokenA = generateUserToken(userA._id);
  tokenB = generateUserToken(userB._id);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

const baseSub = {
  name: 'Netflix',
  cost: 15.99,
  billingCycle: 'monthly',
  nextRenewalDate: '2026-04-01'
};

describe('Subscription Routes', () => {
  describe('GET /api/subscriptions', () => {
    test('should return empty list for new user', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscriptions).toHaveLength(0);
      expect(response.body.summary.count).toBe(0);
      expect(response.body.summary.monthlyTotal).toBe(0);
    });

    test('should return subscriptions with computed monthlyCost', async () => {
      await Subscription.create({ ...baseSub, userId: userA._id, billingCycle: 'yearly', cost: 120 });

      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.subscriptions).toHaveLength(1);
      // yearly: 120 / 12 = 10
      expect(response.body.subscriptions[0].monthlyCost).toBe(10);
    });
  });

  describe('POST /api/subscriptions', () => {
    test('should create a subscription successfully', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(baseSub)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.name).toBe('Netflix');
      expect(response.body.subscription.monthlyCost).toBe(15.99);
    });

    test('should enforce free tier limit — 6th sub blocked for free user', async () => {
      for (let i = 0; i < 5; i++) {
        await Subscription.create({ ...baseSub, name: `Sub ${i}`, userId: userA._id });
      }

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ...baseSub, name: 'Sub 6' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Upgrade to Premium');
    });

    test('should allow premium user to bypass free tier limit', async () => {
      userA.isPremium = true;
      await userA.save();
      const freshToken = generateUserToken(userA._id);

      for (let i = 0; i < 5; i++) {
        await Subscription.create({ ...baseSub, name: `Sub ${i}`, userId: userA._id });
      }

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${freshToken}`)
        .send({ ...baseSub, name: 'Sub 6' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/subscriptions/:id', () => {
    test('should update own subscription', async () => {
      const sub = await Subscription.create({ ...baseSub, userId: userA._id });

      const response = await request(app)
        .put(`/api/subscriptions/${sub._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Netflix Updated', cost: 19.99 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.name).toBe('Netflix Updated');
      expect(response.body.subscription.cost).toBe(19.99);
    });

    test('should return 404 on wrong user', async () => {
      const sub = await Subscription.create({ ...baseSub, userId: userA._id });

      const response = await request(app)
        .put(`/api/subscriptions/${sub._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/subscriptions/:id', () => {
    test('should delete own subscription', async () => {
      const sub = await Subscription.create({ ...baseSub, userId: userA._id });

      const response = await request(app)
        .delete(`/api/subscriptions/${sub._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const found = await Subscription.findById(sub._id);
      expect(found).toBeNull();
    });

    test('should return 404 on wrong user', async () => {
      const sub = await Subscription.create({ ...baseSub, userId: userA._id });

      const response = await request(app)
        .delete(`/api/subscriptions/${sub._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Summary computation', () => {
    test('should compute monthlyTotal and yearlyTotal correctly for mixed billing cycles', async () => {
      // monthly $10 -> $10/mo
      await Subscription.create({ ...baseSub, name: 'A', cost: 10, billingCycle: 'monthly', userId: userA._id });
      // yearly $120 -> $10/mo
      await Subscription.create({ ...baseSub, name: 'B', cost: 120, billingCycle: 'yearly', userId: userA._id });
      // quarterly $30 -> $10/mo
      await Subscription.create({ ...baseSub, name: 'C', cost: 30, billingCycle: 'quarterly', userId: userA._id });
      // weekly $10 -> $10 * 52 / 12 ~= 43.33/mo
      await Subscription.create({ ...baseSub, name: 'D', cost: 10, billingCycle: 'weekly', userId: userA._id });

      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const { monthlyTotal, yearlyTotal, count } = response.body.summary;
      expect(count).toBe(4);
      // 10 + 10 + 10 + (10*52/12) = 30 + 43.333... = 73.33
      expect(monthlyTotal).toBeCloseTo(73.33, 1);
      expect(yearlyTotal).toBeCloseTo(monthlyTotal * 12, 1);
    });
  });
});
