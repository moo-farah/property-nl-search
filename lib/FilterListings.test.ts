import { describe, expect, it } from "vitest";
import { filterListings } from "./FilterListings";
import type { Listing } from "./schema";

const marinaApartment: Listing = {
    id: "lst-test-1",
    title: "Test Marina apartment",
    image: "/listings/1.jpg",
    area: "Dubai Marina",
    type: "apartment",
    listingType: "rent",
    bedrooms: 2,
    bathrooms: 2,
    priceAed: 100000,
    furnished: "furnished",
    amenities: ["gym", "pool", "parking"],
};

describe("filterListings", () => {
    const listings = [marinaApartment];

    it("returns all listings when filters are empty", () => {
        expect(filterListings(listings, {})).toEqual(listings);
    });

    it("keeps a listing that matches area and bedrooms", () => {
        expect(
            filterListings(listings, {
                area: "Dubai Marina",
                bedrooms: 2,
            }),
        ).toEqual(listings);
    });

    it("drops a listing in a different area", () => {
        expect(filterListings(listings, { area: "Downtown Dubai" })).toEqual([]);
    });

    it("treats bedrooms 0 as studio exact match", () => {
        const studio: Listing = {
            ...marinaApartment,
            id: "lst-test-2",
            bedrooms: 0,
        };

        expect(filterListings([studio], { bedrooms: 0 })).toEqual([studio]);
        expect(filterListings([studio], { bedrooms: 1 })).toEqual([]);
    });

    it("includes a listing at the max price", () => {
        expect(filterListings(listings, { maxPriceAed: 100000 })).toEqual(
            listings,
        );
    });

    it("drops a listing above the max price", () => {
        expect(filterListings(listings, { maxPriceAed: 90000 })).toEqual([]);
    });

    it("includes a listing at the min price", () => {
        expect(filterListings(listings, { minPriceAed: 100000 })).toEqual(
            listings,
        );
    });

    it("requires every requested amenity", () => {
        expect(
            filterListings(listings, { amenities: ["gym", "pool"] }),
        ).toEqual(listings);
        expect(
            filterListings(listings, { amenities: ["gym", "beach_access"] }),
        ).toEqual([]);
    });
});
