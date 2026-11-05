import { describe, expect, it } from "vitest";
import { describeFilters, emptySearchHint } from "./emptySearch";

describe("emptySearchHint", () => {
    it("names the search and points at the price chip", () => {
        expect(
            emptySearchHint({
                area: "Dubai Marina",
                listingType: "rent",
                bedrooms: 2,
                maxPriceAed: 80000,
            }),
        ).toBe("No 2-bed for rent in Dubai Marina under 80,000 AED. Try removing the price.");
    });

    it("points at amenities when there is no price cap", () => {
        expect(
            emptySearchHint({
                area: "Palm Jumeirah",
                type: "villa",
                amenities: ["pool"],
            }),
        ).toBe("No villa in Palm Jumeirah with pool. Try removing an amenity.");
    });
});

describe("describeFilters", () => {
    it("returns a fallback when nothing is set", () => {
        expect(describeFilters({})).toBe("these filters");
    });
});
