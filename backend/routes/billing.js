const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { userAuthMiddleware } = require('../middleware/userAuth');

function getStripe() {
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// POST /api/billing/create-checkout-session
router.post('/create-checkout-session', userAuthMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    const user = req.user;

    const priceId = plan === 'yearly'
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}?upgrade=success`,
      cancel_url: `${process.env.APP_URL}?upgrade=cancelled`,
      metadata: { userId: user._id.toString() }
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/portal
router.post('/portal', userAuthMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user.stripeCustomerId) {
      return res.status(400).json({ success: false, error: 'No billing account found' });
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.APP_URL
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ success: false, error: 'Failed to open billing portal' });
  }
});

// Webhook handler — exported separately so server.js can mount it before express.json()
async function webhookHandler(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        await User.findByIdAndUpdate(userId, {
          isPremium: true,
          premiumUntil: currentPeriodEnd,
          stripeSubscriptionId: session.subscription
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { isPremium: false, premiumUntil: null, stripeSubscriptionId: null }
      );
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          isPremium: isActive,
          premiumUntil: isActive ? currentPeriodEnd : null
        }
      );
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await User.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          { isPremium: false, premiumUntil: null }
        );
      }
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;
