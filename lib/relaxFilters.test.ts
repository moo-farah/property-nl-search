import { describe, expect, it } from "vitest";
import { relaxFilters, relaxedNote } from "./relaxFilters";
import type { Filters, Listing } from "./schema";

const marina: Listing = {
    id: "lst-test-1",
    title: "Test Marina apartment",
    image: "/listings/apartment-1.jpg",
    area: "Dubai Marina",
    type: "apartment",
    listingType: "rent",
    bedrooms: 2,
    bathrooms: 2,
    priceAed: 100000,
    furnished: "furnished",
    amenities: ["pool"],
};

describe("relaxFilters", () => {
    it("keeps filters that already match", () => {
        const filters: Filters = { area: "Dubai Marina", listingType: "rent" };
        const relaxed = relaxFilters([marina], filters);
        expect(relaxed.dropped).toEqual([]);
        expect(relaxed.filters).toBe(filters);
        expect(relaxed.results).toEqual([marina]);
    });

    it("drops the price cap before the area", () => {
        const relaxed = relaxFilters([marina], {
            area: "Dubai Marina",
            listingType: "rent",
            maxPriceAed: 50000,
        });
        expect(relaxed.dropped).toEqual(["maxPriceAed"]);
        expect(relaxed.filters.area).toBe("Dubai Marina");
        expect(relaxed.filters.maxPriceAed).toBeUndefined();
        expect(relaxed.results).toEqual([marina]);
    });

    it("drops one amenity at a time and keeps listing type", () => {
        const relaxed = relaxFilters([marina], {
            listingType: "rent",
            amenities: ["gym", "pool"],
        });
        expect(relaxed.dropped).toEqual(["amenity", "amenity"]);
        expect(relaxed.filters.amenities).toBeUndefined();
        expect(relaxed.filters.listingType).toBe("rent");
        expect(relaxed.results).toEqual([marina]);
    });

    it("stops after four drops when nothing matches", () => {
        const relaxed = relaxFilters([marina], {
            area: "Downtown Dubai",
            type: "villa",
            bedrooms: 4,
            furnished: "unfurnished",
            minPriceAed: 1,
            maxPriceAed: 2,
            listingType: "sale",
        });
        expect(relaxed.dropped).toEqual(["minPriceAed", "maxPriceAed", "furnished", "type"]);
        expect(relaxed.filters.listingType).toBe("sale");
        expect(relaxed.filters.area).toBe("Downtown Dubai");
        expect(relaxed.results).toEqual([]);
    });
});

describe("relaxedNote", () => {
    it("names a single removed filter", () => {
        expect(relaxedNote(["maxPriceAed"])).toBe("No exact match. Removed the price cap.");
    });

    it("joins several removed filters", () => {
        expect(relaxedNote(["maxPriceAed", "amenity", "amenity"])).toBe(
            "No exact match. Removed the price cap and amenities.",
        );
    });

    it("says nothing when no filter was removed", () => {
        expect(relaxedNote([])).toBeNull();
    });
});
