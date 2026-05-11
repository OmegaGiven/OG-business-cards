import { Design } from "../shared/design";

export interface SessionUser {
  email: string;
  stlExportCount: number;
  paidExportCredits: number;
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    return null;
  }
  const body = await response.json() as { user: SessionUser | null };
  return body.user;
}

export function startGoogleLogin() {
  const popup = window.open(
    "/api/auth/google/start",
    "og-tools-google-signin",
    "popup=yes,width=520,height=680,menubar=no,toolbar=no,location=no,status=no",
  );
  if (!popup) {
    window.location.href = "/api/auth/google/start";
    return null;
  }
  popup.focus();
  return popup;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function saveDesignToCloud(design: Design, email?: string) {
  const response = await fetch("/api/designs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(email ? { "X-User-Email": email } : {}),
    },
    body: JSON.stringify({
      id: design.id,
      name: design.name,
      design,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function authorizeStlExport(email?: string) {
  const response = await fetch("/api/exports/stl/authorize", {
    method: "POST",
    headers: {
      ...(email ? { "X-User-Email": email } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<{ allowed: boolean; checkoutRequired?: boolean; source?: string }>;
}

export async function createStlCheckout(email?: string) {
  const response = await fetch("/api/checkout/stl-export", {
    method: "POST",
    headers: {
      ...(email ? { "X-User-Email": email } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<{ checkoutUrl: string }>;
}
