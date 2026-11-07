import { NextResponse } from "next/server";
import { listings } from "@/lib/listings";
import { parseQuery } from "@/lib/llm/parseQuery";
import { PROMPT_V2 } from "@/lib/llm/prompts";
import { rateLimit } from "@/lib/rateLimit";
import { relaxFilters } from "@/lib/relaxFilters";
import { recordSearch, type SearchOutcome } from "@/lib/searchLog";

const UNAVAILABLE = "Search is unavailable right now. Try again in a moment.";

function clientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim();
    return ip || "unknown";
}

function readQuery(body: unknown): string | null {
    if (typeof body !== "object" || body === null || !("query" in body)) return null;
    if (typeof body.query !== "string") return null;
    const query = body.query.trim();
    if (query.length === 0 || query.length > 200) return null;
    return query;
}

export async function POST(request: Request) {
    if (!rateLimit(clientIp(request))) {
        return NextResponse.json(
            { error: "Too many searches. Try again in a minute." },
            { status: 429 },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Send a search sentence." }, { status: 422 });
    }

    const query = readQuery(body);
    if (!query) {
        return NextResponse.json(
            { error: "Enter a search of 200 characters or fewer." },
            { status: 422 },
        );
    }

    const started = Date.now();
    try {
        const parsed = await parseQuery(query, PROMPT_V2);
        if (!parsed.ok) {
            recordSearch({ outcome: "error", count: 0, latencyMs: Date.now() - started });
            return NextResponse.json(
                { error: "Could not understand that search." },
                { status: 422 },
            );
        }
        if (parsed.kind === "clarify") {
            recordSearch({ outcome: "clarify", count: 0, latencyMs: Date.now() - started });
            return NextResponse.json({ clarify: parsed.question });
        }
        const relaxed = relaxFilters(listings, parsed.filters);
        recordSearch({
            outcome: outcomeFor(relaxed.dropped.length, relaxed.results.length),
            count: relaxed.results.length,
            latencyMs: Date.now() - started,
        });
        return NextResponse.json({
            filters: relaxed.filters,
            results: relaxed.results,
            relaxed: relaxed.dropped,
        });
    } catch (error) {
        recordSearch({ outcome: "error", count: 0, latencyMs: Date.now() - started });
        const message = error instanceof Error ? error.message : UNAVAILABLE;
        return NextResponse.json({ error: message }, { status: 503 });
    }
}

function outcomeFor(dropped: number, count: number): SearchOutcome {
    if (count === 0) return "empty";
    if (dropped > 0) return "relaxed";
    return "results";
}
