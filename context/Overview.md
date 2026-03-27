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

The `isPremium` flag on the User model controls access. Payment integration is not implemented in Phase 1.

## Deployment Notes

- Set `NODE_ENV=production` and `MONGODB_URI`, `JWT_SECRET`, `PORT` in environment
- `npm run build` in `frontend/`, then `npm start` in `backend/` — Express serves the React build
- No email service wired yet — premium email features are placeholders for Phase 2

## Key Decisions

- No email confirmation required on register (simple onboarding)
- All subscription routes require JWT auth
- Free tier limit is enforced server-side only
