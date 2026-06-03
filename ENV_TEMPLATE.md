# ContentFlow AI — Environment Variables Reference

Copy the variables below into your `.env` file (or set them in your hosting provider's dashboard).

## Database
| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string e.g. `mysql://user:pass@host:3306/db` |

## Auth / Session
| Variable | Description |
|---|---|
| `JWT_SECRET` | Long random string used to sign session cookies |

## App
| Variable | Description |
|---|---|
| `APP_URL` | Your production domain e.g. `https://contentflow.ai` — used in email links |

## Google OAuth
Create credentials at https://console.cloud.google.com/apis/credentials  
Enable: YouTube Data API v3 and Google My Business API  
Redirect URI: `https://yourdomain.com/connections` (frontend handles callback)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |

## Meta / Facebook OAuth
Create app at https://developers.facebook.com/apps/  
Required permissions: `pages_manage_posts`, `instagram_content_publish`

| Variable | Description |
|---|---|
| `META_APP_ID` | Facebook App ID |
| `META_APP_SECRET` | Facebook App Secret |

## TikTok OAuth
Create app at https://developers.tiktok.com/  
Required scopes: `user.info.basic`, `video.publish`, `video.upload`

| Variable | Description |
|---|---|
| `TIKTOK_CLIENT_KEY` | TikTok Client Key |
| `TIKTOK_CLIENT_SECRET` | TikTok Client Secret |

## Reddit OAuth
Create app at https://www.reddit.com/prefs/apps (type: web app)

| Variable | Description |
|---|---|
| `REDDIT_CLIENT_ID` | Reddit App Client ID |
| `REDDIT_CLIENT_SECRET` | Reddit App Client Secret |

## Stripe Billing
Get keys from https://dashboard.stripe.com/apikeys  
Create webhook at https://dashboard.stripe.com/webhooks  
Subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Secret Key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID_STARTER` | Price ID for Starter plan ($97/mo) |
| `STRIPE_PRICE_ID_PRO` | Price ID for Pro plan ($197/mo) |
| `STRIPE_PRICE_ID_AGENCY` | Price ID for Agency plan ($497/mo) |

## Resend (Transactional Email)
Get API key from https://resend.com/api-keys  
Verify your sending domain at https://resend.com/domains

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key (`re_...`) |

## Manus Platform (auto-injected on Manus deployments)
| Variable | Description |
|---|---|
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |
| `OWNER_OPEN_ID` | Owner's Manus Open ID |
| `OWNER_NAME` | Owner's display name |
| `BUILT_IN_FORGE_API_URL` | Manus built-in API URL |
| `BUILT_IN_FORGE_API_KEY` | Manus built-in API key (server-side) |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus built-in API key (frontend) |
| `VITE_FRONTEND_FORGE_API_URL` | Manus built-in API URL (frontend) |
