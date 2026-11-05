"use client";

import { FormEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClarifyPromptProps = {
    question: string;
    onReply: (reply: string) => void;
    disabled?: boolean;
};

export default function ClarifyPrompt({ question, onReply, disabled = false }: ClarifyPromptProps) {
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
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        maxLength={200}
                        placeholder="e.g. 2 bed in Marina under 120k"
                        aria-label="Answer the clarification"
                        disabled={disabled}
                        className="h-9 bg-white text-slate-900"
                    />
                    <Button
                        type="submit"
                        size="lg"
                        disabled={disabled}
                        className="rounded-full bg-rose-500 px-5 font-semibold text-slate-50 hover:bg-rose-300"
                    >
                        Search
                    </Button>
                </form>
            </AlertDescription>
        </Alert>
    );
}
