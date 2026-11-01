import type { Listing } from "./schema";

export const SORT_OPTIONS = {
    recommended: "Recommended",
    "price-asc": "Price: low to high",
    "price-desc": "Price: high to low",
    "beds-desc": "Most bedrooms",
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export function isSortKey(value: string): value is SortKey {
    return value in SORT_OPTIONS;
}

export function sortListings(listings: Listing[], sort: SortKey): Listing[] {
    const sorted = [...listings];
    if (sort === "price-asc") sorted.sort((a, b) => a.priceAed - b.priceAed);
    if (sort === "price-desc") sorted.sort((a, b) => b.priceAed - a.priceAed);
    if (sort === "beds-desc") sorted.sort((a, b) => b.bedrooms - a.bedrooms);
    return sorted;
}
