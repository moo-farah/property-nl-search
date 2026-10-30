import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { parseQuery, type ParseQueryResult } from "../lib/llm/parseQuery";
import { PROMPT_V1, PROMPT_V2, PROMPT_V3, PROMPT_V4 } from "../lib/llm/prompts";
import { FiltersSchema } from "../lib/schema";
import {
    compareResult,
    type ComparisonResult,
    type ExpectedResult,
} from "./compare";

const DELAY_MS = 4_500;

const promptVersions = {
    v1: PROMPT_V1,
    v2: PROMPT_V2,
    v3: PROMPT_V3,
    v4: PROMPT_V4,
} as const;

type PromptVersion = keyof typeof promptVersions;

const CategorySchema = z.enum([
    "simple",
    "shorthand_units",
    "uae_specific",
    "messy",
    "vague",
    "tricky",
]);

const ExpectedResultSchema = z.discriminatedUnion("kind", [
    z.object({
        kind: z.literal("filters"),
        filters: FiltersSchema,
    }),
    z.object({
        kind: z.literal("clarify"),
    }),
]);

const EvalCaseSchema = z.object({
    id: z.string().trim().min(1),
    category: CategorySchema,
    query: z.string().trim().min(1).max(200),
    expect: ExpectedResultSchema,
});

const EvalCasesSchema = z
    .array(EvalCaseSchema)
    .min(1)
    .superRefine((cases, context) => {
        const ids = new Set<string>();

        for (const [index, testCase] of cases.entries()) {
            if (ids.has(testCase.id)) {
                context.addIssue({
                    code: "custom",
                    message: `Duplicate case id: ${testCase.id}`,
                    path: [index, "id"],
                });
            }
            ids.add(testCase.id);
        }
    });

type EvalCase = z.infer<typeof EvalCaseSchema>;
type Category = z.infer<typeof CategorySchema>;

type CaseResult = {
    id: string;
    category: Category;
    query: string;
    expected: ExpectedResult;
    actual: ParseQueryResult | null;
    comparison: ComparisonResult | null;
    latencyMs: number;
    error?: string;
};

type Metrics = {
    totalCases: number;
    passedCases: number;
    exactMatchRate: number;
    fieldAccuracy: number;
    clarifyAccuracy: number;
    schemaValidityRate: number;
    averageLatencyMs: number;
    medianLatencyMs: number;
    p95LatencyMs: number;
};

function isPromptVersion(value: string | undefined): value is PromptVersion {
    return value !== undefined && value in promptVersions;
}

function roundRate(value: number): number {
    return Math.round(value * 10_000) / 10_000;
}

function divide(numerator: number, denominator: number): number {
    return denominator === 0 ? 0 : numerator / denominator;
}

function percentile(values: number[], percentileValue: number): number {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
}

function aggregate(results: CaseResult[]): Metrics {
    const passedCases = results.filter(
        (result) => result.comparison?.exactMatch,
    ).length;
    const matchedFields = results.reduce(
        (total, result) =>
            total + (result.comparison?.matchedFields ?? 0),
        0,
    );
    const expectedFields = results.reduce(
        (total, result) => total + (result.comparison?.totalFields ?? 0),
        0,
    );
    const clarifyCases = results.filter(
        (result) => result.expected.kind === "clarify",
    );
    const correctClarifyCases = clarifyCases.filter(
        (result) =>
            result.actual?.ok === true && result.actual.kind === "clarify",
    ).length;
    const validCases = results.filter(
        (result) => result.actual?.ok === true,
    ).length;
    const latencies = results.map((result) => result.latencyMs);

    return {
        totalCases: results.length,
        passedCases,
        exactMatchRate: roundRate(divide(passedCases, results.length)),
        fieldAccuracy: roundRate(divide(matchedFields, expectedFields)),
        clarifyAccuracy: roundRate(
            divide(correctClarifyCases, clarifyCases.length),
        ),
        schemaValidityRate: roundRate(divide(validCases, results.length)),
        averageLatencyMs: Math.round(
            divide(
                latencies.reduce((total, latency) => total + latency, 0),
                latencies.length,
            ),
        ),
        medianLatencyMs: percentile(latencies, 50),
        p95LatencyMs: percentile(latencies, 95),
    };
}

function aggregateByCategory(
    results: CaseResult[],
): Record<string, Metrics> {
    const grouped: Partial<Record<Category, CaseResult[]>> = {};

    for (const result of results) {
        (grouped[result.category] ??= []).push(result);
    }

    return Object.fromEntries(
        Object.entries(grouped).map(([category, categoryResults]) => [
            category,
            aggregate(categoryResults),
        ]),
    );
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isHoldout(argv: string[]): boolean {
    return argv.includes("--holdout");
}

async function loadCases(holdout: boolean): Promise<EvalCase[]> {
    const fileName = holdout ? "./holdout.json" : "./cases.json";
    const casesUrl = new URL(fileName, import.meta.url);
    const contents = await readFile(casesUrl, "utf8");
    return EvalCasesSchema.parse(JSON.parse(contents));
}

async function evaluateCase(
    testCase: EvalCase,
    prompt: string,
): Promise<CaseResult> {
    const startedAt = performance.now();

    try {
        const actual = await parseQuery(testCase.query, prompt);
        const latencyMs = Math.round(performance.now() - startedAt);

        return {
            id: testCase.id,
            category: testCase.category,
            query: testCase.query,
            expected: testCase.expect,
            actual,
            comparison: compareResult(testCase.expect, actual),
            latencyMs,
        };
    } catch (error) {
        return {
            id: testCase.id,
            category: testCase.category,
            query: testCase.query,
            expected: testCase.expect,
            actual: null,
            comparison: null,
            latencyMs: Math.round(performance.now() - startedAt),
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

async function main(): Promise<void> {
    const requestedVersion = process.argv[2];
    const holdout = isHoldout(process.argv);

    if (!isPromptVersion(requestedVersion)) {
        throw new Error("Usage: npm run eval -- <v1|v2|v3|v4> [--holdout]");
    }

    const cases = await loadCases(holdout);
    const results: CaseResult[] = [];
    const datasetLabel = holdout ? "holdout" : "development";

    console.log(
        `Running ${cases.length} ${datasetLabel} cases with prompt ${requestedVersion}...`,
    );

    for (const [index, testCase] of cases.entries()) {
        const result = await evaluateCase(
            testCase,
            promptVersions[requestedVersion],
        );
        results.push(result);

        const status = result.comparison?.exactMatch ? "PASS" : "FAIL";
        console.log(
            `[${index + 1}/${cases.length}] ${status} ${testCase.id} (${result.latencyMs}ms)`,
        );

        if (index < cases.length - 1) {
            await delay(DELAY_MS);
        }
    }

    const output = {
        promptVersion: requestedVersion,
        dataset: datasetLabel,
        model: process.env.GEMINI_MODEL ?? "unknown",
        createdAt: new Date().toISOString(),
        summary: aggregate(results),
        categories: aggregateByCategory(results),
        cases: results,
    };
    const outputName = holdout
        ? `holdout-${requestedVersion}.json`
        : `${requestedVersion}.json`;
    const outputUrl = new URL(`./results/${outputName}`, import.meta.url);

    await writeFile(outputUrl, `${JSON.stringify(output, null, 2)}\n`, "utf8");

    console.log(`Results written to ${fileURLToPath(outputUrl)}`);
    console.log(output.summary);
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
