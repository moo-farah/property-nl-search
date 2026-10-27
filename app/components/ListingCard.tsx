"use client";

import Image from "next/image";
import { useState } from "react";
import { Bath, BedDouble, Heart, MapPin, Sofa } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Listing } from "@/lib/schema";

type ListingCardProps = {
  listing: Listing;
};

function label(value: string): string {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [saved, setSaved] = useState(false);

  const beds = listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} ${listing.bedrooms === 1 ? "bed" : "beds"}`;
  const baths = `${listing.bathrooms} ${listing.bathrooms === 1 ? "bath" : "baths"}`;
  const price = listing.priceAed.toLocaleString("en-AE");

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
            onClick={() => setSaved(!saved)}
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
          {price} <span className="text-sm font-medium text-muted-foreground">AED{listing.listingType === "rent" ? " / year" : ""}</span>
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
