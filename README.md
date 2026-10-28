# Property NL Search

A natural-language property search experience for UAE real estate. Users can write queries such as:

> 2 bedroom apartment for rent in Dubai Marina under 120k

Gemini translates each query into structured, validated filters through function calling. Deterministic TypeScript code then applies those filters to a frozen synthetic dataset. The LLM interprets the request—it never selects or invents properties.

## Features

- Natural-language search for UAE property listings
- Gemini function calling with forced tool use
- Runtime validation with Zod
- Deterministic filtering over 100 synthetic listings
- Filters for area, property type, rent/sale, bedrooms, price, furnishing, and amenities
- UAE-specific language such as `Marina`, `JVC`, `120k`, and monthly rent
- Clarifying questions for underspecified searches
- Filter chips showing how a query was interpreted
- Responsive cards, client-side sorting, and browser-persisted favorites
- Loading, empty, validation, rate-limit, and upstream error states
- Versioned prompts for evaluation and iteration
- CI checks for linting, types, and production builds



## How It Works

```text
Browser
  |
  | POST /api/search { query }
  v
API validation and rate limiting
  |
  v
Gemini tool call
  |
  +-- ask_clarification --> clarification shown in the UI
  |
  +-- search_listings --> Zod validation --> filterListings()
                                                |
                                                v
                                      matching listings returned
```

The system has three layers:

1. **Contract:** `lib/schema.ts` defines the accepted filters and listing shape.
2. **Interpretation:** `lib/llm/` turns text into a validated tool call.
3. **Execution:** `lib/FilterListings.ts` applies filters without network access or randomness.



## Search Contract

Gemini must call one of two tools.

### `search_listings`

All filters are optional:

- `area`
- `type`
- `listingType`
- `bedrooms`
- `minPriceAed`
- `maxPriceAed`
- `furnished`
- `amenities`

Every returned argument is validated against `FiltersSchema` before reaching the filtering layer.

### `ask_clarification`

Used when a query is too vague to produce useful filters, such as:

```text
Show me something cheap and nice
```

The API returns the generated question to the UI instead of running a search.

## Supported Data

The frozen dataset contains 100 synthetic listings across:

- Dubai Marina
- Downtown Dubai
- Business Bay
- Jumeirah Village Circle
- Jumeirah Lakes Towers
- Palm Jumeirah
- Dubai Hills Estate
- Al Barsha

Rent prices are annual AED amounts. A bedroom value of `0` represents a studio. Supported property types, furnishing values, and amenities are defined in `lib/schema.ts`.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript with strict mode
- Tailwind CSS 4
- shadcn/ui and Base UI
- Zod
- Google Gen AI SDK (`@google/genai`)
- ESLint
- GitHub Actions



## Getting Started



### Prerequisites

- Node.js 20 or later
- npm
- A Google Gemini API key



### Installation

```bash
git clone <repository-url>
cd property-nl-search
npm install
```

Create `.env.local` in the project root:

```dotenv
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=your_model_name
```

Both variables are server-only. Do not prefix the key with `NEXT_PUBLIC_` or commit `.env.local`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts


| Command         | Purpose                                          |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Start the development server                     |
| `npm run build` | Create a production build                        |
| `npm run start` | Run the production server                        |
| `npm run lint`  | Run ESLint                                       |
| `npm run eval`  | Run the evaluation entry point with `.env.local` |


The evaluation runner is currently under development. Its script exists, but the evaluation artifacts have not yet been populated.

## API



### `POST /api/search`

Request:

```json
{
  "query": "furnished studio in JVC under 70k"
}
```

Successful response:

```json
{
  "filters": {
    "area": "Jumeirah Village Circle",
    "listingType": "rent",
    "bedrooms": 0,
    "maxPriceAed": 70000,
    "furnished": true
  },
  "results": []
}
```

Clarification response:

```json
{
  "clarify": "Which area, budget, or number of bedrooms do you prefer?"
}
```

Error response:

