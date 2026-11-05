import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "favorite-listings";
const listeners = new Set<() => void>();

function readRaw(): string {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? "[]";
    } catch {
        return "[]";
    }
}

function parseIds(raw: string): string[] {
    try {
        const value: unknown = JSON.parse(raw);
        return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
    } catch {
        return [];
    }
}

function subscribe(onChange: () => void): () => void {
    listeners.add(onChange);
    window.addEventListener("storage", onChange);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
    };
}

export function useFavorites() {
    const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
    const ids = useMemo(() => parseIds(raw), [raw]);
    const savedIds = useMemo(() => new Set(ids), [ids]);

    const toggle = useCallback((id: string) => {
        const current = parseIds(readRaw());
        const next = current.includes(id) ? current.filter((saved) => saved !== id) : [...current, id];
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            return;
        }
        listeners.forEach((listener) => listener());
    }, []);

    return { ids, savedIds, isFavorite: (id: string) => savedIds.has(id), toggle };
}