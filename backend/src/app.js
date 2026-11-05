import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import ExcelJS from "exceljs";
import { createUser, isUniqueConstraintError } from "./db.js";
import {
  credentialsSchema,
  formSettingsSchema,
  isEmptyAnswer,
  questionUsesProFeatures,
  testimonialSchema,
  validateAnswer,
  validateQuestionOptions,
  widgetSettingsSchema,
  widgetUsesProFeatures,
} from "./validation.js";

const SESSION_COOKIE = "praisify_session";
const GOOGLE_STATE_COOKIE = "praisify_google_state";
const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_AGE_MS = 10 * 60 * 1000;
const FREE_REVIEW_LIMIT = 25;
const BILLING_CYCLES = { monthly: 120, annual: 10 };
const BILLING_EVENTS = new Set([
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.updated",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.completed",
  "subscription.paused",
  "subscription.resumed",
]);

function httpError(status, detail) {
  const error = new Error(detail);
  error.status = status;
  return error;
}

function parsedBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw httpError(400, result.error.issues[0]?.message || "Invalid request.");
  }
  return result.data;
}

function publicUser(user) {
  return { id: user.id, email: user.email };
}

async function getProfile(db, userId) {
  const row = await db.get(`
    SELECT id, email, tier, accepting, form_settings, widget_settings
    FROM users WHERE id = ?
  `, [userId]);
  if (!row) throw httpError(404, "Account not found.");
  const billing = await db.get(`
    SELECT plan, status, current_start, current_end, start_at, pro_until, cancel_at_period_end
    FROM billing_subscriptions WHERE user_id = ?
    ORDER BY updated_at DESC LIMIT 1
  `, [userId]);
  return {
    id: row.id,
    email: row.email,
    tier: row.tier,
    accepting: Boolean(row.accepting),
    form_settings: JSON.parse(row.form_settings),
    widget_settings: JSON.parse(row.widget_settings),
    billing: billing ? { ...billing, cancel_at_period_end: Boolean(billing.cancel_at_period_end) } : null,
  };
}

function testimonialFromRow(row) {
  return {
    id: row.id,
    client_name: row.client_name,
    client_role: row.client_role,
    content: row.content,
    rating: row.rating,
    answers: JSON.parse(row.answers),
    is_approved: Boolean(row.is_approved),
    created_at: row.created_at,
    ...(Object.hasOwn(row, "source_id") ? { source_id: row.source_id, source_name: row.source_name || "Legacy / untagged" } : {}),
  };
}

async function ensureDefaultSource(db, profileId) {
  let source = await db.get("SELECT id FROM testimonial_sources WHERE profile_id = ? AND name = ?", [profileId, "General"]);
  if (!source) {
    const id = randomUUID();
    await db.run(`
      INSERT INTO testimonial_sources (id, profile_id, name, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (profile_id, name) DO NOTHING
    `, [id, profileId, "General", new Date().toISOString()]);
    source = await db.get("SELECT id FROM testimonial_sources WHERE profile_id = ? AND name = ?", [profileId, "General"]);
  }
  return source.id;
}

function exportFilters(query) {
  const schema = z.object({
    scope: z.enum(["filtered", "all"]).default("filtered"),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    source_id: z.union([z.string().uuid(), z.literal("legacy")]).optional(),
    status: z.enum(["approved", "pending"]).optional(),
  });
  const result = schema.safeParse(query);
  if (!result.success) throw httpError(400, "Invalid report filters.");
  const filters = result.data;
  if (filters.from && filters.to && Date.parse(filters.from) > Date.parse(filters.to)) {
    throw httpError(400, "Start date must be on or before end date.");
  }
  return filters;
}

function testimonialExportQuery(profileId, filters) {
  const conditions = ["t.profile_id = ?"];
  const params = [profileId];
  if (filters.scope !== "all") {
    if (filters.from) {
      conditions.push("t.created_at >= ?");
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push("t.created_at < ?");
      params.push(filters.to);
    }
    if (filters.rating) {
      conditions.push("t.rating = ?");
      params.push(filters.rating);
    }
    if (filters.source_id === "legacy") {
      conditions.push("t.source_id IS NULL");
    } else if (filters.source_id) {
      conditions.push("t.source_id = ?");
      params.push(filters.source_id);
    }
    if (filters.status) {
      conditions.push("t.is_approved = ?");
      params.push(filters.status === "approved" ? 1 : 0);
    }
  }
  return { where: conditions.join(" AND "), params };
}

