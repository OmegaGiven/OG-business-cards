import { requireUser } from "../../lib/auth";
import { json } from "../../lib/http";

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  APP_URL: string;
  AUTH_SECRET?: string;
}

export async function onRequestPost({ env, request }: EventContext<Env, string, unknown>) {
  const user = await requireUser(env.DB, request, env);
  if (!env.STRIPE_SECRET_KEY || !env.APP_URL) {
    return json({ error: "Stripe is not configured" }, 500);
  }

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${env.APP_URL}/?payment=success`);
  form.set("cancel_url", `${env.APP_URL}/?payment=cancelled`);
  form.set("customer_email", user.email);
  form.set("client_reference_id", user.id);
  form.set("metadata[userId]", user.id);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", "199");
  form.set("line_items[0][price_data][product_data][name]", "OG-3dmodeler export");

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const session = (await stripeResponse.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !session.id || !session.url) {
    return json({ error: session.error?.message ?? "Unable to create checkout session" }, 502);
  }

  await env.DB.prepare(
    "INSERT INTO payments (id, user_id, stripe_session_id, amount_cents, status) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), user.id, session.id, 199, "checkout_created")
    .run();

  return json({ checkoutUrl: session.url });
}
