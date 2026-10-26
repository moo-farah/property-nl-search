const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string): boolean {
    const now = Date.now();
    const current = hits.get(ip);

    if (!current || now >= current.resetAt) {
        hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (current.count >= MAX_REQUESTS) return false;
    current.count += 1;
    return true;
}
