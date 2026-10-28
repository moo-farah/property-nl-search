import type { ParseQueryResult } from "../lib/llm/parseQuery";
import type { Filters } from "../lib/schema";

export type ExpectedResult =
    | { kind: "filters"; filters: Partial<Filters> }
    | { kind: "clarify" };

export type FieldComparison = {
    field: keyof Filters;
    expected: Filters[keyof Filters];
    actual: Filters[keyof Filters] | undefined;
    matched: boolean;
};

export type ComparisonResult = {
    kindCorrect: boolean;
    exactMatch: boolean;
    matchedFields: number;
    totalFields: number;
    fields: FieldComparison[];
};

function valuesMatch(
    field: keyof Filters,
    expected: Filters[keyof Filters],
    actual: Filters[keyof Filters] | undefined,
): boolean {
    if (field === "amenities") {
        if (!Array.isArray(expected) || !Array.isArray(actual)) {
            return false;
        }

        const expectedAmenities = [...expected].sort();
        const actualAmenities = [...actual].sort();

        return (
            expectedAmenities.length === actualAmenities.length &&
            expectedAmenities.every(
                (amenity, index) => amenity === actualAmenities[index],
            )
        );
    }

    return expected === actual;
}

export function compareResult(
    expected: ExpectedResult,
    actual: ParseQueryResult,
): ComparisonResult {
    const kindCorrect = actual.ok && expected.kind === actual.kind;

    if (
        !kindCorrect ||
        expected.kind === "clarify" ||
        !actual.ok ||
        actual.kind !== "filters"
    ) {
        return {
            kindCorrect,
            exactMatch: kindCorrect,
            matchedFields: 0,
            totalFields:
                expected.kind === "filters"
                    ? Object.keys(expected.filters).length
                    : 0,
            fields: [],
        };
    }

    const fields = Object.entries(expected.filters).map(
        ([field, expectedValue]) => {
            const filterField = field as keyof Filters;
            const actualValue = actual.filters[filterField];

            return {
                field: filterField,
                expected: expectedValue,
                actual: actualValue,
                matched: valuesMatch(
                    filterField,
                    expectedValue,
                    actualValue,
                ),
            } satisfies FieldComparison;
        },
    );

    const matchedFields = fields.filter((field) => field.matched).length;

    return {
        kindCorrect: true,
        exactMatch: matchedFields === fields.length,
        matchedFields,
        totalFields: fields.length,
        fields,
    };
}
