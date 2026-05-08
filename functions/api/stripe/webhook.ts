import { json } from "../../lib/http";

interface Env {
  DB: D1Database;
  STRIPE_WEBHOOK_SECRET: string;
}

export async function onRequestPost({ env, request }: EventContext<Env, string, unknown>) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (env.STRIPE_WEBHOOK_SECRET && signature) {
    const verified = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!verified) {
      return json({ error: "Invalid Stripe signature" }, 400);
    }
  }

  const event = JSON.parse(payload) as StripeWebhookEvent;
  if (event.type !== "checkout.session.completed") {
    return json({ received: true });
  }

  const session = event.data.object;
  const userId = session.metadata?.userId || session.client_reference_id;
  if (!userId || !session.id) {
    return json({ error: "Missing user reference" }, 400);
  }

  const existing = await env.DB.prepare("SELECT status FROM payments WHERE stripe_session_id = ?")
    .bind(session.id)
    .first<{ status: string }>();

  if (existing?.status === "paid") {
    return json({ received: true, idempotent: true });
  }

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE payments SET status = ?, stripe_payment_intent_id = ? WHERE stripe_session_id = ?",
    ).bind("paid", session.payment_intent ?? null, session.id),
    env.DB.prepare(
      "UPDATE users SET paid_export_credits = paid_export_credits + 1, updated_at = ? WHERE id = ?",
    ).bind(new Date().toISOString(), userId),
  ]);

  return json({ received: true });
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const timestamp = header
    .split(",")
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const v1 = header
    .split(",")
    .find((part) => part.startsWith("v1="))
    ?.slice(3);

  if (!timestamp || !v1) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  return toHex(digest) === v1;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      client_reference_id?: string;
      payment_intent?: string;
      metadata?: {
        userId?: string;
      };
    };
  };
}
