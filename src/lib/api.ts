import { Design } from "../shared/design";

export async function saveDesignToCloud(design: Design, email: string) {
  const response = await fetch("/api/designs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": email,
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

export async function authorizeStlExport(email: string) {
  const response = await fetch("/api/exports/stl/authorize", {
    method: "POST",
    headers: {
      "X-User-Email": email,
    },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<{ allowed: boolean; checkoutRequired?: boolean; source?: string }>;
}

export async function createStlCheckout(email: string) {
  const response = await fetch("/api/checkout/stl-export", {
    method: "POST",
    headers: {
      "X-User-Email": email,
    },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<{ checkoutUrl: string }>;
}
