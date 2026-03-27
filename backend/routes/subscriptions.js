const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { userAuthMiddleware } = require('../middleware/userAuth');

const FREE_TIER_LIMIT = 5;

// All routes require auth
router.use(userAuthMiddleware);

// GET / — list all active subscriptions with computed costs + summary
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.user._id,
      isActive: true
    }).sort({ nextRenewalDate: 1 });

    const subsWithCost = subscriptions.map(sub => {
      const monthly = Subscription.monthlyCost(sub);
      return {
        ...sub.toJSON(),
        monthlyCost: parseFloat(monthly.toFixed(2))
      };
    });

    const monthlyTotal = subsWithCost.reduce((sum, s) => sum + s.monthlyCost, 0);
    const yearlyTotal = monthlyTotal * 12;

    res.json({
      success: true,
      subscriptions: subsWithCost,
      summary: {
        monthlyTotal: parseFloat(monthlyTotal.toFixed(2)),
        yearlyTotal: parseFloat(yearlyTotal.toFixed(2)),
        count: subsWithCost.length
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch subscriptions'
    });
  }
});

// POST / — create subscription
router.post('/', async (req, res) => {
  try {
    const user = req.user;

    // Enforce free tier limit
    if (!user.isPremium) {
      const activeCount = await Subscription.countDocuments({
        userId: user._id,
        isActive: true
      });
      if (activeCount >= FREE_TIER_LIMIT) {
        return res.status(403).json({
          success: false,
          error: 'Upgrade to Premium to add more than 5 subscriptions'
        });
      }
    }

    const { name, cost, currency, billingCycle, nextRenewalDate, category, notes } = req.body;

    if (!name || cost === undefined || !billingCycle || !nextRenewalDate) {
      return res.status(400).json({
        success: false,
        error: 'name, cost, billingCycle, and nextRenewalDate are required'
      });
    }

    const subscription = await Subscription.create({
      userId: user._id,
      name,
      cost,
      currency: currency || 'USD',
      billingCycle,
      nextRenewalDate,
      category: category || 'other',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      subscription: {
        ...subscription.toJSON(),
        monthlyCost: parseFloat(Subscription.monthlyCost(subscription).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription'
    });
  }
});

// PUT /:id — update subscription
router.put('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    const allowedFields = ['name', 'cost', 'currency', 'billingCycle', 'nextRenewalDate', 'category', 'isActive', 'notes'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        subscription[field] = req.body[field];
      }
    });

    await subscription.save();

    res.json({
      success: true,
      subscription: {
        ...subscription.toJSON(),
        monthlyCost: parseFloat(Subscription.monthlyCost(subscription).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update subscription'
    });
  }
});

// DELETE /:id — delete subscription
router.delete('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete subscription'
    });
  }
});

module.exports = router;
