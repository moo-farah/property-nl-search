import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmptyState() {
  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle>No listings found</CardTitle>
      </CardHeader>
      <CardContent>
        Try a different area, budget, or number of bedrooms.
      </CardContent>
    </Card>
  );
}
