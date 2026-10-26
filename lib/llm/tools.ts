import { Type, type FunctionDeclaration, type Schema, type Tool } from "@google/genai";
import {
    AmenitySchema,
    AreaSchema,
    FurnishedSchema,
    ListingTypeSchema,
    PropertyTypeSchema,
} from "../schema";

export const SEARCH_LISTINGS = "search_listings";
export const ASK_CLARIFICATION = "ask_clarification";

function stringEnum(values: readonly string[], description: string): Schema {
    return {
        type: Type.STRING,
        format: "enum",
        enum: [...values],
        description,
    };
}

const searchListings: FunctionDeclaration = {
    name: SEARCH_LISTINGS,
    description:
        "Search property listings. Use this when the sentence has at least one concrete filter, such as an area, a number of bedrooms, or a budget. Omit any field the user did not mention. Never invent a value.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            area: stringEnum(
                AreaSchema.options,
                "Dubai area. Map nicknames such as Marina to Dubai Marina and JVC to Jumeirah Village Circle.",
            ),
            type: stringEnum(PropertyTypeSchema.options, "Property type."),
            listingType: stringEnum(
                ListingTypeSchema.options,
                "rent or sale. Assume rent when the user does not say they want to buy.",
            ),
            bedrooms: {
                type: Type.INTEGER,
                minimum: 0,
                maximum: 5,
                description: "Number of bedrooms. Use 0 for a studio.",
            },
            minPriceAed: {
                type: Type.INTEGER,
                minimum: 0,
                description:
                    "Lowest price in AED. Rent is annual. 120k means 120000. 1.2m means 1200000. Multiply a monthly rent by 12.",
            },
            maxPriceAed: {
                type: Type.INTEGER,
                minimum: 0,
                description:
                    "Highest price in AED, included. Rent is annual. 120k means 120000. 1.2m means 1200000. Multiply a monthly rent by 12.",
            },
            furnished: stringEnum(FurnishedSchema.options, "Furnishing."),
            amenities: {
                type: Type.ARRAY,
                items: stringEnum(AmenitySchema.options, "One amenity the listing must have."),
                description: "Amenities the listing must include. Omit amenities the user did not mention.",
            },
        },
    },
};

const askClarification: FunctionDeclaration = {
    name: ASK_CLARIFICATION,
    description:
        "Ask one short question when the query is too vague to search, such as only 'cheap' or 'nice', and it gives no area, bedrooms, or budget.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: "The question to show the user.",
            },
        },
        required: ["question"],
    },
};

export const listingTools: Tool[] = [
    {
        functionDeclarations: [searchListings, askClarification],
    },
];
