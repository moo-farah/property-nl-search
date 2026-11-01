"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import SearchBar from "./components/SearchBar";
import FilterChips from "./components/FilterChips";
import ListingCard from "./components/ListingCard";
import EmptyState from "./components/EmptyState";
import ClarifyPrompt from "./components/ClarifyPrompt";
import PageFrame from "./components/PageFrame";
import SortSelect from "./components/SortSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { filterListings } from "@/lib/FilterListings";
import { useFavorites } from "@/lib/favorites";
import { listings } from "@/lib/listings";
import { FiltersSchema, ListingsSchema, type Filters } from "@/lib/schema";
import { sortListings, type SortKey } from "@/lib/sortListings";

const UNAVAILABLE = "Search is unavailable right now. Try again in a moment.";

type SearchState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "results"; filters: Filters }
    | { status: "clarify"; question: string }
    | { status: "error"; message: string };

function readResponse(body: unknown): SearchState {
    if (typeof body !== "object" || body === null) {
        return { status: "error", message: UNAVAILABLE };
    }
    if ("error" in body && typeof body.error === "string") {
        return { status: "error", message: body.error };
    }
    if ("clarify" in body && typeof body.clarify === "string") {
        return { status: "clarify", question: body.clarify };
    }
    if ("filters" in body && "results" in body) {
        const filters = FiltersSchema.safeParse(body.filters);
        const results = ListingsSchema.safeParse(body.results);
        if (filters.success && results.success) {
            return { status: "results", filters: filters.data };
        }
    }
    return { status: "error", message: UNAVAILABLE };
}

const EXAMPLE_SEARCHES = [
    "Villa in Palm Jumeirah with pool",
    "2 bed in Marina under 120k",
    "1 bed in Business Bay under 100k",
    "Studio for rent in JVC",
];

export default function Page() {
    const [state, setState] = useState<SearchState>({ status: "idle" });
    const [sort, setSort] = useState<SortKey>("recommended");
    const [query, setQuery] = useState("");
    const [savedOnly, setSavedOnly] = useState(false);
    const { ids } = useFavorites();

    const matches = state.status === "results" ? filterListings(listings, state.filters) : [];
    const results = savedOnly ? matches.filter((listing) => ids.includes(listing.id)) : matches;

    function onFiltersChange(update: (filters: Filters) => Filters) {
        setState((current) => {
            if (current.status !== "results") return current;
            const filters = update(current.filters);
            return filters === current.filters ? current : { status: "results", filters };
        });
    }

    async function onSearch(text: string) {
        setQuery(text);
        setSavedOnly(false);
        setState({ status: "loading" });
        try {
            const response = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: text }),
            });
            setState(readResponse(await response.json()));
        } catch {
            setState({ status: "error", message: UNAVAILABLE });
        }
    }

    return (
        <PageFrame>
            <SearchBar
                key={query}
                defaultQuery={query}
                onSearch={onSearch}
                disabled={state.status === "loading"}
            />
            {state.status === "idle" ? (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-white/85 drop-shadow-sm">Try an example:</p>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_SEARCHES.map((example) => (
                            <button
                                key={example}
                                type="button"
                                onClick={() => onSearch(example)}
                                className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/20"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
            {state.status === "loading" ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-40 w-full bg-white/20" />
                    <Skeleton className="h-40 w-full bg-white/20" />
                </div>
            ) : null}
            {state.status === "error" ? (
                <Alert variant="destructive" className="bg-white/90 backdrop-blur-md">
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            ) : null}
            {state.status === "clarify" ? <ClarifyPrompt question={state.question} /> : null}
            {state.status === "results" ? (
                <>
                    <FilterChips filters={state.filters} onChange={onFiltersChange} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white drop-shadow-sm" aria-live="polite">
                            {results.length} {results.length === 1 ? "listing" : "listings"}{" "}
                            {savedOnly ? "saved in these results" : "found"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                aria-pressed={savedOnly}
                                onClick={() => setSavedOnly((current) => !current)}
                                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium backdrop-blur-md transition-colors ${
                                    savedOnly
                                        ? "bg-white text-slate-900"
                                        : "border border-white/30 bg-white/10 text-white hover:bg-white/20"
                                }`}
                            >
                                <Heart
                                    className={`size-4 ${savedOnly ? "fill-red-500 text-red-500" : ""}`}
                                    aria-hidden="true"
                                />
                                Saved only
                            </button>
                            {results.length > 0 ? <SortSelect value={sort} onChange={setSort} /> : null}
                        </div>
                    </div>
                    {results.length === 0 ? (
                        <EmptyState
                            title={savedOnly ? "None of these listings are saved" : undefined}
                            description={
                                savedOnly
                                    ? "Turn off Saved only, or tap the heart on a listing and come back to this filter."
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {sortListings(results, sort).map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    )}
                </>
            ) : null}
        </PageFrame>
    );
}