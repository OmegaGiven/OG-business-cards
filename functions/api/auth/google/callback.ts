import { createSessionCookie } from "../../../lib/auth";

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AUTH_SECRET: string;
  APP_URL: string;
}

export async function onRequestGet({ env, request }: EventContext<Env, string, unknown>) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieState = request.headers
    .get("Cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("og_oauth_state="))
    ?.slice("og_oauth_state=".length);

  if (!code || !state || state !== cookieState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const tokenBody = new URLSearchParams();
  tokenBody.set("client_id", env.GOOGLE_CLIENT_ID);
  tokenBody.set("client_secret", env.GOOGLE_CLIENT_SECRET);
  tokenBody.set("code", code);
  tokenBody.set("grant_type", "authorization_code");
  tokenBody.set("redirect_uri", `${env.APP_URL}/api/auth/google/callback`);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  if (!tokenResponse.ok) {
    return new Response("Could not complete Google sign-in", { status: 502 });
  }

  const token = await tokenResponse.json() as { access_token?: string };
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!profileResponse.ok) {
    return new Response("Could not load Google profile", { status: 502 });
  }

  const profile = await profileResponse.json() as { email?: string; email_verified?: boolean };
  if (!profile.email || profile.email_verified === false) {
    return new Response("Google account email is not verified", { status: 403 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${env.APP_URL}/?signedIn=1`,
      "Set-Cookie": await createSessionCookie(profile.email, env.AUTH_SECRET),
    },
  });
}
