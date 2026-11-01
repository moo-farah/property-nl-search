import type { Listing } from "./schema";

export function listingsForIds(catalog: Listing[], ids: string[]): Listing[] {
    const byId = new Map(catalog.map((listing) => [listing.id, listing]));
    const saved: Listing[] = [];

    for (const id of ids) {
        const listing = byId.get(id);
        if (listing) saved.push(listing);
    }

    return saved;
}
