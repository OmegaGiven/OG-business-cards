import { clearSessionCookie } from "../../lib/auth";
import { json } from "../../lib/http";

export async function onRequestPost() {
  const response = json({ ok: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
