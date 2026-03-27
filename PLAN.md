# Laftel Sub — Plan

## Problem Being Solved

People subscribe to many digital and physical services — streaming, software, gym memberships, newsletters — and lose track of what they're paying for. Subscriptions silently renew, forgotten services accumulate, and money drains away unnoticed. There is no simple, unified place to see all subscriptions at a glance.

## Target User

Anyone juggling multiple digital or physical subscriptions: Netflix, Spotify, gym memberships, SaaS tools, cloud storage, and more. The typical user has 5–15 active subscriptions and has at some point paid for something they forgot about.

## Monetization Approach

**Freemium model:**

- **Free tier**: Track up to 5 subscriptions. No cost, no time limit.
- **Premium** ($2.99/month or $24.99/year):
  - Unlimited subscriptions
  - Renewal email reminders (7 days before renewal)
  - Monthly spending report emailed to user

## Core Product Scope

### Must Have (Phase 1)
- User accounts (register, login, JWT auth)
- Add, edit, delete subscriptions
- Subscription fields: name, cost, currency, billing cycle, next renewal date, category, notes
- Computed monthly cost per subscription and totals
- Dashboard: monthly/yearly totals, upcoming renewals (next 30 days), per-subscription list
- Free tier enforcement (5 subscription limit)
- Premium upgrade flag on user

### Out of Scope (Phase 1)
- Actual payment processing for premium upgrade
- Email reminders (premium feature — backend hook ready, not wired)
- Monthly spending report emails
- Mobile app (Phase 2, Expo)
- Bank/card import or automatic detection

## Implementation Phases

### Phase 1 (this session)
- Backend: Express + MongoDB
  - User model with bcrypt password hashing
  - Subscription model with billing cycle math
  - Auth routes: register, login, /me
  - Subscription CRUD routes with free-tier enforcement
  - Full test suite (auth + subscriptions)
- Frontend: React SPA
  - Auth page (login / register tabs)
  - Dashboard with summary cards and upcoming renewals
  - Subscription list with edit/delete per row
  - Add/edit modal form

### Phase 2 (future)
- Expo mobile app (iOS + Android)
- Premium payment integration
- Email reminder service
- Monthly spending report emails