const CSV_COLUMNS = [
  ["client_name", "Customer name"],
  ["client_role", "Role"],
  ["rating", "Rating"],
  ["content", "Review"],
  ["created_at", "Submitted at"],
  ["status", "Status"],
  ["source_name", "Collection source"],
  ["answers", "Additional answers"],
];

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function testimonialExportRow(row) {
  return {
    client_name: row.client_name,
    client_role: row.client_role,
    rating: row.rating,
    content: row.content,
    created_at: row.created_at,
    status: row.is_approved ? "Approved" : "Pending",
    source_name: row.source_name || "Legacy / untagged",
    answers: JSON.stringify(JSON.parse(row.answers)),
  };
}

async function sendTestimonialExport(res, rows, format) {
  const values = rows.map(testimonialExportRow);
  const date = new Date().toISOString().slice(0, 10);
  res.set("Cache-Control", "no-store");
  if (format === "csv") {
    const csv = [
      CSV_COLUMNS.map(([, label]) => csvCell(label)).join(","),
      ...values.map((row) => CSV_COLUMNS.map(([key]) => csvCell(row[key])).join(",")),
    ].join("\r\n");
    res.type("text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="praisify-feedback-${date}.csv"`);
    return res.send(`\uFEFF${csv}`);
  }
  if (format !== "xlsx") throw httpError(400, "Report format must be csv or xlsx.");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Feedback");
  sheet.columns = CSV_COLUMNS.map(([key, header]) => ({ header, key, width: Math.min(60, Math.max(16, header.length + 2)) }));
  for (const row of values) sheet.addRow(row);
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.set("Content-Disposition", `attachment; filename="praisify-feedback-${date}.xlsx"`);
  return res.send(Buffer.from(buffer));
}

function cookieOptions(config) {
  return {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: config.cookieSameSite,
    path: "/",
    maxAge: SESSION_AGE_MS,
  };
}

function setSessionCookie(res, userId, config) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: "7d",
    issuer: "praisify",
    audience: "praisify-web",
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions(config));
}

function googleStateCookieOptions(config) {
  return {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/api/auth/google/callback",
    maxAge: OAUTH_STATE_AGE_MS,
  };
}

function redirectToAuthError(res, config, error) {
  const frontendOrigin = config.frontendOrigins[0];
  return res.redirect(302, `${frontendOrigin}/sign-in?auth_error=${encodeURIComponent(error)}`);
}

function billingEnabled(config) {
  return Boolean(
    config.razorpayKeyId
      && config.razorpayKeySecret
      && config.razorpayMonthlyPlanId
      && config.razorpayAnnualPlanId
      && config.razorpayMonthlyOfferId
      && config.razorpayWebhookSecret,
  );
}

function safeEqualHex(expected, actual) {
  if (typeof actual !== "string" || !/^[0-9a-f]+$/i.test(actual)) return false;
  const expectedBytes = Buffer.from(expected, "hex");
  const actualBytes = Buffer.from(actual, "hex");
  return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes);
}

function billingPeriodEnd(plan, startAt) {
  const end = new Date(startAt * 1000);
  if (plan === "monthly") end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  return Math.floor(end.getTime() / 1000);
}

