"use client";

import { useState } from "react";
import EmptyState from "../components/EmptyState";
import ListingCard from "../components/ListingCard";
import PageFrame from "../components/PageFrame";
import SortSelect from "../components/SortSelect";
import { useFavorites } from "@/lib/favorites";
import { listings } from "@/lib/listings";
import { listingsForIds } from "@/lib/savedListings";
import { sortListings, type SortKey } from "@/lib/sortListings";

export default function SavedPage() {
    const { ids } = useFavorites();
    const [sort, setSort] = useState<SortKey>("recommended");
    const saved = listingsForIds(listings, ids);

    return (
        <PageFrame>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-lg font-semibold text-white drop-shadow-sm">Saved listings</h1>
                    <p className="text-sm text-white/85 drop-shadow-sm" aria-live="polite">
                        {saved.length === 0
                            ? "No saved listings yet"
                            : `${saved.length} ${saved.length === 1 ? "listing" : "listings"} saved`}
                    </p>
                </div>
                {saved.length > 0 ? <SortSelect value={sort} onChange={setSort} /> : null}
            </div>
            {saved.length === 0 ? (
                <EmptyState
                    title="Nothing saved yet"
                    description="Tap the heart on a listing to keep it here. Saved homes stay in this browser."
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {sortListings(saved, sort).map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            )}
        </PageFrame>
    );
}
