import { filterListings } from "./FilterListings";
import type { Filters, Listing } from "./schema";

export const RELAX_FIELDS = [
    "minPriceAed",
    "maxPriceAed",
    "amenity",
    "furnished",
    "type",
    "bedrooms",
    "area",
] as const;

export type RelaxedField = (typeof RELAX_FIELDS)[number];

const MAX_RELAX_STEPS = 4;

const FIELD_LABELS: Record<RelaxedField, string> = {
    minPriceAed: "minimum price",
    maxPriceAed: "price cap",
    amenity: "amenity",
    furnished: "furnishing",
    type: "property type",
    bedrooms: "bedroom count",
    area: "area",
};

export type RelaxedSearch = {
    filters: Filters;
    dropped: RelaxedField[];
    results: Listing[];
};

export function relaxFilters(catalog: Listing[], filters: Filters): RelaxedSearch {
    const dropped: RelaxedField[] = [];
    let current = filters;
    let results = filterListings(catalog, current);

    while (results.length === 0 && dropped.length < MAX_RELAX_STEPS) {
        const step = dropNext(current);
        if (!step) break;
        dropped.push(step.field);
        current = step.filters;
        results = filterListings(catalog, current);
    }

    return { filters: current, dropped, results };
}

export function relaxedNote(dropped: RelaxedField[]): string | null {
    const phrases = droppedPhrases(dropped);
    if (phrases.length === 0) return null;
    if (phrases.length === 1) return `No exact match. Removed the ${phrases[0]}.`;
    const last = phrases[phrases.length - 1];
    const rest = phrases.slice(0, -1).join(", ");
    return `No exact match. Removed the ${rest} and ${last}.`;
}

function droppedPhrases(dropped: RelaxedField[]): string[] {
    const phrases: string[] = [];
    let amenities = 0;

    function flushAmenities() {
        if (amenities === 1) phrases.push("amenity");
        if (amenities > 1) phrases.push("amenities");
        amenities = 0;
    }

    for (const field of dropped) {
        if (field === "amenity") {
            amenities += 1;
            continue;
        }
        flushAmenities();
        phrases.push(FIELD_LABELS[field]);
    }
    flushAmenities();
    return phrases;
}

function dropNext(filters: Filters): { filters: Filters; field: RelaxedField } | null {
    if (filters.minPriceAed !== undefined) {
        const next = { ...filters };
        delete next.minPriceAed;
        return { filters: next, field: "minPriceAed" };
    }
    if (filters.maxPriceAed !== undefined) {
        const next = { ...filters };
        delete next.maxPriceAed;
        return { filters: next, field: "maxPriceAed" };
    }
    if ((filters.amenities?.length ?? 0) > 0) {
        const amenities = filters.amenities?.slice(0, -1) ?? [];
        const next = { ...filters };
        if (amenities.length === 0) delete next.amenities;
        else next.amenities = amenities;
        return { filters: next, field: "amenity" };
    }
    if (filters.furnished !== undefined) {
        const next = { ...filters };
        delete next.furnished;
        return { filters: next, field: "furnished" };
    }
    if (filters.type !== undefined) {
        const next = { ...filters };
        delete next.type;
        return { filters: next, field: "type" };
    }
    if (filters.bedrooms !== undefined) {
        const next = { ...filters };
        delete next.bedrooms;
        return { filters: next, field: "bedrooms" };
    }
    if (filters.area !== undefined) {
        const next = { ...filters };
        delete next.area;
        return { filters: next, field: "area" };
    }
    return null;
}
