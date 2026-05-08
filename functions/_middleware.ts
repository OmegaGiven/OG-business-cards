export async function onRequest(context: EventContext<Env, string, unknown>) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders(),
    });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Email",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  };
}

interface Env {
  DB: D1Database;
}
