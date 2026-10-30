"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SearchBar from "./components/SearchBar";
import FilterChips from "./components/FilterChips";
import ListingCard from "./components/ListingCard";
import EmptyState from "./components/EmptyState";
import ClarifyPrompt from "./components/ClarifyPrompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { filterListings } from "@/lib/FilterListings";
import { listings } from "@/lib/listings";
import { FiltersSchema, ListingsSchema, type Filters, type Listing } from "@/lib/schema";

const UNAVAILABLE = "Search is unavailable right now. Try again in a moment.";

type SearchState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "results"; filters: Filters }
    | { status: "clarify"; question: string }
    | { status: "error"; message: string };

const SORT_OPTIONS = {
    recommended: "Recommended",
    "price-asc": "Price: low to high",
    "price-desc": "Price: high to low",
    "beds-desc": "Most bedrooms",
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

function isSortKey(value: string): value is SortKey {
    return value in SORT_OPTIONS;
}

function sortListings(listings: Listing[], sort: SortKey): Listing[] {
    const sorted = [...listings];
    if (sort === "price-asc") sorted.sort((a, b) => a.priceAed - b.priceAed);
    if (sort === "price-desc") sorted.sort((a, b) => b.priceAed - a.priceAed);
    if (sort === "beds-desc") sorted.sort((a, b) => b.bedrooms - a.bedrooms);
    return sorted;
}

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

    const results = state.status === "results" ? filterListings(listings, state.filters) : [];

    function onFiltersChange(update: (filters: Filters) => Filters) {
        setState((current) => {
            if (current.status !== "results") return current;
            const filters = update(current.filters);
            return filters === current.filters ? current : { status: "results", filters };
        });
    }

    async function onSearch(text: string) {
        setQuery(text);
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
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
           <div className="fixed inset-0 -z-10">
            <Image
                src="/ae_desktop.jpg"
                alt="AE Desktop"
                fill
                preload
                sizes="100vw"
                className="object-cover object-[center_40%]"
            />
            <div className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-950/30 to-slate-950/80" />
            </div> 
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
                            {results.length} {results.length === 1 ? "listing" : "listings"} found
                        </p>
                        {results.length > 0 ? (
                            <label className="flex items-center gap-2 text-sm text-white/85">
                                Sort by
                                <div className="relative">
                                    <select
                                        value={sort}
                                        onChange={(event) => {
                                            if (isSortKey(event.target.value)) setSort(event.target.value);
                                        }}
                                        className="h-9 appearance-none rounded-full bg-white/95 pl-4 pr-10 text-sm text-slate-900 shadow-md outline-none focus-visible:ring-3 focus-visible:ring-amber-400/60"
                                    >
                                        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        aria-hidden="true"
                                        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                                    />
                                </div>
                            </label>
                        ) : null}
                    </div>
                    {results.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {sortListings(results, sort).map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    )}
                </>
            ) : null}
        </main>
    );
}