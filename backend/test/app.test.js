import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, it } from "node:test";
import request from "supertest";
import ExcelJS from "exceljs";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/db.js";

const config = {
  frontendOrigins: ["http://localhost:3000"],
  jwtSecret: "test-secret-with-more-than-thirty-two-characters",
  secureCookies: false,
  cookieSameSite: "lax",
};
const razorpayConfig = {
  ...config,
  razorpayKeyId: "rzp_test_id",
  razorpayKeySecret: "razorpay-test-secret",
  razorpayMonthlyPlanId: "plan_monthly",
  razorpayAnnualPlanId: "plan_annual",
  razorpayMonthlyOfferId: "offer_intro",
  razorpayWebhookSecret: "razorpay-webhook-secret",
};

describe("Praisify API", () => {
  let db;
  let app;
  let client;

  beforeEach(async () => {
    db = await createDatabase(":memory:");
    app = createApp({ db, config });
    client = request.agent(app);
  });

  afterEach(async () => db.close());

  function signUp(agent = client, email = "owner@example.com") {
    return agent.post("/api/auth/register").send({ email, password: "password-123" });
  }

  it("creates an email account and establishes an HttpOnly session", async () => {
    const response = await signUp();
    assert.equal(response.status, 201);
    assert.equal(response.body.user.email, "owner@example.com");
    assert.match(response.headers["set-cookie"][0], /HttpOnly/i);

    const session = await client.get("/api/auth/me").expect(200);
    assert.equal(session.body.user.id, response.body.user.id);
    assert.equal((await client.get("/api/me").expect(200)).body.tier, "free");
  });

  it("validates credentials and prevents duplicate email accounts", async () => {
    await client.post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" })
      .expect(400);

    await signUp().expect(201);
    await client.post("/api/auth/register")
      .send({ email: "OWNER@example.com", password: "password-123" })
      .expect(409);

    await client.post("/api/auth/login")
      .send({ email: "owner@example.com", password: "incorrect-password" })
      .expect(401);
  });

  it("allows email/password login and clears the session on logout", async () => {
    await signUp().expect(201);
    const loginClient = request.agent(app);
    const login = await loginClient.post("/api/auth/login")
      .send({ email: "OWNER@example.com", password: "password-123" })
      .expect(200);
    assert.equal(login.body.user.email, "owner@example.com");
    await loginClient.get("/api/auth/me").expect(200);

    await loginClient.post("/api/auth/logout").expect(204);
    await loginClient.get("/api/auth/me").expect(401);
  });

  it("explains when Google sign-in has not been configured", async () => {
    const response = await client.get("/api/auth/google").expect(302);
    assert.equal(response.headers.location, "http://localhost:3000/sign-in?auth_error=google_not_configured");
  });

  it("signs a verified Google account in and creates its Praisify account", async () => {
    let appCalls = 0;
    const googleConfig = {
      ...config,
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      googleRedirectUri: "http://localhost:4000/api/auth/google/callback",
    };
    app = createApp({
      db,
      config: googleConfig,
      fetchImpl: async (url, options) => {
        appCalls += 1;
        if (url === "https://oauth2.googleapis.com/token") {
          assert.equal(options.method, "POST");
          assert.match(options.body.toString(), /code=google-code/);
          return { ok: true, json: async () => ({ access_token: "google-access-token" }) };
        }
        assert.equal(url, "https://openidconnect.googleapis.com/v1/userinfo");
        assert.equal(options.headers.Authorization, "Bearer google-access-token");
        return {
          ok: true,
          json: async () => ({
            sub: "google-user-id",
            email: "Google.Owner@example.com",
            email_verified: true,
          }),
        };
      },
    });
    client = request.agent(app);

    const start = await client.get("/api/auth/google").expect(302);
    const authorization = new URL(start.headers.location);
    const state = authorization.searchParams.get("state");
    assert.equal(authorization.origin, "https://accounts.google.com");
    assert.equal(authorization.searchParams.get("client_id"), googleConfig.googleClientId);
    assert.equal(authorization.searchParams.get("redirect_uri"), googleConfig.googleRedirectUri);
    assert.match(start.headers["set-cookie"][0], /HttpOnly/i);

    const callback = await client.get(`/api/auth/google/callback?code=google-code&state=${state}`).expect(302);
    assert.equal(callback.headers.location, "http://localhost:3000/dashboard");
    assert.equal(appCalls, 2);
    const session = await client.get("/api/auth/me").expect(200);
    assert.equal(session.body.user.email, "google.owner@example.com");
    assert.equal((await client.get("/api/me").expect(200)).body.tier, "free");
  });

  it("rejects a Google callback with an invalid OAuth state", async () => {
    const response = await client.get("/api/auth/google/callback?code=google-code&state=wrong").expect(302);
    assert.equal(response.headers.location, "http://localhost:3000/sign-in?auth_error=google_invalid_state");
  });

  it("creates an INR subscription and grants Pro only after server-side verification", async () => {
    let createdSubscription;
    app = createApp({
      db,
      config: razorpayConfig,
      fetchImpl: async (url, options) => {
        if (url.endsWith("/subscriptions") && options.method === "POST") {
          createdSubscription = JSON.parse(options.body);
          return {
            ok: true,
            json: async () => ({ id: "sub_monthly_1", status: "created", start_at: null }),
          };
        }
        assert.equal(url, "https://api.razorpay.com/v1/subscriptions/sub_monthly_1");
        return {
          ok: true,
          json: async () => ({
            id: "sub_monthly_1",
            plan_id: "plan_monthly",
            status: "authenticated",
            current_start: Math.floor(Date.now() / 1000),
            current_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            start_at: null,
          }),
        };
      },
    });
    client = request.agent(app);
    await signUp().expect(201);
    await client.get("/api/billing/config").expect(200).expect(({ body }) => assert.equal(body.enabled, true));

    const checkout = await client.post("/api/billing/subscribe").send({ plan: "monthly" }).expect(201);
    assert.equal(checkout.body.subscription_id, "sub_monthly_1");
    assert.equal(checkout.body.key_id, razorpayConfig.razorpayKeyId);
    assert.deepEqual(createdSubscription, {
      plan_id: "plan_monthly",
      offer_id: "offer_intro",
      total_count: 120,
      quantity: 1,
      customer_notify: true,
      notes: { user_id: (await client.get("/api/auth/me").expect(200)).body.user.id, plan: "monthly" },
    });

    const paymentId = "pay_test_1";
    const signature = createHmac("sha256", razorpayConfig.razorpayKeySecret)
      .update(`${paymentId}|sub_monthly_1`)
      .digest("hex");
    const verified = await client.post("/api/billing/verify")
      .send({
        razorpay_payment_id: paymentId,
        razorpay_subscription_id: "sub_monthly_1",
        razorpay_signature: signature,
      })
      .expect(200);
    assert.equal(verified.body.verified, true);
    assert.equal(verified.body.profile.tier, "pro");
    assert.equal(verified.body.profile.billing.plan, "monthly");
    assert.equal(verified.body.profile.billing.status, "authenticated");
  });

  it("verifies Razorpay webhooks and updates subscription access", async () => {
    app = createApp({
      db,
      config: razorpayConfig,
      fetchImpl: async () => { throw new Error("Unexpected provider call"); },
    });
    client = request.agent(app);
    const account = await signUp().expect(201);
    await db.run("UPDATE users SET tier = 'pro' WHERE id = ?", [account.body.user.id]);
    await db.run(`
      INSERT INTO billing_subscriptions (
        razorpay_subscription_id, user_id, plan, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, ["sub_webhook_1", account.body.user.id, "monthly", "active", new Date().toISOString(), new Date().toISOString()]);

    const payload = JSON.stringify({
      event: "subscription.halted",
      payload: { subscription: { entity: { id: "sub_webhook_1", status: "halted" } } },
    });
    const signature = createHmac("sha256", razorpayConfig.razorpayWebhookSecret).update(payload).digest("hex");
    await request(app).post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signature)
      .send(payload)
      .expect(200);
    const profile = await client.get("/api/me").expect(200);
    assert.equal(profile.body.tier, "free");

    await request(app).post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "00".repeat(32))
      .send(payload)
      .expect(400);
  });

  it("stores, moderates, and serves testimonials only to their owner and public widget", async () => {
    const account = await signUp();
    const profileId = account.body.user.id;

    const submission = await request(app).post(`/api/public/testimonials/${profileId}`)
      .send({
        client_name: "Maya Chen",
        client_role: "Founder",
        content: "Great work.",
        rating: 5,
        answers: {},
      })
      .expect(201);
    assert.equal(submission.body.is_approved, false);

    const list = await client.get("/api/testimonials").expect(200);
    assert.equal(list.body.length, 1);
    const testimonialId = list.body[0].id;

    await client.patch(`/api/testimonials/${testimonialId}`)
      .send({ is_approved: true })
      .expect(200);
    const widget = await request(app).get(`/api/public/widget/${profileId}`).expect(200);
    assert.equal(widget.body.testimonials.length, 1);
    assert.deepEqual(widget.body.summary, { count: 1, average: 5 });

    const otherOwner = request.agent(app);
    await signUp(otherOwner, "other@example.com").expect(201);
    await otherOwner.patch(`/api/testimonials/${testimonialId}`)
      .send({ is_approved: false })
      .expect(404);

    await client.delete(`/api/testimonials/${testimonialId}`).expect(204);
    const emptyWidget = await request(app).get(`/api/public/widget/${profileId}`).expect(200);
    assert.equal(emptyWidget.body.testimonials.length, 0);
  });

  it("tracks labeled collection links and exports owner-scoped filtered CSV and Excel reports", async () => {
    const account = await signUp();
    const profileId = account.body.user.id;
    const source = await client.post("/api/sources").send({ name: "Instagram" }).expect(201);
    const general = (await client.get("/api/sources").expect(200)).body
      .find((item) => item.name === "General");

    await request(app).post(`/api/public/testimonials/${profileId}`)
      .send({
        source_id: source.body.id,
        client_name: "Maya Chen",
        client_role: "Founder",
        content: "Instagram campaign review.",
        rating: 5,
        answers: {},
      })
      .expect(201);
    await request(app).post(`/api/public/testimonials/${profileId}`)
      .send({
        client_name: "Sam Lee",
        content: "General feedback.",
        rating: 3,
        answers: {},
      })
      .expect(201);
    await db.run(`
      INSERT INTO testimonials (
        id, profile_id, client_name, client_role, content, rating, answers, is_approved, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["legacy-1", profileId, "Legacy Reviewer", "", "Imported before source tracking.", 4, "[]", 0, new Date().toISOString()]);

    const listing = await client.get("/api/testimonials").expect(200);
    assert.equal(listing.body.find((item) => item.client_name === "Maya Chen").source_name, "Instagram");
    assert.equal(listing.body.find((item) => item.client_name === "Sam Lee").source_id, general.id);
    assert.equal(listing.body.find((item) => item.client_name === "Legacy Reviewer").source_name, "Legacy / untagged");
    assert.equal((await client.get("/api/sources").expect(200)).body
      .find((item) => item.id === source.body.id).review_count, 1);

    const csv = await client.get(`/api/testimonials/export?format=csv&source_id=${source.body.id}&rating=5&status=pending`)
      .expect(200);
    assert.match(csv.headers["content-disposition"], /praisify-feedback-.*\.csv/);
    assert.match(csv.text, /Maya Chen/);
    assert.doesNotMatch(csv.text, /Sam Lee/);

    const allCsv = await client.get("/api/testimonials/export?format=csv&scope=all&rating=5").expect(200);
    assert.match(allCsv.text, /Maya Chen/);
    assert.match(allCsv.text, /Sam Lee/);
    const legacyCsv = await client.get("/api/testimonials/export?format=csv&source_id=legacy").expect(200);
    assert.match(legacyCsv.text, /Legacy Reviewer/);
    assert.doesNotMatch(legacyCsv.text, /Maya Chen|Sam Lee/);

    const workbookResponse = await client.get(`/api/testimonials/export?format=xlsx&source_id=${source.body.id}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    assert.match(workbookResponse.headers["content-type"], /spreadsheetml\.sheet/);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(workbookResponse.body);
    assert.equal(workbook.getWorksheet("Feedback").getRow(2).getCell(1).value, "Maya Chen");

    await client.get(`/api/testimonials/export?format=csv&source_id=${source.body.id}`)
      .expect(200);
    const otherOwner = request.agent(app);
    await signUp(otherOwner, "other@example.com").expect(201);
    const otherCsv = await otherOwner.get("/api/testimonials/export?format=csv").expect(200);
    assert.doesNotMatch(otherCsv.text, /Maya Chen|Sam Lee/);
    await otherOwner.get(`/api/testimonials/export?format=csv&source_id=${source.body.id}`).expect(400);
  });

  it("stores form and widget settings while keeping Pro features server-gated", async () => {
    const account = await signUp();
    const profile = await client.get("/api/me").expect(200);
    await client.put("/api/me/form").send(profile.body.form_settings).expect(200);
    await client.put("/api/me/widget").send(profile.body.widget_settings).expect(200);

    const proForm = {
      ...profile.body.form_settings,
      questions: [{
        id: "q_1",
        type: "short_text",
        label: "What did you like?",
        required: false,
        options: [],
      }],
    };
    await client.put("/api/me/form").send(proForm).expect(403);

    const publicProfile = await request(app).get(`/api/public/profiles/${account.body.user.id}`).expect(200);
    assert.equal(publicProfile.body.accepting, true);
    assert.deepEqual(publicProfile.body.form.questions, []);
  });
});
