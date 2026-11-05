export const SEARCH_OUTCOMES = ["results", "relaxed", "empty", "clarify", "error"] as const;

export type SearchOutcome = (typeof SEARCH_OUTCOMES)[number];

export type SearchStats = {
    total: number;
    counts: Record<SearchOutcome, number>;
};

const MAX_ENTRIES = 100;

type Entry = {
    outcome: SearchOutcome;
    count: number;
    latencyMs: number;
};

const entries: Entry[] = [];

export function recordSearch(entry: Entry) {
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) entries.shift();
}

export function searchStats(): SearchStats {
    const counts: Record<SearchOutcome, number> = {
        results: 0,
        relaxed: 0,
        empty: 0,
        clarify: 0,
        error: 0,
    };
    for (const entry of entries) counts[entry.outcome] += 1;
    return { total: entries.length, counts };
}

export function resetSearchLog() {
    entries.length = 0;
}
