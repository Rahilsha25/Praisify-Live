import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadConfig } from "../src/config.js";

const baseEnv = {
  JWT_SECRET: "test-secret-with-more-than-thirty-two-characters",
};

describe("backend configuration", () => {
  it("accepts a PostgreSQL connection URL", () => {
    const config = loadConfig({
      ...baseEnv,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@db.example.com/praisify?sslmode=require",
    });
    assert.equal(config.databaseUrl, "postgresql://user:password@db.example.com/praisify?sslmode=require");
  });

  it("requires PostgreSQL for production startup", () => {
    assert.throws(
      () => loadConfig({ ...baseEnv, NODE_ENV: "production" }),
      /DATABASE_URL must be set in production/,
    );
  });

  it("rejects non-PostgreSQL database URLs", () => {
    assert.throws(
      () => loadConfig({ ...baseEnv, DATABASE_URL: "https://example.com" }),
      /DATABASE_URL must use the postgres or postgresql protocol/,
    );
  });

  it("requires complete Razorpay configuration before enabling billing", () => {
    assert.throws(
      () => loadConfig({ ...baseEnv, RAZORPAY_KEY_ID: "rzp_test_id" }),
      /All RAZORPAY_KEY_ID.*settings are required/,
    );
    const config = loadConfig({
      ...baseEnv,
      RAZORPAY_KEY_ID: "rzp_test_id",
      RAZORPAY_KEY_SECRET: "key-secret",
      RAZORPAY_PLAN_MONTHLY_ID: "plan_monthly",
      RAZORPAY_PLAN_ANNUAL_ID: "plan_annual",
      RAZORPAY_MONTHLY_OFFER_ID: "offer_intro",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    });
    assert.equal(config.razorpayKeyId, "rzp_test_id");
    assert.equal(config.razorpayWebhookSecret, "webhook-secret");
  });
});
