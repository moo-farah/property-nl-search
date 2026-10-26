import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ClarifyPromptProps = {
  question: string;
};

export default function ClarifyPrompt({ question }: ClarifyPromptProps) {
  if (question.trim().length === 0) return null;

  return (
    <Alert>
      <AlertTitle>Need a bit more detail</AlertTitle>
      <AlertDescription>{question}</AlertDescription>
    </Alert>
  );
}
