# Praisify

Praisify is a React app for collecting and displaying testimonials. The included Express backend stores app data in local SQLite during development and can use PostgreSQL in production.

## Run locally

1. Install frontend dependencies from the project root:

   ```powershell
   npm install --legacy-peer-deps
   ```

2. Install backend dependencies and create its environment file:

   ```powershell
   Set-Location backend
   npm install
   Copy-Item .env.example .env

   $secret = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
   (Get-Content .env) -replace '^JWT_SECRET=.*$', "JWT_SECRET=$secret" | Set-Content .env
   ```

   Keep this value private. SQLite data is stored in `backend/data/praisify.sqlite`.

3. Start the API in that terminal:

   ```powershell
   npm run dev
   ```

   Leave it running. You should see `Praisify API listening on port 4000`.

4. In a second terminal at the project root, start (or restart) the frontend:

   ```powershell
   npm start
   ```

The frontend development server proxies `/api` requests to `http://localhost:4000`. Keep both terminals running. Locally, data is stored in `backend/data/praisify.sqlite` (not in the browser); that file remains on your computer unless you delete it. The API creates accounts on first signup, uses an HttpOnly session cookie (Secure in production), and supports profiles, testimonials, public feedback forms, and widgets.

## Authentication and deployment

Authentication supports email/password and optional Google sign-in. Email verification and password reset are not configured. Razorpay subscription checkout is implemented but remains disabled until its credentials, plans, introductory offer, and webhook are configured.

To enable Google sign-in locally, create an OAuth 2.0 Client ID of type **Web application** in Google Cloud Console. Add `http://localhost:4000/api/auth/google/callback` as an authorized redirect URI, then set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `backend/.env`. The redirect URI must exactly match the URI registered with Google. The Google option appears on both sign-in and sign-up pages; without these settings, using it returns a clear configuration message and email/password remains available.

### Razorpay subscriptions

The app prices Praisify Pro in INR: ₹249 for the first monthly cycle, then ₹499/month; or ₹4,999/year. Razorpay plans use a maximum of 120 monthly cycles (10 years) or 10 annual cycles (10 years); customers can cancel at any time.

In the Razorpay Dashboard, using **Test Mode** first:

1. Create a monthly subscription plan for ₹499, billed every month.
2. Create an annual subscription plan for ₹4,999, billed every year.
3. Create a subscription offer for the monthly plan: a **single-use flat discount of ₹250**, with no payment-method restriction unless desired. This makes the first ₹499 cycle cost ₹249.
4. Copy the Test API Key ID and Key Secret. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_MONTHLY_ID`, `RAZORPAY_PLAN_ANNUAL_ID`, and `RAZORPAY_MONTHLY_OFFER_ID` in `backend/.env`.
5. Add a Razorpay webhook endpoint at `https://<your-public-api-host>/api/webhooks/razorpay`. Subscribe to `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.updated`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `subscription.paused`, and `subscription.resumed`. Set the webhook secret as `RAZORPAY_WEBHOOK_SECRET`.
6. Restart the backend. `/api/billing/config` will report billing as enabled only when all required Razorpay settings are present.

The app verifies Checkout signatures server-side and confirms subscription status with Razorpay before enabling Pro. Webhooks must be reachable over HTTPS for ongoing renewals and cancellation status updates. Do not use live keys until test subscriptions, cancellations, renewal notifications, and webhook delivery have been verified.

For deployment, use a managed PostgreSQL database and set its private connection URL as `DATABASE_URL` in the backend environment. When `DATABASE_URL` is set, the backend uses PostgreSQL; otherwise local development uses SQLite at `DATABASE_PATH`. Production startup requires `DATABASE_URL` to avoid accidentally storing live data on an ephemeral local disk. The PostgreSQL schema is created automatically at backend startup. This setup starts the production database empty; existing local SQLite records are not copied.

Recommended hosting for this app: Vercel for the React frontend, Render for the Express API, and Neon for managed PostgreSQL. On Neon, create a database and copy its connection string (with SSL enabled) into Render's `DATABASE_URL` secret. Set `FRONTEND_ORIGINS` to the exact deployed frontend origin, `JWT_SECRET` to a new random secret, and production cookie settings to `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` when frontend and API are on different sites. Set `GOOGLE_REDIRECT_URI` to the deployed backend callback URL and register that exact URL with Google. Set the frontend's `REACT_APP_BACKEND_URL` to the deployed backend origin when needed. Use HTTPS for all production URLs and never commit real environment secrets.

The included Render Blueprint uses the Free web-service plan to make initial testing possible without a payment method. Free web services spin down after 15 minutes without traffic and can take about a minute to start again; their local filesystem is also ephemeral. Praisify stores persistent app data in Neon, not on the service filesystem. Upgrade the API to an always-on paid plan before relying on it for a production launch.

## Tests and build

- Backend tests: `Set-Location backend; npm test`
- Frontend production build: `npm run build` from the project root
