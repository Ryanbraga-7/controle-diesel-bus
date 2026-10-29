import { describe, expect, it } from "vitest";
import { brazilianToIso, isoToBrazilian, maskBrazilianDate } from "./date";

describe("Brazilian date entry", () => {
  it("stores 20/10/2026 as October 20 regardless of browser locale", () => {
    expect(brazilianToIso("20/10/2026")).toBe("2026-10-20");
    expect(isoToBrazilian("2026-10-20")).toBe("20/10/2026");
  });
  it("interprets the first part as day, not US month", () => {
    expect(brazilianToIso("03/04/2026")).toBe("2026-04-03");
  });
  it("rejects impossible and incomplete dates", () => {
    expect(brazilianToIso("31/02/2026")).toBeNull();
    expect(brazilianToIso("29/02/2026")).toBeNull();
    expect(brazilianToIso("20/10/26")).toBeNull();
    expect(brazilianToIso("29/02/2028")).toBe("2028-02-29");
  });
  it("adds separators to numeric date entry", () => {
    expect(maskBrazilianDate("20102026")).toBe("20/10/2026");
  });
});