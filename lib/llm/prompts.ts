import { AreaSchema } from "../schema";

const areas = AreaSchema.options.join(", ");

export const PROMPT_V1 = `Turn the user's property search into one tool call.
Use search_listings when the sentence contains a usable filter.
Use ask_clarification when the sentence is too vague to search.`;

export const PROMPT_V2 = `Turn the user's property search into one tool call.

Call search_listings when the sentence has at least one concrete filter: an area, a number of bedrooms, or a budget.
Call ask_clarification only when there is nothing concrete to filter on, such as "cheap" or "nice".
Omit fields the user did not mention, except listingType. Never invent a value.

Rules:
- Areas are only: ${areas}.
- Nicknames: Marina is Dubai Marina, Downtown is Downtown Dubai, JVC is Jumeirah Village Circle, JLT is Jumeirah Lakes Towers, Palm is Palm Jumeirah, Dubai Hills is Dubai Hills Estate, Barsha is Al Barsha.
- A studio is bedrooms 0.
- Rent is annual AED. 120k means 120000. 1.2m means 1200000.
- "under" or "up to" sets maxPriceAed and includes that amount. "over" or "from" sets minPriceAed.
- A monthly amount is multiplied by 12.
- Always include listingType. Use sale when the user indicates buying or sale. Otherwise use rent.
- Only set type, furnished, or amenities when the user names them.`;

export const PROMPT_V3 = `${PROMPT_V2}

Examples:
- "2 bed in Marina under 120k" -> search_listings with area Dubai Marina, bedrooms 2, maxPriceAed 120000, listingType rent.
- "studio in JVC" -> search_listings with area Jumeirah Village Circle, bedrooms 0, listingType rent.
- "villa on the Palm for sale under 1.2m" -> search_listings with area Palm Jumeirah, type villa, listingType sale, maxPriceAed 1200000.
- "monthly 8k in Business Bay" -> search_listings with area Business Bay, maxPriceAed 96000, listingType rent.
- "cheap" -> ask_clarification asking which area, budget, or number of bedrooms they want.`;

export const PROMPT_V4 = `${PROMPT_V2}

Also:
- If the sentence names an area or nickname, always set area. Do not drop it because the sentence is messy.
- A studio sets bedrooms to 0. Do not set type unless the user says apartment, flat, villa, townhouse, or penthouse.
- If the user names a city or area that is not supported, call ask_clarification and say it is not covered. Do not search.
- Ignore an unsupported amenity, and still search when another concrete filter is present.
- listingType alone is not enough. If there is no area, bedrooms, budget, type, furnishing, or amenity, call ask_clarification.`;