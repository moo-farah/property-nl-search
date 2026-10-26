import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No listings found</CardTitle>
      </CardHeader>
      <CardContent>
        Try a different area, budget, or number of bedrooms.
      </CardContent>
    </Card>
  );
}
