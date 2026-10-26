import { z } from "zod";
import { FiltersSchema, type Filters } from "../schema";
import { generateToolCall } from "./client";
import { PROMPT_V1 } from "./prompts";
import { ASK_CLARIFICATION, SEARCH_LISTINGS, listingTools } from "./tools";

const MAX_QUERY_LENGTH = 200;

const ClarificationSchema = z.object({
    question: z.string().trim().min(1),
});

export type ParseQueryResult =
    | { ok: true; kind: "filters"; filters: Filters }
    | { ok: true; kind: "clarify"; question: string }
    | { ok: false; kind: "invalid" };

export async function parseQuery(
    query: string,
    prompt: string = PROMPT_V1,
): Promise<ParseQueryResult> {
    const text = query.trim();
    if (text.length === 0 || text.length > MAX_QUERY_LENGTH) {
        return { ok: false, kind: "invalid" };
    }

    const response = await generateToolCall({
        contents: text,
        systemInstruction: prompt,
        tools: listingTools,
    });

    const call = response.functionCalls?.[0];
    if (!call?.name) {
        return { ok: false, kind: "invalid" };
    }

    if (call.name === SEARCH_LISTINGS) {
        const parsed = FiltersSchema.safeParse(call.args ?? {});
        if (!parsed.success) {
            return { ok: false, kind: "invalid" };
        }
        return { ok: true, kind: "filters", filters: parsed.data };
    }

    if (call.name === ASK_CLARIFICATION) {
        const parsed = ClarificationSchema.safeParse(call.args ?? {});
        if (!parsed.success) {
            return { ok: false, kind: "invalid" };
        }
        return { ok: true, kind: "clarify", question: parsed.data.question };
    }

    return { ok: false, kind: "invalid" };
}
