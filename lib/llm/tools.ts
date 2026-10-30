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
        "Search property listings when the sentence has a concrete filter: an area, bedrooms, a budget, a property type, furnishing, or an amenity. Always include listingType, using sale when the user is buying and rent otherwise. If the user names a supported area or nickname, always set area. A studio is bedrooms 0 and does not set type. Ignore an unsupported amenity and still search. Do not use this tool when the user names a city or area outside the supported list. Omit every other field the user did not mention.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            area: stringEnum(
                AreaSchema.options,
                "Dubai area. Required when the user names an area or nickname. Map Marina to Dubai Marina, Downtown to Downtown Dubai, JVC to Jumeirah Village Circle, JLT to Jumeirah Lakes Towers, Palm to Palm Jumeirah, Dubai Hills to Dubai Hills Estate, and Barsha to Al Barsha.",
            ),
            type: stringEnum(
                PropertyTypeSchema.options,
                "Property type. Set only when the user says apartment, flat, villa, townhouse, or penthouse. A studio does not mean apartment.",
            ),
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
        "Ask one short question when the query gives no area, bedrooms, budget, property type, furnishing, or amenity, such as only 'cheap' or 'nice'. Also ask when the user names a city or area that is not supported, and say which Dubai areas are covered. If a supported filter is present and the place is supported, search instead.",
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
