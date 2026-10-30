import { describe, expect, it } from "vitest";
import { NEEDS_A_CONSTRAINT, repairFilters } from "./repairFilters";

describe("repairFilters", () => {
    it("fills a dropped nickname and removes a studio that was turned into an apartment", () => {
        const repaired = repairFilters("need studio... downtown... budget monthly 9k", {
            type: "apartment",
            listingType: "rent",
            bedrooms: 0,
            maxPriceAed: 108000,
        });

        expect(repaired).toEqual({
            kind: "filters",
            filters: {
                area: "Downtown Dubai",
                listingType: "rent",
                bedrooms: 0,
                maxPriceAed: 108000,
            },
        });
    });

    it("fills a full area name the model omitted", () => {
        const repaired = repairFilters("partly furnished apartment in Business Bay", {
            type: "apartment",
            listingType: "rent",
            furnished: "partly_furnished",
        });

        expect(repaired.kind === "filters" && repaired.filters.area).toBe("Business Bay");
    });

    it("keeps an area the model already chose", () => {
        const repaired = repairFilters("2 bed in Marina under 120k", {
            area: "Dubai Marina",
            listingType: "rent",
            bedrooms: 2,
            maxPriceAed: 120000,
        });

        expect(repaired).toEqual({
            kind: "filters",
            filters: {
                area: "Dubai Marina",
                listingType: "rent",
                bedrooms: 2,
                maxPriceAed: 120000,
            },
        });
    });

    it("does not pick an area when the sentence names two", () => {
        const repaired = repairFilters("Marina or JLT under 100k", {
            listingType: "rent",
            maxPriceAed: 100000,
        });

        expect(repaired.kind === "filters" && repaired.filters.area).toBeUndefined();
    });

    it("refuses a search that names a place outside Dubai", () => {
        const nairobi = repairFilters("2 bed in nairobi under 90k", {
            listingType: "rent",
            bedrooms: 2,
            maxPriceAed: 90000,
        });
        const sharjah = repairFilters("apartment in Sharjah under 80k", {
            type: "apartment",
            listingType: "rent",
            maxPriceAed: 80000,
        });
        const abuDhabi = repairFilters("2 bedroom apartment in Abu Dhabi with a sauna", {
            type: "apartment",
            listingType: "rent",
            bedrooms: 2,
        });

        expect(nairobi.kind).toBe("clarify");
        expect(sharjah.kind).toBe("clarify");
        expect(abuDhabi.kind).toBe("clarify");
        if (nairobi.kind === "clarify") expect(nairobi.question).toContain("Nairobi is not covered");
        if (abuDhabi.kind === "clarify") expect(abuDhabi.question).toContain("Abu Dhabi is not covered");
    });

    it("keeps a supported area that is followed by a price range", () => {
        const repaired = repairFilters("2 bedroom apartment in Marina between 100k and 140k", {
            area: "Dubai Marina",
            type: "apartment",
            listingType: "rent",
            bedrooms: 2,
            minPriceAed: 100000,
            maxPriceAed: 140000,
        });

        expect(repaired.kind).toBe("filters");
    });

    it("still searches a supported area when an amenity is unknown", () => {
        const repaired = repairFilters("apartment in Dubai Marina with a garden", {
            area: "Dubai Marina",
            type: "apartment",
            listingType: "rent",
        });

        expect(repaired.kind).toBe("filters");
    });

    it("still searches when the sentence names no place", () => {
        const repaired = repairFilters("2 bed under 90k", {
            listingType: "rent",
            bedrooms: 2,
            maxPriceAed: 90000,
        });

        expect(repaired).toEqual({
            kind: "filters",
            filters: {
                listingType: "rent",
                bedrooms: 2,
                maxPriceAed: 90000,
            },
        });
    });

    it("keeps apartment when the user said studio apartment", () => {
        const repaired = repairFilters("studio apartment in JVC", {
            type: "apartment",
            bedrooms: 0,
        });

        expect(repaired.kind === "filters" && repaired.filters).toMatchObject({
            area: "Jumeirah Village Circle",
            type: "apartment",
            listingType: "rent",
            bedrooms: 0,
        });
    });

    it("defaults a missing listing type to rent, and to sale when the user is buying", () => {
        const rent = repairFilters("Palm apartment with beach access", {
            area: "Palm Jumeirah",
            type: "apartment",
            amenities: ["beach_access"],
        });
        const sale = repairFilters("buying a villa in Dubai Hills", {
            type: "villa",
        });

        expect(rent.kind === "filters" && rent.filters.listingType).toBe("rent");
        expect(sale.kind === "filters" && sale.filters).toMatchObject({
            area: "Dubai Hills Estate",
            listingType: "sale",
        });
    });

    it("asks for a constraint when rent is the only filter", () => {
        expect(repairFilters("something cheap and nice", { listingType: "rent" })).toEqual({
            kind: "clarify",
            question: NEEDS_A_CONSTRAINT,
        });
        expect(repairFilters("show me homes", {})).toEqual({
            kind: "clarify",
            question: NEEDS_A_CONSTRAINT,
        });
    });
});
