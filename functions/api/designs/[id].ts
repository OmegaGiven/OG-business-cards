import { requireUser } from "../../lib/auth";
import { json, readJson } from "../../lib/http";

interface Env {
  DB: D1Database;
}

export async function onRequestGet({ env, request, params }: EventContext<Env, string, { id: string }>) {
  const user = await requireUser(env.DB, request);
  const row = await env.DB.prepare(
    "SELECT id, name, design_json, created_at, updated_at FROM designs WHERE owner_id = ? AND id = ?",
  )
    .bind(user.id, params.id)
    .first();

  if (!row) {
    return json({ error: "Design not found" }, 404);
  }

  return json({
    id: row.id,
    name: row.name,
    design: JSON.parse(String(row.design_json)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function onRequestPut({ env, request, params }: EventContext<Env, string, { id: string }>) {
  const user = await requireUser(env.DB, request);
  const body = await readJson<{ name?: string; design: unknown }>(request);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    "UPDATE designs SET name = ?, design_json = ?, updated_at = ? WHERE owner_id = ? AND id = ?",
  )
    .bind(body.name?.trim() || "Untitled design", JSON.stringify(body.design), now, user.id, params.id)
    .run();

  if (result.meta.changes === 0) {
    return json({ error: "Design not found" }, 404);
  }

  return json({ id: params.id, updatedAt: now });
}
