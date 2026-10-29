import { describe, expect, it } from "vitest";
import { compareResult } from "./compare";

describe("compareResult", () => {
    it("matches only the expected filter fields", () => {
        const result = compareResult(
            {
                kind: "filters",
                filters: {
                    area: "Dubai Marina",
                    bedrooms: 2,
                },
            },
            {
                ok: true,
                kind: "filters",
                filters: {
                    area: "Dubai Marina",
                    bedrooms: 2,
                    listingType: "rent",
                },
            },
        );

        expect(result.kindCorrect).toBe(true);
        expect(result.exactMatch).toBe(true);
        expect(result.matchedFields).toBe(2);
        expect(result.totalFields).toBe(2);
    });

    it("fails when an expected field has a different value", () => {
        const result = compareResult(
            {
                kind: "filters",
                filters: {
                    area: "Dubai Marina",
                    bedrooms: 2,
                },
            },
            {
                ok: true,
                kind: "filters",
                filters: {
                    area: "Dubai Marina",
                    bedrooms: 3,
                },
            },
        );

        expect(result.kindCorrect).toBe(true);
        expect(result.exactMatch).toBe(false);
        expect(result.matchedFields).toBe(1);
        expect(result.totalFields).toBe(2);
        expect(result.fields.find((field) => field.field === "bedrooms")).toEqual(
            {
                field: "bedrooms",
                expected: 2,
                actual: 3,
                matched: false,
            },
        );
    });

    it("treats amenity order as irrelevant", () => {
        const result = compareResult(
            {
                kind: "filters",
                filters: {
                    amenities: ["pool", "gym"],
                },
            },
            {
                ok: true,
                kind: "filters",
                filters: {
                    amenities: ["gym", "pool"],
                },
            },
        );

        expect(result.exactMatch).toBe(true);
        expect(result.matchedFields).toBe(1);
    });

    it("fails when extra amenities are invented", () => {
        const result = compareResult(
            {
                kind: "filters",
                filters: {
                    amenities: ["pool", "gym"],
                },
            },
            {
                ok: true,
                kind: "filters",
                filters: {
                    amenities: ["pool", "gym", "parking"],
                },
            },
        );

        expect(result.exactMatch).toBe(false);
        expect(result.matchedFields).toBe(0);
    });

    it("fails when the result kind differs", () => {
        const result = compareResult(
            {
                kind: "filters",
                filters: {
                    area: "Dubai Marina",
                },
            },
            {
                ok: true,
                kind: "clarify",
                question: "Which area do you prefer?",
            },
        );

        expect(result.kindCorrect).toBe(false);
        expect(result.exactMatch).toBe(false);
        expect(result.matchedFields).toBe(0);
        expect(result.totalFields).toBe(1);
        expect(result.fields).toEqual([]);
    });

    it("accepts a clarification without comparing the question text", () => {
        const result = compareResult(
            { kind: "clarify" },
            {
                ok: true,
                kind: "clarify",
                question: "What budget do you have?",
            },
        );

        expect(result.kindCorrect).toBe(true);
        expect(result.exactMatch).toBe(true);
        expect(result.matchedFields).toBe(0);
        expect(result.totalFields).toBe(0);
    });

    it("treats an invalid parse as a failed comparison", () => {
        const result = compareResult(
            {
                kind: "filters",
                filters: {
                    area: "Dubai Marina",
                },
            },
            { ok: false, kind: "invalid" },
        );

        expect(result.kindCorrect).toBe(false);
        expect(result.exactMatch).toBe(false);
        expect(result.totalFields).toBe(1);
    });
});
