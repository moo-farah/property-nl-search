"use client";

import Image from "next/image";
import { useState } from "react";
import SearchBar from "./components/SearchBar";
import FilterChips from "./components/FilterChips";
import ListingCard from "./components/ListingCard";
import EmptyState from "./components/EmptyState";
import ClarifyPrompt from "./components/ClarifyPrompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FiltersSchema, ListingsSchema, type Filters, type Listing } from "@/lib/schema";

const UNAVAILABLE = "Search is unavailable right now. Try again in a moment.";

type SearchState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "results"; filters: Filters; results: Listing[] }
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
            return { status: "results", filters: filters.data, results: results.data };
        }
    }
    return { status: "error", message: UNAVAILABLE };
}

export default function Page() {
    const [state, setState] = useState<SearchState>({ status: "idle" });

    async function onSearch(query: string) {
        setState({ status: "loading" });
        try {
            const response = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
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
            <SearchBar onSearch={onSearch} disabled={state.status === "loading"} />
            {state.status === "idle" ? (
                <p className="text-sm text-white/85 drop-shadow-sm">
                    Type a sentence such as &quot;2 bed in Marina under 120k&quot;.
                </p>
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
                    <FilterChips filters={state.filters} />
                    {state.results.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {state.results.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    )}
                </>
            ) : null}
        </main>
    );
}