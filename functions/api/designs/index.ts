import { requireUser } from "../../lib/auth";
import { json, readJson } from "../../lib/http";

interface Env {
  DB: D1Database;
  AUTH_SECRET?: string;
}

export async function onRequestGet({ env, request }: EventContext<Env, string, unknown>) {
  const user = await requireUser(env.DB, request, env);
  const results = await env.DB.prepare(
    "SELECT id, name, design_json, created_at, updated_at FROM designs WHERE owner_id = ? ORDER BY updated_at DESC",
  )
    .bind(user.id)
    .all();

  return json({
    designs: results.results.map((row) => ({
      id: row.id,
      name: row.name,
      design: JSON.parse(String(row.design_json)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}

export async function onRequestPost({ env, request }: EventContext<Env, string, unknown>) {
  const user = await requireUser(env.DB, request, env);
  const body = await readJson<{ id?: string; name?: string; design: unknown }>(request);
  const id = body.id ?? crypto.randomUUID();
  const name = body.name?.trim() || "Untitled design";
  const now = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO designs (id, owner_id, name, design_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(id, user.id, name, JSON.stringify(body.design), now, now)
    .run();

  return json({ id, name, createdAt: now, updatedAt: now }, 201);
}
