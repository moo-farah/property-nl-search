import { beforeEach, describe, expect, it } from "vitest";
import { recordSearch, resetSearchLog, searchStats } from "./searchLog";

describe("searchStats", () => {
    beforeEach(() => {
        resetSearchLog();
    });

    it("counts outcomes and ignores the sentence", () => {
        recordSearch({ outcome: "results", count: 4, latencyMs: 20 });
        recordSearch({ outcome: "relaxed", count: 2, latencyMs: 30 });
        recordSearch({ outcome: "clarify", count: 0, latencyMs: 10 });
        expect(searchStats()).toEqual({
            total: 3,
            counts: { results: 1, relaxed: 1, empty: 0, clarify: 1, error: 0 },
        });
    });

    it("keeps the latest 100 searches", () => {
        for (let index = 0; index < 105; index += 1) {
            recordSearch({ outcome: "error", count: 0, latencyMs: index });
        }
        recordSearch({ outcome: "results", count: 1, latencyMs: 5 });
        const stats = searchStats();
        expect(stats.total).toBe(100);
        expect(stats.counts.error).toBe(99);
        expect(stats.counts.results).toBe(1);
    });
});
