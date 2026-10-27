import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ClarifyPromptProps = {
  question: string;
};

export default function ClarifyPrompt({ question }: ClarifyPromptProps) {
  if (question.trim().length === 0) return null;

  return (
    <Alert className="bg-white/90 backdrop-blur-md">
      <AlertTitle>Need a bit more detail</AlertTitle>
      <AlertDescription>{question}</AlertDescription>
    </Alert>
  );
}
