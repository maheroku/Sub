# Changelog

## 2026-03-27

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
