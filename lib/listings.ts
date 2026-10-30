import listingsData from "../data/listing.json";
import { ListingsSchema, type Listing } from "./schema";

export const listings: Listing[] = ListingsSchema.parse(listingsData);
