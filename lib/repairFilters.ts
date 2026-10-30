import { AreaSchema, type Area, type Filters, type PropertyType } from "./schema";

export const NEEDS_A_CONSTRAINT =
    "Which area, budget, or number of bedrooms do you prefer?";

const COVERED_AREAS = new Intl.ListFormat("en", { type: "conjunction" }).format(
    AreaSchema.options,
);

const AREA_MENTIONS: { phrase: string; area: Area }[] = [
    { phrase: "jumeirah village circle", area: "Jumeirah Village Circle" },
    { phrase: "jumeirah lakes towers", area: "Jumeirah Lakes Towers" },
    { phrase: "dubai hills estate", area: "Dubai Hills Estate" },
    { phrase: "dubai hills", area: "Dubai Hills Estate" },
    { phrase: "downtown dubai", area: "Downtown Dubai" },
    { phrase: "dubai marina", area: "Dubai Marina" },
    { phrase: "palm jumeirah", area: "Palm Jumeirah" },
    { phrase: "business bay", area: "Business Bay" },
    { phrase: "al barsha", area: "Al Barsha" },
    { phrase: "downtown", area: "Downtown Dubai" },
    { phrase: "marina", area: "Dubai Marina" },
    { phrase: "barsha", area: "Al Barsha" },
    { phrase: "palm", area: "Palm Jumeirah" },
    { phrase: "jvc", area: "Jumeirah Village Circle" },
    { phrase: "jlt", area: "Jumeirah Lakes Towers" },
];

const TYPE_MENTIONS: { type: PropertyType; pattern: RegExp }[] = [
    { type: "apartment", pattern: /\b(apartments?|flats?)\b/i },
    { type: "penthouse", pattern: /\bpenthouses?\b/i },
    { type: "townhouse", pattern: /\btown\s*houses?\b/i },
    { type: "villa", pattern: /\bvillas?\b/i },
];

const SALE_PATTERN = /\b(buy|buying|bought|sale|resale|purchase|purchasing)\b/i;
const PLACE_INTRODUCERS = new Set(["in", "at", "near"]);
const PLACE_STOP_WORDS = new Set([
    "under",
    "over",
    "below",
    "above",
    "for",
    "with",
    "budget",
    "max",
    "from",
    "up",
    "to",
    "and",
    "between",
    "before",
    "after",
    "asap",
    "bedroom",
    "bedrooms",
    "bed",
    "beds",
    "br",
    "rent",
    "rental",
    "sale",
    "buy",
    "buying",
]);
const FILLER_WORDS = new Set(["the", "a", "an", "my", "our"]);
const JOIN_WORDS = new Set(["or", "and"]);
const PROPERTY_WORDS = new Set([
    "apartment",
    "apartments",
    "flat",
    "flats",
    "villa",
    "villas",
    "townhouse",
    "townhouses",
    "penthouse",
    "penthouses",
    "studio",
    "studios",
    "home",
    "homes",
    "house",
    "houses",
    "property",
    "place",
    "furnished",
    "unfurnished",
]);

export type RepairedQuery =
    | { kind: "filters"; filters: Filters }
    | { kind: "clarify"; question: string };

export function repairFilters(query: string, filters: Filters): RepairedQuery {
    const uncovered = uncoveredPlace(query);
    if (uncovered) {
        return { kind: "clarify", question: uncoveredPlaceQuestion(uncovered) };
    }

    let next = fillDroppedArea(query, filters);
    next = dropUnmentionedType(query, next);
    next = withListingType(query, next);

    if (!hasConcreteFilter(next)) {
        return { kind: "clarify", question: NEEDS_A_CONSTRAINT };
    }

    return { kind: "filters", filters: next };
}

export function uncoveredPlaceQuestion(place: string): string {
    const name = place
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    return `${name} is not covered. Searches here are limited to ${COVERED_AREAS}.`;
}

function uncoveredPlace(query: string): string | null {
    for (const phrase of placePhrases(query)) {
        if (isSupportedPlace(phrase) || isPropertyPhrase(phrase)) continue;
        return phrase;
    }
    return null;
}

function placePhrases(query: string): string[] {
    const words = query.split(/[^a-z0-9]+/i).filter((word) => word.length > 0);
    const phrases: string[] = [];

    for (let index = 0; index < words.length; index += 1) {
        if (!PLACE_INTRODUCERS.has(words[index].toLowerCase())) continue;
        const place: string[] = [];
        for (let cursor = index + 1; cursor < words.length; cursor += 1) {
            const word = words[cursor].toLowerCase();
            if (PLACE_STOP_WORDS.has(word) || /\d/.test(word)) break;
            place.push(words[cursor]);
        }
        if (place.length > 0) phrases.push(place.join(" "));
    }

    return phrases;
}

function isSupportedPlace(phrase: string): boolean {
    const areas = mentionedAreas(phrase);
    if (areas.length === 0) return false;
    const aliasWords = new Set(
        AREA_MENTIONS.filter((mention) => areas.includes(mention.area)).flatMap((mention) =>
            mention.phrase.split(" "),
        ),
    );
    return placeWords(phrase).every((word) => aliasWords.has(word));
}

function isPropertyPhrase(phrase: string): boolean {
    const words = placeWords(phrase);
    return words.length > 0 && words.every((word) => PROPERTY_WORDS.has(word));
}

function placeWords(phrase: string): string[] {
    return phrase
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0 && !FILLER_WORDS.has(word) && !JOIN_WORDS.has(word));
}

function fillDroppedArea(query: string, filters: Filters): Filters {
    if (filters.area !== undefined) return filters;
    const mentioned = mentionedAreas(query);
    if (mentioned.length !== 1) return filters;
    return { ...filters, area: mentioned[0] };
}

function mentionedAreas(query: string): Area[] {
    const found = new Set<Area>();
    for (const mention of AREA_MENTIONS) {
        const pattern = new RegExp(`\\b${escapeRegExp(mention.phrase)}\\b`, "i");
        if (pattern.test(query)) found.add(mention.area);
    }
    return [...found];
}

function dropUnmentionedType(query: string, filters: Filters): Filters {
    if (filters.type === undefined) return filters;
    const mentioned = TYPE_MENTIONS.find((mention) => mention.type === filters.type);
    if (mentioned?.pattern.test(query)) return filters;
    const next = { ...filters };
    delete next.type;
    return next;
}

function withListingType(query: string, filters: Filters): Filters {
    if (filters.listingType !== undefined) return filters;
    return { ...filters, listingType: SALE_PATTERN.test(query) ? "sale" : "rent" };
}

function hasConcreteFilter(filters: Filters): boolean {
    return (
        filters.area !== undefined ||
        filters.type !== undefined ||
        filters.bedrooms !== undefined ||
        filters.minPriceAed !== undefined ||
        filters.maxPriceAed !== undefined ||
        filters.furnished !== undefined ||
        (filters.amenities?.length ?? 0) > 0
    );
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
