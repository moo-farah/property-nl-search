import { describe, expect, it } from "vitest";
import { listings } from "./listings";
import { listingsForIds } from "./savedListings";

describe("listingsForIds", () => {
    it("keeps the saved order and skips unknown ids", () => {
        const first = listings[2];
        const second = listings[0];
        expect(first && second).toBeTruthy();
        if (!first || !second) return;

        expect(listingsForIds(listings, [second.id, "missing", first.id])).toEqual([
            second,
            first,
        ]);
    });

    it("returns nothing when nothing is saved", () => {
        expect(listingsForIds(listings, [])).toEqual([]);
    });
});
