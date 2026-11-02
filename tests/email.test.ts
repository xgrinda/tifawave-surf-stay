import { test } from "node:test";
import assert from "node:assert/strict";
import {
  processEmailBatch,
  type EmailPort,
  type MailJob,
} from "../lib/email/processor.ts";
import {
  deliverEmail,
  DeliveryError,
  type Delivery,
} from "../lib/email/delivery.ts";
import { scheduledEmailHandler } from "../lib/email/scheduled-handler.ts";

const env = {
  TIFAWAVE_ENV: "staging",
  TIFAWAVE_STAGING_PROJECT_REF: "cjtrnnpqwkorxwqhtjeq",
  TIFAWAVE_PRODUCTION_PROJECT_REF: "tuzefzcosvvhzffbxhpm",
  NEXT_PUBLIC_SUPABASE_URL: "https://cjtrnnpqwkorxwqhtjeq.supabase.co",
  SUPABASE_URL: "https://cjtrnnpqwkorxwqhtjeq.supabase.co",
  STAGING_EMAIL_ALLOWLIST: "admin@tifawave.com",
  BOOKING_EMAIL_FROM: "Tifawave Staging <admin@tifawave.com>",
  BOOKING_NOTIFICATION_EMAIL: "admin@tifawave.com",
  RESEND_API_KEY: "local-transport-fixture",
};
const snapshot = {
  name: "Disposable fixture",
  email: "admin@tifawave.com",
  phone: null,
  checkIn: "2099-01-01",
  checkOut: "2099-01-03",
  guests: 2,
  locale: "en",
  reference: "TW-QA",
  preference: null,
  notes: "private note",
  bookingType: "stay_only",
  package: null,
  units: [],
};
const job = (): MailJob => ({
  id: "00000000-0000-4000-8000-000000000010",
  event: "received",
  payload: snapshot,
  lease_token: "lease",
});
test("ambiguous acknowledgement retries the identical frozen message with one provider delivery", async () => {
  const j = job();
  let frozen: Delivery | undefined;
  let finishFails = true;
  let acknowledged = false;
  const provider = new Map<string, string>();
  const bodies: string[] = [];
  const port: EmailPort = {
    claim: async () =>
      acknowledged ? [] : [{ ...j, delivery_payload: frozen }],
    prepare: async (_j, candidate) => (frozen ??= candidate),
    send: async (message, key) => {
      bodies.push(JSON.stringify(message));
      if (!provider.has(key)) provider.set(key, "provider-one");
      return provider.get(key)!;
    },
    finish: async (_j, result) => {
      if (finishFails) throw Error("database unavailable");
      acknowledged = result.success;
    },
  };
  assert.deepEqual(await processEmailBatch(port, env), {
    sent: 0,
    failed: 0,
    deferred: 1,
  });
  finishFails = false;
  assert.deepEqual(
    await processEmailBatch(port, {
      ...env,
      BOOKING_EMAIL_FROM: "Changed <admin@tifawave.com>",
    }),
    { sent: 1, failed: 0, deferred: 0 },
  );
  assert.equal(provider.size, 1);
  assert.equal(bodies[0], bodies[1]);
  assert.ok(!bodies[0].includes("private note"));
  assert.deepEqual(await processEmailBatch(port, env), {
    sent: 0,
    failed: 0,
    deferred: 0,
  });
});
test("provider failures are recorded without exposing response bodies or credentials", async () => {
  let final: unknown;
  const port: EmailPort = {
    claim: async () => [job()],
    prepare: async (_j, d) => d,
    send: (d, key) =>
      deliverEmail(d, key, env, async () =>
        Response.json({ secret: "must not escape" }, { status: 503 }),
      ),
    finish: async (_j, result) => {
      final = result;
    },
  };
  assert.deepEqual(await processEmailBatch(port, env), {
    sent: 0,
    failed: 1,
    deferred: 0,
  });
  assert.deepEqual(final, {
    success: false,
    providerId: null,
    errorCode: "provider_rejected",
    review: false,
  });
});
test("idempotency conflicts stop for review; concurrent provider claims remain retryable", async () => {
  const message: Delivery = {
    from: env.BOOKING_EMAIL_FROM,
    to: "admin@tifawave.com",
    subject: "Test",
    html: "<p>Test</p>",
    text: "Test",
  };
  for (const [name, review] of [
    ["invalid_idempotent_request", true],
    ["concurrent_idempotent_requests", false],
  ] as const) {
    await assert.rejects(
      deliverEmail(message, "reservation-fixture", env, async () =>
        Response.json({ name }, { status: 409 }),
      ),
      (e: unknown) => e instanceof DeliveryError && e.review === review,
    );
  }
});
test("frozen recipients are rechecked against the current staging allowlist", async () => {
  let sends = 0;
  let review = false;
  const port: EmailPort = {
    claim: async () => [
      {
        ...job(),
        delivery_payload: {
          from: "Sender <admin@tifawave.com>",
          to: "not-allowed@example.invalid",
          subject: "Test",
          html: "Test",
          text: "Test",
        },
      },
    ],
    prepare: async (_j, d) => d,
    send: async () => {
      sends++;
      return "bad";
    },
    finish: async (_j, result) => {
      review = result.review;
    },
  };
  await processEmailBatch(port, env);
  assert.equal(sends, 0);
  assert.equal(review, true);
});
test("scheduled endpoint rejects GET, malformed secrets and unauthorized tokens before claiming mail", async () => {
  let calls = 0;
  const handler = scheduledEmailHandler({
    env,
    authorize: async () => null,
    dispatch: async () => {
      calls++;
      return { sent: 0, failed: 0, deferred: 0 };
    },
    record: async () => {},
  });
  assert.equal(
    (await handler(new Request("https://worker.example.invalid"))).status,
    405,
  );
  assert.equal(
    (
      await handler(
        new Request("https://worker.example.invalid", { method: "POST" }),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handler(
        new Request("https://worker.example.invalid", {
          method: "POST",
          headers: { "x-worker-token": "a".repeat(64) },
        }),
      )
    ).status,
    401,
  );
  assert.equal(calls, 0);
});
test("scheduled failures are durable and the handler accepts only its isolated project", async () => {
  const recorded: unknown[] = [];
  const handler = scheduledEmailHandler({
    env,
    authorize: async (_token, project) => {
      assert.equal(project, "cjtrnnpqwkorxwqhtjeq");
      return "run";
    },
    dispatch: async () => {
      throw Error("database unavailable");
    },
    record: async (...args) => {
      recorded.push(args);
    },
  });
  const request = () =>
    new Request("https://worker.example.invalid", {
      method: "POST",
      headers: { "x-worker-token": "a".repeat(64) },
    });
  assert.equal((await handler(request())).status, 503);
  assert.equal(recorded.length, 1);
  let authorized = false;
  const wrong = scheduledEmailHandler({
    env: {
      ...env,
      NEXT_PUBLIC_SUPABASE_URL: "https://tuzefzcosvvhzffbxhpm.supabase.co",
    },
    authorize: async () => {
      authorized = true;
      return "run";
    },
    dispatch: async () => ({ sent: 0, failed: 0, deferred: 0 }),
    record: async () => {},
  });
  assert.equal((await wrong(request())).status, 503);
  assert.equal(authorized, false);
});
test("Supabase production worker refuses a staged built-in project URL", async () => {
  const handler = scheduledEmailHandler({
    env: {
      ...env,
      TIFAWAVE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://tuzefzcosvvhzffbxhpm.supabase.co",
    },
    authorize: async () => {
      throw Error("must not authorize");
    },
    dispatch: async () => ({ sent: 0, failed: 0, deferred: 0 }),
    record: async () => {},
  });
  assert.equal(
    (
      await handler(
        new Request("https://worker.example.invalid", {
          method: "POST",
          headers: { "x-worker-token": "a".repeat(64) },
        }),
      )
    ).status,
    503,
  );
});
