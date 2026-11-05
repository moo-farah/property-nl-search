"use client";

import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "./SearchBar";
import FilterChips from "./FilterChips";
import ListingCard from "./ListingCard";
import EmptyState from "./EmptyState";
import ClarifyPrompt from "./ClarifyPrompt";
import SortSelect from "./SortSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { emptySearchHint } from "@/lib/emptySearch";
import { filterListings } from "@/lib/FilterListings";
import { followUpQuery } from "@/lib/followUpQuery";
import { useFavorites } from "@/lib/favorites";
import { listings } from "@/lib/listings";
import { RELAX_FIELDS, relaxFilters, relaxedNote, type RelaxedField } from "@/lib/relaxFilters";
import { FiltersSchema, ListingsSchema, type Filters } from "@/lib/schema";
import { sortListings, type SortKey } from "@/lib/sortListings";

const UNAVAILABLE = "Search is unavailable right now. Try again in a moment.";

const EXAMPLE_SEARCHES = [
    "Villa in Palm Jumeirah with pool",
    "2 bed in Marina under 120k",
    "1 bed in Business Bay under 100k",
    "Studio for rent in JVC",
];

type SearchState =
    | { status: "idle" }
    | { status: "loading"; filters?: Filters }
    | { status: "results"; filters: Filters; dropped: RelaxedField[] }
    | { status: "clarify"; question: string }
    | { status: "error"; message: string };

type FocusTarget = "results" | "clarify";

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
            return { status: "results", filters: filters.data, dropped: readDropped(body) };
        }
    }
    return { status: "error", message: UNAVAILABLE };
}

function readDropped(body: object): RelaxedField[] {
    if (!("relaxed" in body) || !Array.isArray(body.relaxed)) return [];
    return body.relaxed.filter((field): field is RelaxedField =>
        typeof field === "string" && (RELAX_FIELDS as readonly string[]).includes(field),
    );
}

function activeFilters(state: SearchState): Filters | undefined {
    if (state.status === "results") return state.filters;
    if (state.status === "loading") return state.filters;
    return undefined;
}

function readQueryParam(params: { get(name: string): string | null }): string {
    return (params.get("q") ?? "").trim().slice(0, 200);
}

export default function SearchExperience() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlQuery = readQueryParam(searchParams);
    const [state, setState] = useState<SearchState>(
        urlQuery ? { status: "loading" } : { status: "idle" },
    );
    const [sort, setSort] = useState<SortKey>("recommended");
    const [query, setQuery] = useState(urlQuery);
    const [savedOnly, setSavedOnly] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [trackedQuery, setTrackedQuery] = useState(urlQuery);
    const { savedIds, toggle } = useFavorites();
    const resultsRef = useRef<HTMLParagraphElement>(null);
    const clarifyRef = useRef<HTMLInputElement>(null);
    const focusRef = useRef<FocusTarget | null>(null);

    if (urlQuery !== trackedQuery) {
        setTrackedQuery(urlQuery);
        setQuery(urlQuery);
        setSavedOnly(false);
        setState((current) => {
            if (urlQuery.length === 0) return { status: "idle" };
            const previous = activeFilters(current);
            return previous ? { status: "loading", filters: previous } : { status: "loading" };
        });
    }

    const filters = activeFilters(state);
    const matches = filters ? filterListings(listings, filters) : [];
    const results = savedOnly ? matches.filter((listing) => savedIds.has(listing.id)) : matches;
    const pending = state.status === "loading";

    useEffect(() => {
        if (urlQuery.length === 0) return;
        const controller = new AbortController();

        void (async () => {
            try {
                const response = await fetch("/api/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: urlQuery }),
                    signal: controller.signal,
                });
                const next = readResponse(await response.json());
                if (controller.signal.aborted) return;
                if (next.status === "results" || next.status === "clarify") focusRef.current = next.status;
                setState(next);
            } catch {
                if (controller.signal.aborted) return;
                setState({ status: "error", message: UNAVAILABLE });
            }
        })();

        return () => controller.abort();
    }, [urlQuery, attempt]);

    useEffect(() => {
        const target = focusRef.current;
        if (target === null) return;
        focusRef.current = null;
        const active = document.activeElement;
        const editingSearch =
            active instanceof HTMLInputElement && active.getAttribute("aria-label") === "Search listings";
        if (editingSearch) return;
        if (target === "results") resultsRef.current?.focus();
        if (target === "clarify") clarifyRef.current?.focus();
    });

    function onSearch(text: string) {
        const next = text.trim().slice(0, 200);
        if (next.length === 0) return;
        setQuery(next);
        if (next === urlQuery) {
            setSavedOnly(false);
            setState((current) => {
                const previous = activeFilters(current);
                return previous ? { status: "loading", filters: previous } : { status: "loading" };
            });
            setAttempt((current) => current + 1);
            return;
        }
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", next);
        router.push(`/?${params.toString()}`, { scroll: false });
    }

    function onFiltersChange(update: (filters: Filters) => Filters) {
        setState((current) => {
            const currentFilters = activeFilters(current);
            if (!currentFilters) return current;
            const next = update(currentFilters);
            if (next === currentFilters) return current;
            const relaxed = relaxFilters(listings, next);
            if (current.status === "loading") return { status: "loading", filters: relaxed.filters };
            return { status: "results", filters: relaxed.filters, dropped: relaxed.dropped };
        });
    }

    return (
        <>
            <SearchBar query={query} onQueryChange={setQuery} onSearch={onSearch} pending={pending} />
            {!filters && state.status !== "clarify" ? (
                <ExampleSearches onSearch={onSearch} />
            ) : null}
            {pending && !filters ? (
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
            {state.status === "clarify" ? (
                <>
                    <ClarifyPrompt
                        question={state.question}
                        inputRef={clarifyRef}
                        pending={pending}
                        onReply={(reply) => onSearch(followUpQuery(urlQuery, reply))}
                    />
                    <ExampleSearches onSearch={onSearch} label="Or try an example:" />
                </>
            ) : null}
            {filters ? (
                <>
                    <FilterChips filters={filters} onChange={onFiltersChange} />
                    {state.status === "results" && state.dropped.length > 0 ? (
                        <p className="text-sm text-white drop-shadow-sm">{relaxedNote(state.dropped)}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p
                            ref={resultsRef}
                            tabIndex={-1}
                            aria-live="polite"
                            className="text-sm font-medium text-white drop-shadow-sm outline-none"
                        >
                            {pending
                                ? "Searching…"
                                : `${results.length} ${results.length === 1 ? "listing" : "listings"} ${
                                      savedOnly ? "saved in these results" : "found"
                                  }`}
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
                                    : emptySearchHint(filters)
                            }
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {sortListings(results, sort).map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    saved={savedIds.has(listing.id)}
                                    onToggle={toggle}
                                />
                            ))}
                        </div>
                    )}
                </>
            ) : null}
        </>
    );
}

function ExampleSearches({ onSearch, label = "Try an example:" }: { onSearch: (query: string) => void; label?: string }) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-white/85 drop-shadow-sm">{label}</p>
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
    );
}
