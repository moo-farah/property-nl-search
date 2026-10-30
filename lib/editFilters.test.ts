import { describe, expect, it } from "vitest";
import { filterListings } from "./FilterListings";
import { chipsFromFilters, removeChip, updateChip } from "./editFilters";
import { listings } from "./listings";
import type { Filters } from "./schema";

const marina: Filters = {
    area: "Dubai Marina",
    bedrooms: 2,
    maxPriceAed: 120000,
    amenities: ["pool", "gym"],
};

describe("chipsFromFilters", () => {
    it("lists active filters in a stable order", () => {
        expect(chipsFromFilters(marina)).toEqual([
            { kind: "area", value: "Dubai Marina" },
            { kind: "bedrooms", value: 2 },
            { kind: "maxPriceAed", value: 120000 },
            { kind: "amenity", value: "pool" },
            { kind: "amenity", value: "gym" },
        ]);
    });
});

describe("removeChip", () => {
    it("drops one filter and leaves the rest", () => {
        expect(removeChip(marina, { kind: "area", value: "Dubai Marina" })).toEqual({
            bedrooms: 2,
            maxPriceAed: 120000,
            amenities: ["pool", "gym"],
        });
    });

    it("drops one amenity and keeps the others", () => {
        expect(removeChip(marina, { kind: "amenity", value: "pool" }).amenities).toEqual(["gym"]);
    });

    it("omits amenities after the last one is removed", () => {
        const filters = { area: "Al Barsha" as const, amenities: ["pool" as const] };
        expect(removeChip(filters, { kind: "amenity", value: "pool" })).toEqual({
            area: "Al Barsha",
        });
    });
});

describe("updateChip", () => {
    it("replaces a bedroom count", () => {
        expect(updateChip({ bedrooms: 2 }, { kind: "bedrooms", value: 2 }, "0")).toEqual({
            bedrooms: 0,
        });
    });

    it("replaces an amenity without keeping a duplicate", () => {
        expect(
            updateChip(
                { amenities: ["pool", "gym"] },
                { kind: "amenity", value: "pool" },
                "gym",
            ),
        ).toEqual({ amenities: ["gym"] });
    });

    it("keeps the current filters when the new value is invalid", () => {
        const filters = { area: "Dubai Marina" as const, maxPriceAed: 120000 };
        expect(updateChip(filters, { kind: "area", value: "Dubai Marina" }, "Abu Dhabi")).toBe(
            filters,
        );
        expect(
            updateChip(filters, { kind: "maxPriceAed", value: 120000 }, -1),
        ).toBe(filters);
    });
});

describe("chip edits against the catalog", () => {
    it("returns more listings after a price cap is removed", () => {
        const filters = { area: "Dubai Marina" as const, maxPriceAed: 1 };
        const capped = filterListings(listings, filters);
        const relaxed = filterListings(
            listings,
            removeChip(filters, { kind: "maxPriceAed", value: 1 }),
        );

        expect(capped).toHaveLength(0);
        expect(relaxed.length).toBeGreaterThan(0);
        expect(relaxed.every((listing) => listing.area === "Dubai Marina")).toBe(true);
    });

    it("narrows listings when the area chip changes", () => {
        const filters = { listingType: "rent" as const };
        const next = updateChip(filters, { kind: "area", value: "Al Barsha" }, "Palm Jumeirah");
        const matches = filterListings(listings, next);

        expect(matches.length).toBeGreaterThan(0);
        expect(matches.every((listing) => listing.area === "Palm Jumeirah")).toBe(true);
    });
});