function safeEpoch(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

async function razorpayRequest(config, fetchImpl, path, { method = "GET", body } = {}) {
  const response = await fetchImpl(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw httpError(502, "Payment provider returned an invalid response.");
  }
  if (!response.ok) {
    console.error("Razorpay API request failed with status", response.status);
    throw httpError(502, "Payment provider request failed. Check the Razorpay plan configuration.");
  }
  return data;
}

async function updateBillingFromWebhook(db, event, entity) {
  const subscriptionId = entity?.id;
  if (typeof subscriptionId !== "string") return;
  const current = await db.get(`
    SELECT user_id, plan, pro_until FROM billing_subscriptions
    WHERE razorpay_subscription_id = ?
  `, [subscriptionId]);
  if (!current) return;

  const status = typeof entity.status === "string" ? entity.status : event.split(".")[1];
  const currentStart = safeEpoch(entity.current_start);
  const currentEnd = safeEpoch(entity.current_end);
  const startAt = safeEpoch(entity.start_at);
  const proUntil = currentEnd || current.pro_until || (
    ["subscription.authenticated", "subscription.activated", "subscription.charged", "subscription.resumed"].includes(event)
      ? billingPeriodEnd(current.plan, Math.floor(Date.now() / 1000))
      : null
  );
  const cancelled = event === "subscription.cancelled" || status === "cancelled";
  await db.run(`
    UPDATE billing_subscriptions
    SET status = ?,
        current_start = COALESCE(?, current_start),
        current_end = COALESCE(?, current_end),
        start_at = COALESCE(?, start_at),
        pro_until = COALESCE(?, pro_until),
        cancel_at_period_end = CASE WHEN ? THEN 0 ELSE cancel_at_period_end END,
        updated_at = ?
    WHERE razorpay_subscription_id = ?
  `, [
    status,
    currentStart,
    currentEnd,
    startAt,
    proUntil,
    Number(cancelled),
    new Date().toISOString(),
    subscriptionId,
  ]);

  const grantsPro = !["subscription.cancelled", "subscription.halted", "subscription.completed"].includes(event)
    && (["authenticated", "active"].includes(status)
      || ["subscription.authenticated", "subscription.activated", "subscription.charged", "subscription.resumed"].includes(event));
  if (grantsPro) {
  await db.run("UPDATE users SET tier = 'pro' WHERE id = ?", [current.user_id]);
  } else if (["subscription.halted", "subscription.completed", "subscription.cancelled", "subscription.paused"].includes(event)
    && (!proUntil || proUntil <= Math.floor(Date.now() / 1000))) {
    await db.run("UPDATE users SET tier = 'free' WHERE id = ?", [current.user_id]);
  }
}

async function fetchGoogleUser(code, config, fetchImpl) {
  const tokenResponse = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleRedirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) throw new Error("Google token exchange failed.");
  const tokens = await tokenResponse.json();
  if (typeof tokens.access_token !== "string" || !tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }

  const profileResponse = await fetchImpl("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) throw new Error("Google profile lookup failed.");
  const profile = await profileResponse.json();
  if (typeof profile.sub !== "string" || !profile.sub
    || profile.email_verified !== true || typeof profile.email !== "string") {
    throw new Error("Google account does not have a verified email.");
  }
  return profile.email.trim().toLowerCase();
}

function requireAuth(config) {
  return (req, res, next) => {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) return res.status(401).json({ detail: "Please sign in to continue." });
    try {
      const payload = jwt.verify(token, config.jwtSecret, {
        issuer: "praisify",
        audience: "praisify-web",
      });
      if (typeof payload === "string" || typeof payload.sub !== "string") {
        return res.status(401).json({ detail: "Your session is invalid. Please sign in again." });
      }
      req.userId = payload.sub;
      return next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ detail: "Your session has expired. Please sign in again." });
      }
      return next(error);
    }
  };
}

function validateQuestionSet(settings) {
  const seen = new Set();
  for (const question of settings.questions) {
    if (seen.has(question.id)) throw httpError(400, "Question IDs must be unique.");
    if (!validateQuestionOptions(question)) {
      throw httpError(400, "Choice questions need at least two options.");
    }
    if (new Set(question.options).size !== question.options.length) {
      throw httpError(400, "Question options must be unique.");
    }
    seen.add(question.id);
  }
}

