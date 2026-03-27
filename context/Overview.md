# Laftel Sub — Project Overview

## What It Does

Laftel Sub is a personal subscription tracker. Users add their digital and physical subscriptions, see a monthly/yearly cost summary, and get warned when renewals are approaching.

## Architecture

- **Backend**: Express.js REST API — `backend/`
  - MongoDB via Mongoose for persistence
  - JWT authentication (365-day tokens)
  - Runs on port 5001 by default
- **Frontend**: React SPA — `frontend/`
  - Served by react-scripts in development
  - Proxies API calls to `localhost:5001`
  - In production, served as static files by Express

## Monetization

**Freemium:**
- Free tier: up to 5 active subscriptions, no time limit
- Premium ($2.99/month or $24.99/year):
  - Unlimited subscriptions
  - Renewal email reminders (7 days before)
  - Monthly spending report emails

The `isPremium` flag on the User model controls access. Payment is processed via Stripe Checkout (see Billing section below).

## Deployment Notes

- Set `NODE_ENV=production` and `MONGODB_URI`, `JWT_SECRET`, `PORT` in environment
- Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` for SMTP
- `npm run build` in `frontend/`, then `npm start` in `backend/` — Express serves the React build
- Email jobs start automatically on server startup (after MongoDB connects)

## Billing

Stripe Checkout handles premium upgrades. Three billing routes in `backend/routes/billing.js`:

- **POST /api/billing/create-checkout-session**: creates a Stripe Checkout session for `monthly` or `yearly` plan; auto-creates a Stripe customer on first checkout and stores `stripeCustomerId` on the User
- **POST /api/billing/portal**: opens the Stripe Billing Portal so premium users can manage or cancel their subscription
- **POST /api/billing/webhook**: verifies Stripe signature and processes events:
  - `checkout.session.completed` → sets `isPremium = true`, stores `premiumUntil` and `stripeSubscriptionId`
  - `customer.subscription.deleted` → revokes premium
  - `customer.subscription.updated` → syncs status
  - `invoice.payment_failed` → revokes premium

The webhook is mounted before `express.json()` in `server.js` to preserve the raw request body required for signature verification.

Required env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`, `APP_URL`.

In the frontend, the "Upgrade to Premium" button opens an `UpgradeModal` with plan selection. Premium users see a "Manage Subscription" button instead.

## Email Jobs

Two scheduled jobs run for premium users:
- **Renewal reminders** (`backend/jobs/schedulerService.js`): daily at 09:00, finds subscriptions renewing in exactly 7 days and emails the owner
- **Monthly spending report** (`backend/jobs/schedulerService.js`): 1st of each month at 08:00, emails all premium users their full subscription cost summary

Email sending is handled by `backend/services/emailService.js` (nodemailer SMTP).

## Key Decisions

- No email confirmation required on register (simple onboarding)
- All subscription routes require JWT auth
- Free tier limit is enforced server-side only
