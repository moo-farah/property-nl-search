import { Badge } from "@/components/ui/badge";
import type { Filters } from "@/lib/schema";

function chipsFromFilters(filters: Filters): string[] {
  const chips: string[] = [];

  if (filters.area) chips.push(filters.area);
  if (filters.type) chips.push(filters.type);
  if (filters.listingType) chips.push(filters.listingType);
  if (filters.bedrooms !== undefined) {
    chips.push(filters.bedrooms === 0 ? "Studio" : `${filters.bedrooms} beds`);
  }
  if (filters.minPriceAed !== undefined) {
    chips.push(`From ${filters.minPriceAed.toLocaleString("en-AE")} AED`);
  }
  if (filters.maxPriceAed !== undefined) {
    chips.push(`Up to ${filters.maxPriceAed.toLocaleString("en-AE")} AED`);
  }
  if (filters.furnished) chips.push(filters.furnished.replace(/_/g, " "));
  for (const amenity of filters.amenities ?? []) {
    chips.push(amenity.replace(/_/g, " "));
  }

  return chips;
}

type FilterChipsProps = {
  filters: Filters;
};

export default function FilterChips({ filters }: FilterChipsProps) {
  const chips = chipsFromFilters(filters);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Badge key={chip} variant="secondary">
          {chip}
        </Badge>
      ))}
    </div>
  );
}