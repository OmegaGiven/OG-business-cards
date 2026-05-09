import { requireUser } from "../../../lib/auth";
import { json } from "../../../lib/http";
import { authorizeStlExport } from "../../../../src/shared/billing";

interface Env {
  DB: D1Database;
  AUTH_SECRET?: string;
}

export async function onRequestPost({ env, request }: EventContext<Env, string, unknown>) {
  const user = await requireUser(env.DB, request, env);
  const decision = authorizeStlExport({
    freeExportsUsed: user.stlExportCount,
    paidCredits: user.paidExportCredits,
  });

  if (!decision.allowed) {
    return json({
      allowed: false,
      reason: decision.reason,
      checkoutRequired: true,
      freeExportsRemaining: 0,
      paidCredits: user.paidExportCredits,
    });
  }

  if (decision.source === "free") {
    await env.DB.prepare("UPDATE users SET stl_export_count = stl_export_count + 1, updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), user.id)
      .run();
  } else {
    await env.DB.prepare("UPDATE users SET paid_export_credits = paid_export_credits - 1, updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), user.id)
      .run();
  }

  return json({
    allowed: true,
    source: decision.source,
    freeExportsRemaining: Math.max(0, 2 - user.stlExportCount - (decision.source === "free" ? 1 : 0)),
    paidCredits: decision.source === "paid-credit" ? user.paidExportCredits - 1 : user.paidExportCredits,
  });
}
