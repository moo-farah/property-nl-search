import { Badge } from "@/components/ui/badge";
import type { Filters } from "@/lib/schema";

function label(value: string): string {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function chipsFromFilters(filters: Filters): string[] {
  const chips: string[] = [];

  if (filters.area) chips.push(filters.area);
  if (filters.type) chips.push(label(filters.type));
  if (filters.listingType) chips.push(label(filters.listingType));
  if (filters.bedrooms !== undefined) {
    chips.push(filters.bedrooms === 0 ? "Studio" : `${filters.bedrooms} beds`);
  }
  if (filters.minPriceAed !== undefined) {
    chips.push(`From ${filters.minPriceAed.toLocaleString("en-AE")} AED`);
  }
  if (filters.maxPriceAed !== undefined) {
    chips.push(`Up to ${filters.maxPriceAed.toLocaleString("en-AE")} AED`);
  }
  if (filters.furnished) chips.push(label(filters.furnished));
  for (const amenity of filters.amenities ?? []) {
    chips.push(label(amenity));
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
    <div className="flex flex-col gap-2">
      <p className="text-sm text-white/85 drop-shadow-sm">Understood as</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Badge key={chip} variant="secondary" className="bg-sky-100 text-sky-900">
            {chip}
          </Badge>
        ))}
      </div>
    </div>
  );
}