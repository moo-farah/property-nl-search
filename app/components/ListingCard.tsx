import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Listing } from "@/lib/schema";

type ListingCardProps = {
  listing: Listing;
};

export default function ListingCard({ listing }: ListingCardProps) {
  const beds = listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} beds`;
  const price = `${listing.priceAed.toLocaleString("en-AE")} AED`;
  const priceLabel = listing.listingType === "rent" ? `${price} / year` : price;
  const furnished = listing.furnished.replace(/_/g, " ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{listing.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-lg font-semibold">{priceLabel}</p>
        <p className="text-muted-foreground">
          {listing.area} · {beds} · {listing.bathrooms} baths · {furnished}
        </p>
        <div className="flex flex-wrap gap-2">
          {listing.amenities.map((amenity) => (
            <Badge key={amenity} variant="outline">
              {amenity.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}