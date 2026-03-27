# Changelog

## 2026-03-27 (Stripe premium upgrade flow)

### feat: Stripe premium upgrade flow

- Added `stripeCustomerId` and `stripeSubscriptionId` fields to User model
- Created `backend/routes/billing.js`: POST /create-checkout-session (monthly/yearly plan), POST /portal (Stripe billing portal), and a webhookHandler for checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.payment_failed
- Webhook mounted before express.json() in server.js to receive raw body for signature verification
- Added 5 Stripe env vars to .example.env (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_MONTHLY_PRICE_ID, STRIPE_YEARLY_PRICE_ID, APP_URL)
- Frontend: created billing.js API module, UpgradeModal with monthly/yearly plan selection, wired Dashboard with upgrade and manage-subscription buttons, success banner on return from checkout
- 11 new billing tests using jest.mock('stripe'); all 40 backend + 16 frontend tests pass

## 2026-03-27

### chore: add frontend component tests for SubscriptionList and SubscriptionForm

Added @testing-library/react, @testing-library/jest-dom, and @testing-library/user-event to the frontend. Created src/__tests__/SubscriptionList.test.js (8 tests): empty state, subscription rendering, urgent renewal badge within/beyond 7 days, onEdit/onDelete handler calls, category badge, multiple subscriptions. Created src/__tests__/SubscriptionForm.test.js (8 tests): add/edit titles, field pre-population from initial value, cancel button, overlay click dismiss, form submission with correct data, error display, loading/disabled state. All 16 frontend tests pass. Updated README to include the frontend test command.

### Premium email jobs: renewal reminders and monthly spending reports

- Added nodemailer + node-cron dependencies
- `backend/services/emailService.js`: SMTP email service with sendRenewalReminder and sendMonthlyReport; supports transporter injection for testing
- `backend/jobs/schedulerService.js`: daily renewal reminder job (09:00, 7-day lookahead, premium users only) and monthly report job (08:00 on 1st, all premium users)
- Wired scheduler startup into server.js after MongoDB connects; skipped in test env
- Added 6 EMAIL_* env vars to .example.env
- 10 new tests in emailJobs.test.js using jest.mock for transport isolation; 29 tests total, all passing
- Updated context/Overview.md with email job docs

### Initial project setup

- Created Laftel Sub project — a personal subscription tracker web app
- Backend: Express.js REST API with MongoDB
  - User model with bcrypt password hashing, password validation, JWT auth
  - Subscription model with billing cycle math (weekly/monthly/quarterly/yearly to monthly equivalent)
  - Auth routes: POST /register, POST /login, GET /me
  - Subscription CRUD routes with free-tier limit enforcement (5 subs for free users)
  - Full test suite for auth and subscriptions using mongodb-memory-server
- Frontend: React SPA
  - AuthPage with login/register tab toggle
  - Dashboard with summary cards (monthly/yearly totals, count), upcoming renewals section, add subscription button
  - SubscriptionList with edit/delete actions, urgent renewal highlighting (within 7 days)
  - SubscriptionForm modal for add/edit
  - Fetch-based API layer with JWT from localStorage
- Context docs: Overview.md, Subscriptions.md
- Plan document: PLAN.md
