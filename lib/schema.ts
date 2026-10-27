import { z } from "zod";

export const AreaSchema = z.enum([
    "Al Barsha",
    "Business Bay",
    "Downtown Dubai",
    "Dubai Hills Estate",
    "Dubai Marina",
    "Jumeirah Lakes Towers",
    "Jumeirah Village Circle",
    "Palm Jumeirah",
]);

export const PropertyTypeSchema = z.enum([
    "apartment",
    "penthouse",
    "townhouse",
    "villa",
]);

export const ListingTypeSchema = z.enum(["rent", "sale"]);

export const FurnishedSchema = z.enum([
    "furnished",
    "unfurnished",
    "partly_furnished",
]);

export const AmenitySchema = z.enum([
    "balcony",
    "beach_access",
    "concierge",
    "gym",
    "kids_play",
    "maid_room",
    "parking",
    "pool",
]);

export const ListingSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    image: z.string().startsWith("/listings/"),
    area: AreaSchema,
    type: PropertyTypeSchema,
    listingType: ListingTypeSchema,
    bedrooms: z.number().int().min(0).max(5),
    bathrooms: z.number().int().min(1).max(6),
    priceAed: z.number().int().positive(),
    furnished: FurnishedSchema,
    amenities: z.array(AmenitySchema).min(1),
});

export const FiltersSchema = z.object({
    area: AreaSchema.optional(),
    type: PropertyTypeSchema.optional(),
    listingType: ListingTypeSchema.optional(),
    bedrooms: z.number().int().min(0).max(5).optional(),
    minPriceAed: z.number().int().nonnegative().optional(),
    maxPriceAed: z.number().int().nonnegative().optional(),
    furnished: FurnishedSchema.optional(),
    amenities: z.array(AmenitySchema).optional(),
});

export const ListingsSchema = z.array(ListingSchema);

export type Area = z.infer<typeof AreaSchema>;
export type PropertyType = z.infer<typeof PropertyTypeSchema>;
export type ListingType = z.infer<typeof ListingTypeSchema>;
export type Furnished = z.infer<typeof FurnishedSchema>;
export type Amenity = z.infer<typeof AmenitySchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type Filters = z.infer<typeof FiltersSchema>;
