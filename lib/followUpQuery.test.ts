import { describe, expect, it } from "vitest";
import { followUpQuery } from "./followUpQuery";

describe("followUpQuery", () => {
    it("keeps the original sentence and the reply", () => {
        expect(followUpQuery("something cheap", "Marina under 80k")).toBe(
            "something cheap. Marina under 80k",
        );
    });

    it("does not add a second period", () => {
        expect(followUpQuery("Something cheap.", "2 bed in Marina")).toBe(
            "Something cheap. 2 bed in Marina",
        );
    });

    it("returns the reply when there is no original search", () => {
        expect(followUpQuery("  ", "studio in JVC")).toBe("studio in JVC");
    });

    it("stays within 200 characters", () => {
        const original = "a".repeat(180);
        const reply = "b".repeat(50);
        const combined = followUpQuery(original, reply);
        expect(combined.length).toBeLessThanOrEqual(200);
        expect(combined.endsWith(reply)).toBe(true);
    });

    it("uses the reply alone when it already fills the limit", () => {
        const reply = "c".repeat(200);
        expect(followUpQuery("marina", reply)).toBe(reply);
    });
});
