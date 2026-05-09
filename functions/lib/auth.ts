export interface AppUser {
  id: string;
  email: string;
  stlExportCount: number;
  paidExportCredits: number;
}

export interface AuthEnv {
  AUTH_SECRET?: string;
}

export async function requireUser(db: D1Database, request: Request, env?: AuthEnv): Promise<AppUser> {
  const email = (await getSessionEmail(request, env)) ?? request.headers.get("X-User-Email")?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Response(JSON.stringify({ error: "Missing X-User-Email header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await db
    .prepare(
      "SELECT id, email, stl_export_count AS stlExportCount, paid_export_credits AS paidExportCredits FROM users WHERE email = ?",
    )
    .bind(email)
    .first<AppUser>();

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  await db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").bind(id, email).run();
  return {
    id,
    email,
    stlExportCount: 0,
    paidExportCredits: 0,
  };
}

export async function getSessionEmail(request: Request, env?: AuthEnv) {
  const cookie = request.headers.get("Cookie") ?? "";
  const session = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("og_session="))
    ?.slice("og_session=".length);

  if (!session || !env?.AUTH_SECRET) {
    return null;
  }

  try {
    const [payload, signature] = session.split(".");
    if (!payload || !signature) {
      return null;
    }
    const expected = await signValue(payload, env.AUTH_SECRET);
    if (expected !== signature) {
      return null;
    }
    const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { email?: string; exp?: number };
    if (!data.email || !data.exp || Date.now() > data.exp) {
      return null;
    }
    return data.email.toLowerCase();
  } catch {
    return null;
  }
}

export async function createSessionCookie(email: string, secret: string) {
  const payload = base64UrlEncode(JSON.stringify({
    email: email.toLowerCase(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  }));
  const signature = await signValue(payload, secret);
  return `og_session=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

export function clearSessionCookie() {
  return "og_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

async function signValue(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(digest)));
}

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
