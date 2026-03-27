const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  billingCycle: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  nextRenewalDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['entertainment', 'productivity', 'health', 'finance', 'utilities', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compute monthly cost based on billing cycle
subscriptionSchema.statics.monthlyCost = function(sub) {
  switch (sub.billingCycle) {
    case 'weekly':
      return sub.cost * 52 / 12;
    case 'monthly':
      return sub.cost;
    case 'quarterly':
      return sub.cost / 3;
    case 'yearly':
      return sub.cost / 12;
    default:
      return sub.cost;
  }
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