```json
{
  "error": "Could not understand that search."
}
```

Queries are limited to 200 characters. The API applies an in-memory limit of 10 requests per IP per minute and returns `422`, `429`, or `503` responses for invalid input, rate limits, and upstream failures.

## Prompt Versions

Prompt definitions live in `lib/llm/prompts.ts`:

- **V1:** minimal instructions
- **V2:** explicit conversion and clarification rules
- **V3:** V2 plus few-shot examples

The production API currently uses `PROMPT_V2`. Gemini runs at temperature `0` with function-calling mode set to `ANY`. Tool output remains untrusted until it passes Zod validation.

## Evaluation

The planned evaluation suite measures:

- Exact-match rate
- Field-level accuracy
- Clarification accuracy
- Schema-validity rate
- Average latency
- Per-category performance

Cases cover simple searches, shorthand and units, UAE-specific language, messy input, vague requests, and unsupported or tricky queries. Prompt results belong in `evals/results/`; observations from prompt iterations belong in `docs/failures.md`.

The evaluation files are scaffolded but currently incomplete. Until the runner and datasets are populated, `npm run eval` should not be treated as a working quality gate.

## Project Structure

```text
app/
  api/search/route.ts       Search API
  components/               Search and result components
  page.tsx                  Main search experience
components/ui/              Reusable UI primitives
data/listing.json           Frozen synthetic listing dataset
docs/
  PROJECT.md                Product and architecture specification
  failures.md               Prompt-iteration failure log
evals/
  cases.json                Main evaluation cases
  holdout.json              Final held-out cases
  run.ts                    Evaluation entry point
  compare.ts                Evaluation comparison utilities
  results/                  Versioned evaluation output
lib/
  llm/                      Gemini client, tools, prompts, and parser
  FilterListings.ts         Pure listing filter
  favorites.ts              Browser favorites persistence
  rateLimit.ts              API rate limiter
  schema.ts                 Zod contracts and TypeScript types
public/                     Background and listing images
```



## Reliability and Safety

- Request bodies are validated and query length is capped.
- Gemini credentials remain server-side.
- Tool arguments are validated before use.
- Listing retrieval is deterministic and performed outside the LLM.
- Gemini requests use a timeout and retry transient `429` and `5xx` failures.
- User-visible errors avoid exposing implementation details.
- CI runs ESLint, Next.js type generation, TypeScript checks, and a production build.

The current rate limiter uses process memory. A shared store would be required for consistent enforcement across multiple serverless instances.

## Deployment

The app can be deployed to Vercel or another platform supporting Next.js.

For Vercel:

1. Import the repository.
2. Add `GEMINI_API_KEY` and `GEMINI_MODEL` as environment variables.
3. Deploy with the standard Next.js build settings.
4. Verify successful searches, clarification responses, and error handling.

No Gemini request runs during the build; credentials are required when the search API executes.

## Current Limitations

- Listings are synthetic and loaded from static JSON.
- There is no database, authentication, map, pagination, or live property feed.
- Favorites are local to one browser.
- Rate limiting is not shared across application instances.
- Search depends on Gemini availability and API quota.
- Automated tests and the complete evaluation harness are pending.



## Roadmap

- Complete the 30-case evaluation suite and held-out set
- Implement scoring and version comparison
- Record V1, V2, and V3 results
- Add tests for filtering and evaluation metrics
- Publish a live deployment
- Consider search logging and a zero-result retry strategy



## Design Decisions

- **LLM for interpretation, code for retrieval:** results remain inspectable, and the model cannot hallucinate listings.
- **Zod as the contract:** API, tool definitions, and filtering stay aligned.
- **Frozen data:** prompt evaluations remain comparable across runs.
- **Versioned prompts:** prompt changes become measurable engineering work.
- **Focused scope:** reliability and evaluation take priority over unrelated product infrastructure.

For the complete product specification and implementation checklist, see `[docs/PROJECT.md](docs/PROJECT.md)`.