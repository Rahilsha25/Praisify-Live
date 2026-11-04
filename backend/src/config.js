import "dotenv/config";

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("COOKIE_SECURE must be true or false.");
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }

  const cookieSameSite = env.COOKIE_SAME_SITE || (nodeEnv === "production" ? "none" : "lax");
  if (!["lax", "strict", "none"].includes(cookieSameSite)) {
    throw new Error("COOKIE_SAME_SITE must be lax, strict, or none.");
  }
  const secureCookies = parseBoolean(env.COOKIE_SECURE, nodeEnv === "production");
  if (cookieSameSite === "none" && !secureCookies) {
    throw new Error("COOKIE_SECURE must be true when COOKIE_SAME_SITE is none.");
  }

  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  const databaseUrl = env.DATABASE_URL || "";
  if (databaseUrl) {
    let parsed;
    try {
      parsed = new URL(databaseUrl);
    } catch {
      throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
    }
  } else if (nodeEnv === "production") {
    throw new Error("DATABASE_URL must be set in production. SQLite is intended for local development.");
  }

  const frontendOrigins = (env.FRONTEND_ORIGINS || "http://localhost:3000")
    .split(",").map((origin) => origin.trim()).filter(Boolean)
    .map((origin) => {
      let parsed;
      try {
        parsed = new URL(origin);
      } catch {
        throw new Error(`Invalid frontend origin: ${origin}`);
      }
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
        throw new Error(`Invalid frontend origin: ${origin}`);
      }
      return parsed.origin;
    });

  const googleClientId = env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET || "";
  const googleRedirectUri = env.GOOGLE_REDIRECT_URI || "";
  const hasGoogleConfig = Boolean(googleClientId || googleClientSecret || googleRedirectUri);
  if (hasGoogleConfig && (!googleClientId || !googleClientSecret || !googleRedirectUri)) {
    throw new Error("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI must all be set to enable Google sign-in.");
  }
  if (googleRedirectUri) {
    let parsed;
    try {
      parsed = new URL(googleRedirectUri);
    } catch {
      throw new Error("GOOGLE_REDIRECT_URI must be a valid URL.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("GOOGLE_REDIRECT_URI must use HTTP or HTTPS.");
    }
  }

  const razorpayKeyId = env.RAZORPAY_KEY_ID || "";
  const razorpayKeySecret = env.RAZORPAY_KEY_SECRET || "";
  const razorpayMonthlyPlanId = env.RAZORPAY_PLAN_MONTHLY_ID || "";
  const razorpayAnnualPlanId = env.RAZORPAY_PLAN_ANNUAL_ID || "";
  const razorpayMonthlyOfferId = env.RAZORPAY_MONTHLY_OFFER_ID || "";
  const razorpayWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET || "";
  const razorpayValues = [
    razorpayKeyId,
    razorpayKeySecret,
    razorpayMonthlyPlanId,
    razorpayAnnualPlanId,
    razorpayMonthlyOfferId,
    razorpayWebhookSecret,
  ];
  const hasRazorpayConfig = razorpayValues.some(Boolean);
  if (hasRazorpayConfig && razorpayValues.some((value) => !value)) {
    throw new Error("All RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_MONTHLY_ID, RAZORPAY_PLAN_ANNUAL_ID, RAZORPAY_MONTHLY_OFFER_ID, and RAZORPAY_WEBHOOK_SECRET settings are required to enable billing.");
  }

  return {
    port,
    nodeEnv,
    jwtSecret,
    databaseUrl,
    databasePath: env.DATABASE_PATH || "./data/praisify.sqlite",
    frontendOrigins,
    secureCookies,
    cookieSameSite,
    googleClientId,
    googleClientSecret,
    googleRedirectUri,
    razorpayKeyId,
    razorpayKeySecret,
    razorpayMonthlyPlanId,
    razorpayAnnualPlanId,
    razorpayMonthlyOfferId,
    razorpayWebhookSecret,
  };
}
