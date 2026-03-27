# Subscriptions — Data Model & Logic

## Subscription Schema (`backend/models/Subscription.js`)

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId (ref User) | Required, indexed |
| name | String | Required, max 100 chars |
| cost | Number | Required, min 0 |
| currency | String | Default 'USD', stored uppercase |
| billingCycle | String | Enum: weekly / monthly / quarterly / yearly |
| nextRenewalDate | Date | Required |
| category | String | Enum: entertainment / productivity / health / finance / utilities / other |
| isActive | Boolean | Default true |
| notes | String | Optional, max 500 chars |

Timestamps (`createdAt`, `updatedAt`) are added automatically.

## monthlyCost Calculation

The static `Subscription.monthlyCost(sub)` method normalizes any billing cycle to a monthly equivalent:

| Billing Cycle | Formula |
|---|---|
| weekly | cost × 52 / 12 |
| monthly | cost |
| quarterly | cost / 3 |
| yearly | cost / 12 |

The result is returned as a float (rounded to 2 decimal places in API responses).

## Free Tier Limit

- `FREE_TIER_LIMIT = 5` (defined in `backend/routes/subscriptions.js`)
- On `POST /api/subscriptions`, if the user is not premium and has 5+ active subscriptions, the request is rejected with HTTP 403:
  `"Upgrade to Premium to add more than 5 subscriptions"`
- Premium users (`isPremium: true`) bypass this check entirely

## Summary Response

`GET /api/subscriptions` returns a `summary` object alongside the list:

```json
{
  "monthlyTotal": 45.97,
  "yearlyTotal": 551.64,
  "count": 4
}
```

`monthlyTotal` is the sum of all active subscriptions' monthly equivalents.
`yearlyTotal = monthlyTotal * 12`.