export function createApp({ db, config, fetchImpl = globalThis.fetch }) {
  const app = express();
  const allowedOrigins = new Set(config.frontendOrigins);
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { detail: "Too many sign-in attempts. Please try again later." },
  });
  const publicSubmitLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { detail: "Too many submissions. Please try again later." },
  });

  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }));
  app.post("/api/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    if (!config.razorpayWebhookSecret) return res.status(503).json({ detail: "Payment webhooks are not configured." });
    const signature = req.get("x-razorpay-signature");
    const expected = createHmac("sha256", config.razorpayWebhookSecret).update(req.body).digest("hex");
    if (!safeEqualHex(expected, signature)) return res.status(400).json({ detail: "Invalid webhook signature." });

    let payload;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ detail: "Invalid webhook payload." });
    }
    if (!BILLING_EVENTS.has(payload.event)) return res.status(200).json({ received: true });
    const entity = payload.payload?.subscription?.entity;
    await updateBillingFromWebhook(db, payload.event, entity);
    return res.status(200).json({ received: true });
  });
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    const origin = req.get("origin");
    if (isMutation && origin && !allowedOrigins.has(origin)) {
      return res.status(403).json({ detail: "This origin is not allowed." });
    }
    return next();
  });

  const auth = requireAuth(config);

  app.get("/api/health", async (_req, res) => {
    await db.get("SELECT 1 AS ok");
    res.json({ status: "ok" });
  });

  app.get("/api/auth/google", authLimiter, (req, res) => {
    if (!config.googleClientId || !config.googleClientSecret || !config.googleRedirectUri) {
      return redirectToAuthError(res, config, "google_not_configured");
    }

    const state = randomBytes(32).toString("base64url");
    res.cookie(GOOGLE_STATE_COOKIE, state, googleStateCookieOptions(config));
    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.search = new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: config.googleRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
    }).toString();
    return res.redirect(302, authorizationUrl.toString());
  });

  app.get("/api/auth/google/callback", authLimiter, async (req, res) => {
    const expectedState = req.cookies[GOOGLE_STATE_COOKIE];
    const receivedState = typeof req.query.state === "string" ? req.query.state : "";
    res.clearCookie(GOOGLE_STATE_COOKIE, googleStateCookieOptions(config));
    const expectedStateBytes = Buffer.from(expectedState || "");
    const receivedStateBytes = Buffer.from(receivedState);
    if (!expectedState || !receivedState
      || expectedStateBytes.length !== receivedStateBytes.length
      || !timingSafeEqual(expectedStateBytes, receivedStateBytes)) {
      return redirectToAuthError(res, config, "google_invalid_state");
    }
    if (req.query.error) return redirectToAuthError(res, config, "google_cancelled");
    if (typeof req.query.code !== "string" || !req.query.code) {
      return redirectToAuthError(res, config, "google_failed");
    }

    try {
      const email = await fetchGoogleUser(req.query.code, config, fetchImpl);
      let row = await db.get("SELECT id, email FROM users WHERE email = ?", [email]);
      if (!row) {
        const user = { id: randomUUID(), email };
        const passwordHash = await bcrypt.hash(randomBytes(48).toString("base64url"), 12);
        try {
          await createUser(db, {
            ...user,
            passwordHash,
            createdAt: new Date().toISOString(),
          });
          row = user;
        } catch (error) {
          if (!isUniqueConstraintError(error)) throw error;
          row = await db.get("SELECT id, email FROM users WHERE email = ?", [email]);
          if (!row) throw error;
        }
      }
      setSessionCookie(res, row.id, config);
      return res.redirect(302, `${config.frontendOrigins[0]}/dashboard`);
    } catch (error) {
      console.error("Google sign-in failed:", error);
      return redirectToAuthError(res, config, "google_failed");
    }
  });

  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const credentials = parsedBody(credentialsSchema, req.body);
    if (Buffer.byteLength(credentials.password, "utf8") > 72) {
      throw httpError(400, "Password must be 72 bytes or fewer.");
    }
    const passwordHash = await bcrypt.hash(credentials.password, 12);
    const user = { id: randomUUID(), email: credentials.email };
    try {
      await createUser(db, {
        id: user.id,
        email: user.email,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw httpError(409, "An account with this email already exists.");
      }
      throw error;
    }
    setSessionCookie(res, user.id, config);
    res.status(201).json({ user });
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const credentials = parsedBody(credentialsSchema, req.body);
    if (Buffer.byteLength(credentials.password, "utf8") > 72) {
      throw httpError(400, "Password must be 72 bytes or fewer.");
    }
    const row = await db.get("SELECT id, email, password_hash FROM users WHERE email = ?", [credentials.email]);
    if (!row || !await bcrypt.compare(credentials.password, row.password_hash)) {
      throw httpError(401, "Email or password is incorrect.");
    }
    const user = publicUser(row);
    setSessionCookie(res, user.id, config);
    res.json({ user });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookieOptions(config));
    res.status(204).end();
  });

  app.get("/api/auth/me", auth, async (req, res) => {
    const row = await db.get("SELECT id, email FROM users WHERE id = ?", [req.userId]);
    if (!row) throw httpError(401, "Please sign in to continue.");
    res.json({ user: publicUser(row) });
  });

  app.get("/api/me", auth, async (req, res) => res.json(await getProfile(db, req.userId)));

  app.put("/api/me/form", auth, async (req, res) => {
    const settings = parsedBody(formSettingsSchema, req.body);
    validateQuestionSet(settings);
    const profile = await getProfile(db, req.userId);
    if (profile.tier === "free" && questionUsesProFeatures(settings)) {
      throw httpError(403, "Custom questions and styling are available on the Pro plan.");
    }
    await db.run("UPDATE users SET form_settings = ? WHERE id = ?", [JSON.stringify(settings), req.userId]);
    res.json(await getProfile(db, req.userId));
  });

  app.put("/api/me/widget", auth, async (req, res) => {
    const settings = parsedBody(widgetSettingsSchema, req.body);
    const profile = await getProfile(db, req.userId);
    if (profile.tier === "free" && widgetUsesProFeatures(settings)) {
      throw httpError(403, "This widget layout and styling are available on the Pro plan.");
    }
    await db.run("UPDATE users SET widget_settings = ? WHERE id = ?", [JSON.stringify(settings), req.userId]);
    res.json(await getProfile(db, req.userId));
  });

  app.get("/api/testimonials", auth, async (req, res) => {
    const rows = await db.all(`
      SELECT t.id, t.client_name, t.client_role, t.content, t.rating, t.answers,
        t.is_approved, t.created_at, t.source_id, s.name AS source_name
      FROM testimonials t
      LEFT JOIN testimonial_sources s ON s.id = t.source_id AND s.profile_id = t.profile_id
      WHERE t.profile_id = ? ORDER BY t.created_at DESC
    `, [req.userId]);
    res.json(rows.map(testimonialFromRow));
  });

  app.get("/api/sources", auth, async (req, res) => {
    await ensureDefaultSource(db, req.userId);
    const sources = await db.all(`
      SELECT s.id, s.name, s.created_at, COUNT(t.id) AS review_count,
        AVG(t.rating) AS average_rating
      FROM testimonial_sources s
      LEFT JOIN testimonials t ON t.source_id = s.id AND t.profile_id = s.profile_id
      WHERE s.profile_id = ?
      GROUP BY s.id, s.name, s.created_at
      ORDER BY s.created_at ASC
    `, [req.userId]);
    res.json(sources.map((source) => ({
      ...source,
      review_count: Number(source.review_count),
      average_rating: source.average_rating === null ? null : Number(source.average_rating),
    })));
  });

  app.post("/api/sources", auth, async (req, res) => {
    const { name } = parsedBody(z.object({ name: z.string().trim().min(1).max(50) }), req.body);
    const sources = await db.all("SELECT name FROM testimonial_sources WHERE profile_id = ?", [req.userId]);
    if (sources.length >= 30) throw httpError(400, "You can create up to 30 collection links.");
    if (sources.some((source) => source.name.toLowerCase() === name.toLowerCase())) {
      throw httpError(409, "A collection link with this name already exists.");
    }
    const source = { id: randomUUID(), name, created_at: new Date().toISOString() };
    await db.run(`
      INSERT INTO testimonial_sources (id, profile_id, name, created_at) VALUES (?, ?, ?, ?)
    `, [source.id, req.userId, source.name, source.created_at]);
    res.status(201).json({ ...source, review_count: 0, average_rating: null });
  });

  app.get("/api/testimonials/export", auth, async (req, res) => {
    const format = req.query.format;
    if (format !== "csv" && format !== "xlsx") throw httpError(400, "Report format must be csv or xlsx.");
    const filters = exportFilters(req.query);
    if (filters.source_id && filters.source_id !== "legacy") {
      const source = await db.get("SELECT id FROM testimonial_sources WHERE id = ? AND profile_id = ?", [filters.source_id, req.userId]);
      if (!source) throw httpError(400, "Invalid collection source.");
    }
    const { where, params } = testimonialExportQuery(req.userId, filters);
    const rows = await db.all(`
      SELECT t.client_name, t.client_role, t.content, t.rating, t.answers, t.is_approved,
        t.created_at, s.name AS source_name
      FROM testimonials t
      LEFT JOIN testimonial_sources s ON s.id = t.source_id AND s.profile_id = t.profile_id
      WHERE ${where}
      ORDER BY t.created_at DESC
    `, params);
    return sendTestimonialExport(res, rows, format);
  });

  app.patch("/api/testimonials/:testimonialId", auth, async (req, res) => {
    const data = parsedBody(z.object({ is_approved: z.boolean() }), req.body);
    const result = await db.run(`
      UPDATE testimonials SET is_approved = ?
      WHERE id = ? AND profile_id = ?
    `, [Number(data.is_approved), req.params.testimonialId, req.userId]);
    if (!result.changes) throw httpError(404, "Testimonial not found.");
    const row = await db.get(`
      SELECT t.id, t.client_name, t.client_role, t.content, t.rating, t.answers,
        t.is_approved, t.created_at, t.source_id, s.name AS source_name
      FROM testimonials t
      LEFT JOIN testimonial_sources s ON s.id = t.source_id AND s.profile_id = t.profile_id
      WHERE t.id = ? AND t.profile_id = ?
    `, [req.params.testimonialId, req.userId]);
    res.json(testimonialFromRow(row));
  });

  app.delete("/api/testimonials/:testimonialId", auth, async (req, res) => {
    const result = await db.run("DELETE FROM testimonials WHERE id = ? AND profile_id = ?", [req.params.testimonialId, req.userId]);
    if (!result.changes) throw httpError(404, "Testimonial not found.");
    res.status(204).end();
  });

  app.get("/api/public/profiles/:profileId", async (req, res) => {
    const row = await db.get("SELECT id, accepting, form_settings FROM users WHERE id = ?", [req.params.profileId]);
    if (!row) throw httpError(404, "Feedback profile not found.");
    if (req.query.source) {
      const source = await db.get(
        "SELECT id FROM testimonial_sources WHERE id = ? AND profile_id = ?",
        [req.query.source, row.id],
      );
      if (!source) throw httpError(404, "Collection link not found.");
    }
    res.json({ id: row.id, accepting: Boolean(row.accepting), form: JSON.parse(row.form_settings) });
  });

  app.post("/api/public/testimonials/:profileId", publicSubmitLimiter, async (req, res) => {
    const payload = parsedBody(testimonialSchema, req.body);
    const profile = await db.get("SELECT id, accepting, tier, form_settings FROM users WHERE id = ?", [req.params.profileId]);
    if (!profile) throw httpError(404, "Feedback profile not found.");
    if (!profile.accepting) throw httpError(403, "This feedback form is not accepting responses.");
    const sourceId = payload.source_id
      ? (await db.get("SELECT id FROM testimonial_sources WHERE id = ? AND profile_id = ?", [payload.source_id, profile.id]))?.id
      : await ensureDefaultSource(db, profile.id);
    if (!sourceId) throw httpError(404, "Collection link not found.");
    const count = Number((await db.get("SELECT COUNT(*) AS count FROM testimonials WHERE profile_id = ?", [profile.id])).count);
    if (profile.tier === "free" && count >= FREE_REVIEW_LIMIT) {
      throw httpError(403, "This account has reached its review limit.");
    }

    const settings = JSON.parse(profile.form_settings);
    const answers = [];
    for (const question of settings.questions) {
      const value = payload.answers[question.id];
      if (question.required && isEmptyAnswer(value)) {
        throw httpError(400, `Please answer: ${question.label}`);
      }
      if (!isEmptyAnswer(value)) {
        if (!validateAnswer(question, value)) {
          throw httpError(400, `Invalid answer for: ${question.label}`);
        }
        answers.push({ question_id: question.id, label: question.label, value });
      }
    }

    const testimonial = {
      id: randomUUID(),
      profile_id: profile.id,
      client_name: payload.client_name,
      client_role: payload.client_role,
      content: payload.content,
      rating: payload.rating,
      answers: JSON.stringify(answers),
      is_approved: 0,
      created_at: new Date().toISOString(),
      source_id: sourceId,
    };
    await db.run(`
      INSERT INTO testimonials (
        id, profile_id, client_name, client_role, content, rating, answers, is_approved, created_at, source_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testimonial.id,
      testimonial.profile_id,
      testimonial.client_name,
      testimonial.client_role,
      testimonial.content,
      testimonial.rating,
      testimonial.answers,
      testimonial.is_approved,
      testimonial.created_at,
      testimonial.source_id,
    ]);
    res.status(201).json(testimonialFromRow(testimonial));
  });

  app.get("/api/public/widget/:profileId", async (req, res) => {
    const profile = await db.get("SELECT id, tier, widget_settings FROM users WHERE id = ?", [req.params.profileId]);
    if (!profile) throw httpError(404, "Widget not found.");
    const settings = JSON.parse(profile.widget_settings);
    const approved = (await db.all(`
      SELECT id, client_name, client_role, content, rating, answers, is_approved, created_at
      FROM testimonials WHERE profile_id = ? AND is_approved = 1
    `, [profile.id])).map(testimonialFromRow);
    const visible = approved
      .filter((testimonial) => testimonial.rating >= settings.min_rating)
      .sort((a, b) => settings.sort === "highest"
        ? b.rating - a.rating || b.created_at.localeCompare(a.created_at)
        : b.created_at.localeCompare(a.created_at))
      .slice(0, settings.max_items);
    const average = approved.length
      ? Math.round((approved.reduce((sum, testimonial) => sum + testimonial.rating, 0) / approved.length) * 10) / 10
      : 0;
    res.json({
      settings,
      testimonials: visible,
      summary: { count: approved.length, average },
      tier: profile.tier,
    });
  });

  app.get("/api/billing/config", (_req, res) => res.json({ enabled: billingEnabled(config) }));
  app.post("/api/billing/subscribe", auth, async (req, res) => {
    if (!billingEnabled(config)) throw httpError(503, "Online payments are not configured yet.");
    const { plan } = parsedBody(z.object({ plan: z.enum(["monthly", "annual"]) }), req.body);
    const existing = await db.get(`
      SELECT status, pro_until FROM billing_subscriptions
      WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
    `, [req.userId]);
    if (existing && (
      ["authenticated", "active"].includes(existing.status)
      || (existing.status === "pending" && existing.pro_until > Math.floor(Date.now() / 1000))
    )) {
      throw httpError(409, "You already have an active or pending subscription.");
    }

    const subscription = await razorpayRequest(config, fetchImpl, "/subscriptions", {
      method: "POST",
      body: {
        plan_id: plan === "monthly" ? config.razorpayMonthlyPlanId : config.razorpayAnnualPlanId,
        ...(plan === "monthly" ? { offer_id: config.razorpayMonthlyOfferId } : {}),
        total_count: BILLING_CYCLES[plan],
        quantity: 1,
        customer_notify: true,
        notes: { user_id: req.userId, plan },
      },
    });
    if (typeof subscription.id !== "string" || !subscription.id) {
      throw httpError(502, "Payment provider did not return a subscription.");
    }
    const timestamp = new Date().toISOString();
    await db.run(`
      INSERT INTO billing_subscriptions (
        razorpay_subscription_id, user_id, plan, status, start_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      subscription.id,
      req.userId,
      plan,
      typeof subscription.status === "string" ? subscription.status : "created",
      safeEpoch(subscription.start_at),
      timestamp,
      timestamp,
    ]);
    res.status(201).json({ subscription_id: subscription.id, key_id: config.razorpayKeyId });
  });
  app.post("/api/billing/verify", auth, async (req, res) => {
    if (!billingEnabled(config)) throw httpError(503, "Online payments are not configured yet.");
    const details = parsedBody(z.object({
      razorpay_payment_id: z.string().min(1).max(100),
      razorpay_subscription_id: z.string().min(1).max(100),
      razorpay_signature: z.string().regex(/^[0-9a-f]{64}$/i),
    }), req.body);
    const subscription = await db.get(`
      SELECT razorpay_subscription_id, user_id, plan
      FROM billing_subscriptions WHERE razorpay_subscription_id = ? AND user_id = ?
    `, [details.razorpay_subscription_id, req.userId]);
    if (!subscription) throw httpError(404, "Subscription was not found for this account.");

    const expected = createHmac("sha256", config.razorpayKeySecret)
      .update(`${details.razorpay_payment_id}|${details.razorpay_subscription_id}`)
      .digest("hex");
    if (!safeEqualHex(expected, details.razorpay_signature)) {
      throw httpError(400, "Payment verification failed.");
    }

    const providerSubscription = await razorpayRequest(
      config,
      fetchImpl,
      `/subscriptions/${encodeURIComponent(details.razorpay_subscription_id)}`,
    );
    const expectedPlanId = subscription.plan === "monthly"
      ? config.razorpayMonthlyPlanId
      : config.razorpayAnnualPlanId;
    if (providerSubscription.plan_id !== expectedPlanId
      || !["authenticated", "active"].includes(providerSubscription.status)) {
      throw httpError(402, "The subscription has not been successfully authorized yet.");
    }

    const now = Math.floor(Date.now() / 1000);
    const currentStart = safeEpoch(providerSubscription.current_start);
    const currentEnd = safeEpoch(providerSubscription.current_end);
    const startAt = safeEpoch(providerSubscription.start_at);
    const proUntil = currentEnd || billingPeriodEnd(subscription.plan, currentStart || now);
    await db.run(`
      UPDATE billing_subscriptions
      SET status = ?,
          current_start = ?,
          current_end = ?,
          start_at = ?,
          pro_until = ?,
          updated_at = ?
      WHERE razorpay_subscription_id = ? AND user_id = ?
    `, [
      providerSubscription.status,
      currentStart,
      currentEnd,
      startAt,
      proUntil,
      new Date().toISOString(),
      details.razorpay_subscription_id,
      req.userId,
    ]);
    await db.run("UPDATE users SET tier = 'pro' WHERE id = ?", [req.userId]);
    res.json({ verified: true, profile: await getProfile(db, req.userId) });
  });
  app.post("/api/billing/cancel", auth, async (req, res) => {
    if (!billingEnabled(config)) throw httpError(503, "Online payments are not configured yet.");
    const subscription = await db.get(`
      SELECT razorpay_subscription_id, status FROM billing_subscriptions
      WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
    `, [req.userId]);
    if (!subscription || !["authenticated", "active", "pending"].includes(subscription.status)) {
      throw httpError(404, "No cancellable subscription was found.");
    }
    const result = await razorpayRequest(
      config,
      fetchImpl,
      `/subscriptions/${encodeURIComponent(subscription.razorpay_subscription_id)}/cancel`,
      { method: "POST", body: { cancel_at_cycle_end: true } },
    );
    await db.run(`
      UPDATE billing_subscriptions
      SET status = ?, cancel_at_period_end = 1, updated_at = ?
      WHERE razorpay_subscription_id = ?
    `, [
      typeof result.status === "string" ? result.status : subscription.status,
      new Date().toISOString(),
      subscription.razorpay_subscription_id,
    ]);
    res.json({ cancelled: true });
  });

  app.use((_req, res) => res.status(404).json({ detail: "Not found." }));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error(error);
    return res.status(status).json({
      detail: status >= 500 ? "An unexpected server error occurred." : error.message,
    });
  });
  return app;
}
