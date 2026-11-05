import { describe, expect, it } from "vitest";
import { formatAed, monthlyFromAnnualAed } from "./rentPrice";

describe("monthlyFromAnnualAed", () => {
    it("converts a yearly rent to a monthly amount", () => {
        expect(monthlyFromAnnualAed(120000)).toBe(10000);
        expect(monthlyFromAnnualAed(98000)).toBe(8167);
    });
});

describe("formatAed", () => {
    it("formats with grouping", () => {
        expect(formatAed(120000)).toBe("120,000");
    });
});
