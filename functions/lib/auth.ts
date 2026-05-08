export interface AppUser {
  id: string;
  email: string;
  stlExportCount: number;
  paidExportCredits: number;
}

export async function requireUser(db: D1Database, request: Request): Promise<AppUser> {
  const email = request.headers.get("X-User-Email")?.trim().toLowerCase();
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
