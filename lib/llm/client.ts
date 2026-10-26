import {
    FunctionCallingConfigMode,
    GoogleGenAI,
    type GenerateContentResponse,
    type Tool,
} from "@google/genai";

const TIMEOUT_MS = 30_000;
const FRIENDLY_ERROR = "Search is unavailable right now. Try again in a moment.";

const RETRY_STATUS_CODES = [
    429, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
];

export type ToolCallRequest = {
    contents: string;
    systemInstruction: string;
    tools: Tool[];
};

function readEnv(name: "GEMINI_API_KEY" | "GEMINI_MODEL"): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(FRIENDLY_ERROR);
    }
    return value;
}

export async function generateToolCall(
    request: ToolCallRequest,
): Promise<GenerateContentResponse> {
    const ai = new GoogleGenAI({ apiKey: readEnv("GEMINI_API_KEY") });

    try {
        return await ai.models.generateContent({
            model: readEnv("GEMINI_MODEL"),
            contents: request.contents,
            config: {
                systemInstruction: request.systemInstruction,
                temperature: 0,
                tools: request.tools,
                toolConfig: {
                    functionCallingConfig: {
                        mode: FunctionCallingConfigMode.ANY,
                    },
                },
                httpOptions: {
                    timeout: TIMEOUT_MS,
                    retryOptions: {
                        attempts: 2,
                        httpStatusCodes: RETRY_STATUS_CODES,
                    },
                },
            },
        });
    } catch (error) {
        console.error(error);
        throw new Error(FRIENDLY_ERROR, { cause: error });
    }
}