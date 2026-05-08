import { describe, expect, it } from "vitest";
import { authorizeStlExport } from "./billing";

describe("authorizeStlExport", () => {
  it("allows the first two free STL exports", () => {
    expect(authorizeStlExport({ freeExportsUsed: 0, paidCredits: 0 })).toEqual({
      allowed: true,
      source: "free",
    });
    expect(authorizeStlExport({ freeExportsUsed: 1, paidCredits: 0 })).toEqual({
      allowed: true,
      source: "free",
    });
  });

  it("uses paid credits after free exports are exhausted", () => {
    expect(authorizeStlExport({ freeExportsUsed: 2, paidCredits: 1 })).toEqual({
      allowed: true,
      source: "paid-credit",
    });
  });

  it("requires payment without free exports or credits", () => {
    expect(authorizeStlExport({ freeExportsUsed: 2, paidCredits: 0 })).toEqual({
      allowed: false,
      reason: "payment-required",
    });
  });
});
