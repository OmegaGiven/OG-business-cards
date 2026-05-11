export const FREE_STL_EXPORTS = 2;

export type StlExportDecision =
  | { allowed: true; source: "free" | "paid-export" }
  | { allowed: false; reason: "payment-required" };

export function authorizeStlExport(input: { freeExportsUsed: number; paidCredits: number }): StlExportDecision {
  if (input.freeExportsUsed < FREE_STL_EXPORTS) {
    return { allowed: true, source: "free" };
  }

  if (input.paidCredits > 0) {
    return { allowed: true, source: "paid-export" };
  }

  return { allowed: false, reason: "payment-required" };
}
