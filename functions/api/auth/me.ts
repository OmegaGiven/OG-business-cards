import { getSessionEmail, requireUser } from "../../lib/auth";
import { json } from "../../lib/http";

interface Env {
  DB: D1Database;
  AUTH_SECRET?: string;
}

export async function onRequestGet({ env, request }: EventContext<Env, string, unknown>) {
  const email = await getSessionEmail(request, env);
  if (!email) {
    return json({ user: null });
  }

  const user = await requireUser(env.DB, request, env);
  return json({
    user: {
      email: user.email,
      stlExportCount: user.stlExportCount,
      paidExportCredits: user.paidExportCredits,
    },
  });
}
