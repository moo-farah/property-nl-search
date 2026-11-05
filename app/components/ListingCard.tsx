"use client";

import Image from "next/image";
import { memo } from "react";
import { Bath, BedDouble, Heart, MapPin, Sofa } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAed, monthlyFromAnnualAed } from "@/lib/rentPrice";
import type { Listing } from "@/lib/schema";

type ListingCardProps = {
  listing: Listing;
  saved: boolean;
  onToggle: (id: string) => void;
};

function label(value: string): string {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ListingCard({ listing, saved, onToggle }: ListingCardProps) {

  const beds = listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} ${listing.bedrooms === 1 ? "bed" : "beds"}`;
  const baths = `${listing.bathrooms} ${listing.bathrooms === 1 ? "bath" : "baths"}`;
  const yearly = formatAed(listing.priceAed);
  const monthly = formatAed(monthlyFromAnnualAed(listing.priceAed));

  return (
    <Card className="bg-white/90 backdrop-blur-md transition-shadow hover:shadow-lg">
      <Image
        src={listing.image}
        alt={listing.title}
        width={800}
        height={600}
        sizes="(min-width: 768px) 480px, 100vw"
        className="aspect-4/3 w-full object-cover"
      />
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Badge className="bg-slate-900 text-white">
              For {listing.listingType}
            </Badge>
            <Badge variant="outline">{label(listing.type)}</Badge>
          </div>
          <button
            type="button"
            onClick={() => onToggle(listing.id)}
            aria-label={saved ? "Remove from favorites" : "Save to favorites"}
            aria-pressed={saved}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-500"
          >
            <Heart className={saved ? "size-5 fill-red-500 text-red-500" : "size-5"} />
          </button>
        </div>
        <CardTitle className="text-base leading-snug">{listing.title}</CardTitle>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" aria-hidden="true" />
          {listing.area}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-2xl font-bold text-slate-900">
          {listing.listingType === "rent" ? (
            <>
              {yearly}{" "}
              <span className="text-sm font-medium text-muted-foreground">AED / year</span>
              <span className="mt-1 block text-sm font-medium text-muted-foreground">
                {monthly} AED / month
              </span>
            </>
          ) : (
            <>
              {yearly} <span className="text-sm font-medium text-muted-foreground">AED</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-4 border-y py-3 text-sm text-slate-700">
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-4 text-slate-500" aria-hidden="true" />
            {beds}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-4 text-slate-500" aria-hidden="true" />
            {baths}
          </span>
          <span className="flex items-center gap-1.5">
            <Sofa className="size-4 text-slate-500" aria-hidden="true" />
            {label(listing.furnished)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {listing.amenities.map((amenity) => (
            <Badge key={amenity} variant="outline">
              {label(amenity)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(ListingCard);
