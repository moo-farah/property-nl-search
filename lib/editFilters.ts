import {
    FiltersSchema,
    type Amenity,
    type Filters,
} from "./schema";

export type FilterChip =
    | { kind: "area"; value: NonNullable<Filters["area"]> }
    | { kind: "type"; value: NonNullable<Filters["type"]> }
    | { kind: "listingType"; value: NonNullable<Filters["listingType"]> }
    | { kind: "bedrooms"; value: NonNullable<Filters["bedrooms"]> }
    | { kind: "minPriceAed"; value: NonNullable<Filters["minPriceAed"]> }
    | { kind: "maxPriceAed"; value: NonNullable<Filters["maxPriceAed"]> }
    | { kind: "furnished"; value: NonNullable<Filters["furnished"]> }
    | { kind: "amenity"; value: Amenity };

type ScalarChip = Exclude<FilterChip, { kind: "amenity" }>;

export function chipsFromFilters(filters: Filters): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.area !== undefined) chips.push({ kind: "area", value: filters.area });
    if (filters.type !== undefined) chips.push({ kind: "type", value: filters.type });
    if (filters.listingType !== undefined) {
        chips.push({ kind: "listingType", value: filters.listingType });
    }
    if (filters.bedrooms !== undefined) {
        chips.push({ kind: "bedrooms", value: filters.bedrooms });
    }
    if (filters.minPriceAed !== undefined) {
        chips.push({ kind: "minPriceAed", value: filters.minPriceAed });
    }
    if (filters.maxPriceAed !== undefined) {
        chips.push({ kind: "maxPriceAed", value: filters.maxPriceAed });
    }
    if (filters.furnished !== undefined) {
        chips.push({ kind: "furnished", value: filters.furnished });
    }
    for (const amenity of filters.amenities ?? []) {
        chips.push({ kind: "amenity", value: amenity });
    }

    return chips;
}

export function removeChip(filters: Filters, chip: FilterChip): Filters {
    if (chip.kind === "amenity") {
        const current = filters.amenities ?? [];
        const amenities = current.filter((amenity) => amenity !== chip.value);
        if (amenities.length === current.length) return filters;
        if (amenities.length === 0) {
            const next = { ...filters };
            delete next.amenities;
            return next;
        }
        return { ...filters, amenities };
    }

    if (filters[chip.kind] === undefined) return filters;
    const next = { ...filters };
    delete next[chip.kind];
    return next;
}

export function updateChip(
    filters: Filters,
    chip: FilterChip,
    value: string | number,
): Filters {
    const candidate = nextFilters(filters, chip, value);
    if (candidate === filters) return filters;
    const parsed = FiltersSchema.safeParse(candidate);
    return parsed.success ? parsed.data : filters;
}

function nextFilters(filters: Filters, chip: FilterChip, value: string | number): unknown {
    if (chip.kind === "amenity") {
        if (typeof value !== "string" || chip.value === value) return filters;
        const current = filters.amenities ?? [];
        if (!current.includes(chip.value)) return filters;

        const amenities: string[] = [];
        for (const amenity of current) {
            const replacement = amenity === chip.value ? value : amenity;
            if (!amenities.includes(replacement)) amenities.push(replacement);
        }
        return { ...filters, amenities };
    }

    if (isNumericChip(chip.kind)) {
        const numeric = typeof value === "number" ? value : Number(value);
        if (filters[chip.kind] === numeric) return filters;
        return { ...filters, [chip.kind]: numeric };
    }

    if (filters[chip.kind] === value) return filters;
    return { ...filters, [chip.kind]: value };
}

function isNumericChip(kind: ScalarChip["kind"]): kind is "bedrooms" | "minPriceAed" | "maxPriceAed" {
    return kind === "bedrooms" || kind === "minPriceAed" || kind === "maxPriceAed";
}
