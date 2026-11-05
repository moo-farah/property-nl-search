import { formatAed } from "./rentPrice";
import type { Filters } from "./schema";

function amenityLabel(value: string): string {
    return value.replace(/_/g, " ");
}

export function describeFilters(filters: Filters): string {
    const parts: string[] = [];

    if (filters.bedrooms === 0) parts.push("studio");
    else if (filters.bedrooms !== undefined) parts.push(`${filters.bedrooms}-bed`);

    if (filters.type) parts.push(filters.type.replace(/_/g, " "));
    if (filters.listingType) parts.push(`for ${filters.listingType}`);
    if (filters.area) parts.push(`in ${filters.area}`);
    if (filters.furnished) parts.push(filters.furnished.replace(/_/g, " "));

    const amenities = filters.amenities ?? [];
    if (amenities.length === 1) {
        const [amenity] = amenities;
        if (amenity) parts.push(`with ${amenityLabel(amenity)}`);
    } else if (amenities.length > 1) {
        const last = amenities[amenities.length - 1];
        if (last) {
            const rest = amenities.slice(0, -1).map(amenityLabel).join(", ");
            parts.push(`with ${rest} and ${amenityLabel(last)}`);
        }
    }

    if (filters.minPriceAed !== undefined) parts.push(`from ${formatAed(filters.minPriceAed)} AED`);
    if (filters.maxPriceAed !== undefined) parts.push(`under ${formatAed(filters.maxPriceAed)} AED`);

    return parts.length > 0 ? parts.join(" ") : "these filters";
}

export function emptySearchHint(filters: Filters): string {
    const described = describeFilters(filters);
    if (filters.maxPriceAed !== undefined || filters.minPriceAed !== undefined) {
        return `No ${described}. Try removing the price.`;
    }
    if ((filters.amenities?.length ?? 0) > 0) {
        return `No ${described}. Try removing an amenity.`;
    }
    return `No ${described}. Try removing a filter above.`;
}
