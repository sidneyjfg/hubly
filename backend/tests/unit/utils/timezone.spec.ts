import { describe, expect, it } from "vitest";

import { defaultTimeZone, normalizeTimeZone } from "../../../src/utils/timezone";

describe("timezone utils", () => {
  it("always resolves to the platform default timezone", () => {
    expect(normalizeTimeZone("curitiba ")).toBe(defaultTimeZone);
    expect(normalizeTimeZone("sao paulo")).toBe(defaultTimeZone);
    expect(normalizeTimeZone("America/Manaus")).toBe(defaultTimeZone);
    expect(normalizeTimeZone("not a timezone")).toBe(defaultTimeZone);
  });
});
