import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmptyState() {
  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle>No listings found</CardTitle>
      </CardHeader>
      <CardContent>
        Change or remove a filter above, or try a different search.
      </CardContent>
    </Card>
  );
}
