import { NextResponse } from "next/server";
import { filterListings } from "@/lib/FilterListings";
import { listings } from "@/lib/listings";
import { parseQuery } from "@/lib/llm/parseQuery";
import { PROMPT_V2 } from "@/lib/llm/prompts";
import { rateLimit } from "@/lib/rateLimit";

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

    try {
        const parsed = await parseQuery(query, PROMPT_V2);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: "Could not understand that search." },
                { status: 422 },
            );
        }
        if (parsed.kind === "clarify") {
            return NextResponse.json({ clarify: parsed.question });
        }
        return NextResponse.json({
            filters: parsed.filters,
            results: filterListings(listings, parsed.filters),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : UNAVAILABLE;
        return NextResponse.json({ error: message }, { status: 503 });
    }
}
