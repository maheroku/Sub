# Changelog

## 2026-03-27

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
