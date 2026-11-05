"use client";

import { FormEvent, type Ref, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClarifyPromptProps = {
    question: string;
    onReply: (reply: string) => void;
    inputRef?: Ref<HTMLInputElement>;
    pending?: boolean;
};

export default function ClarifyPrompt({ question, onReply, inputRef, pending = false }: ClarifyPromptProps) {
    const [reply, setReply] = useState("");

    if (question.trim().length === 0) return null;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const next = reply.trim();
        if (next.length === 0) return;
        onReply(next);
    }

    return (
        <Alert className="bg-white/90 backdrop-blur-md">
            <AlertTitle>Need a bit more detail</AlertTitle>
            <AlertDescription>
                <span className="block">{question}</span>
                <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                        ref={inputRef}
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        maxLength={200}
                        placeholder="e.g. Marina, 2 bedrooms, under 80k"
                        aria-label="Answer the clarification"
                        className="h-9 bg-white text-slate-900"
                    />
                    <Button
                        type="submit"
                        size="lg"
                        aria-busy={pending}
                        className="min-w-28 rounded-full bg-rose-500 px-5 font-semibold text-slate-50 hover:bg-rose-300"
                    >
                        {pending ? "Searching…" : "Search"}
                    </Button>
                </form>
            </AlertDescription>
        </Alert>
    );
}
