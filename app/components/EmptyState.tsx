import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export default function EmptyState({
  title = "No listings found",
  description = "Change or remove a filter above, or try a different search.",
}: EmptyStateProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{description}</CardContent>
    </Card>
  );
}
