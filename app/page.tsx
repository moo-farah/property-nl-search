"use client";
import SearchBar from "./components/SearchBar";
import FilterChips from "./components/FilterChips";
import ListingCard from "./components/ListingCard";
import listings from "@/data/listing.json";
import type { Listing } from "@/lib/schema";

const page = () => {
  return (
    <main className="mx-auto max-w-xl p-6">
      <SearchBar onSearch={() => {}} />
      <FilterChips
      filters={{
        area: "Dubai Marina",
        listingType: "rent",
        bedrooms: 2,
        maxPriceAed: 120000,
   }}
   />
   <ListingCard listing={listings[0] as Listing} />
   <ListingCard listing={listings[1] as Listing} />
   <ListingCard listing={listings[2] as Listing} />
   <ListingCard listing={listings[3] as Listing} />
   <ListingCard listing={listings[4] as Listing} />
   <ListingCard listing={listings[5] as Listing} />
   <ListingCard listing={listings[6] as Listing} />
   <ListingCard listing={listings[7] as Listing} />
   <ListingCard listing={listings[8] as Listing} />
   <ListingCard listing={listings[9] as Listing} />
    </main>
  )
}

export default page