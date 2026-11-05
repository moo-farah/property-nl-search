"use client";

import { useEffect, useState } from "react";
import PageFrame from "../components/PageFrame";
import { SEARCH_OUTCOMES, type SearchOutcome, type SearchStats } from "@/lib/searchLog";

const LABELS: Record<SearchOutcome, string> = {
    results: "Matches",
    relaxed: "Broadened",
    empty: "No matches",
    clarify: "Clarifications",
    error: "Errors",
};

export default function StatsPage() {
    const [stats, setStats] = useState<SearchStats | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const response = await fetch("/api/stats");
                const body: unknown = await response.json();
                if (cancelled) return;
                if (!response.ok || !isStats(body)) {
                    setFailed(true);
                    return;
                }
                setStats(body);
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const max = stats ? Math.max(1, ...SEARCH_OUTCOMES.map((outcome) => stats.counts[outcome])) : 1;

    return (
        <PageFrame>
            <div className="flex flex-col gap-1">
                <h1 className="text-lg font-semibold text-white drop-shadow-sm">Search stats</h1>
                <p className="text-sm text-white/85 drop-shadow-sm">
                    {stats
                        ? `${stats.total} ${stats.total === 1 ? "search" : "searches"} on this server.`
                        : "Recent searches on this server."}
                </p>
            </div>
            <section className="rounded-xl bg-white/90 p-5 backdrop-blur-md">
                {failed ? (
                    <p className="text-sm text-slate-700">Stats are unavailable right now.</p>
                ) : null}
                {!failed && !stats ? (
                    <p className="text-sm text-slate-700">Loading stats…</p>
                ) : null}
                {stats && stats.total === 0 ? (
                    <p className="text-sm text-slate-700">No searches yet. Run one, then come back.</p>
                ) : null}
                {stats && stats.total > 0 ? (
                    <svg
                        viewBox="0 0 640 180"
                        role="img"
                        aria-label="Searches by outcome"
                        className="h-auto w-full"
                    >
                        {SEARCH_OUTCOMES.map((outcome, index) => {
                            const count = stats.counts[outcome];
                            const width = Math.max(count === 0 ? 0 : 4, (count / max) * 420);
                            const y = index * 36;
                            return (
                                <g key={outcome} transform={`translate(0 ${y})`}>
                                    <text x="0" y="20" className="fill-slate-700 text-[14px]">
                                        {LABELS[outcome]}
                                    </text>
                                    <rect x="150" y="6" width={width} height="16" rx="4" className="fill-slate-900" />
                                    <text x={158 + width} y="20" className="fill-slate-900 text-[14px]">
                                        {count}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                ) : null}
            </section>
            <p className="text-sm text-white/75 drop-shadow-sm">
                Counts stay in memory and reset when the server restarts.
            </p>
        </PageFrame>
    );
}

function isStats(body: unknown): body is SearchStats {
    if (typeof body !== "object" || body === null || !("total" in body) || !("counts" in body)) return false;
    if (typeof body.total !== "number" || typeof body.counts !== "object" || body.counts === null) return false;
    return SEARCH_OUTCOMES.every((outcome) => {
        const value = (body.counts as Record<string, unknown>)[outcome];
        return typeof value === "number";
    });
}
