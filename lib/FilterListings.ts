import type { Filters, Listing } from "./schema";

export function filterListings(listings: Listing[], filters: Filters): Listing[] {
    return listings.filter((listing) => matches(listing, filters));
}

function matches(listing: Listing, filters: Filters): boolean {
    if (filters.area !== undefined && listing.area !== filters.area) return false;
    if (filters.type !== undefined && listing.type !== filters.type) return false;
    if (filters.listingType !== undefined && listing.listingType !== filters.listingType) {
        return false;
    }
    if (filters.bedrooms !== undefined && listing.bedrooms !== filters.bedrooms) return false;
    if (filters.furnished !== undefined && listing.furnished !== filters.furnished) return false;
    if (filters.minPriceAed !== undefined && listing.priceAed < filters.minPriceAed) return false;
    if (filters.maxPriceAed !== undefined && listing.priceAed > filters.maxPriceAed) return false;
    if (
        filters.amenities !== undefined &&
        !filters.amenities.every((amenity) => listing.amenities.includes(amenity))
    ) {
        return false;
    }
    return true;
}
