const MAX_QUERY_LENGTH = 200;

export function followUpQuery(original: string, reply: string): string {
    const base = original.trim();
    const extra = reply.trim();
    if (extra.length === 0) return base.slice(0, MAX_QUERY_LENGTH);
    if (base.length === 0) return extra.slice(0, MAX_QUERY_LENGTH);

    const separator = /[.!?]$/.test(base) ? " " : ". ";
    const combined = `${base}${separator}${extra}`;
    if (combined.length <= MAX_QUERY_LENGTH) return combined;

    const room = MAX_QUERY_LENGTH - separator.length - extra.length;
    if (room <= 0) return extra.slice(0, MAX_QUERY_LENGTH);
    return `${base.slice(0, room).trimEnd()}${separator}${extra}`;
}
