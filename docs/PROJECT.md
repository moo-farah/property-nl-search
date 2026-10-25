# property-nl-search: Project Spec

## Goal

A deployed Next.js + TypeScript app where a user types a sentence such as
"2 bed in Marina under 120k" and gets matching UAE property listings.
An LLM (Gemini, via tool calling) converts the sentence into validated
filters. Plain code does the searching. An evaluation harness measures how
accurate the conversion is across prompt versions.

Built as a portfolio project for a Software Engineering Trainee application.
The emphasis is the LLM pipeline and its evaluation, not UI polish.

## Tech stack

Next.js (App Router), TypeScript (strict), Tailwind, shadcn/ui, Zod,
Vitest, tsx, @google/genai (Gemini), ESLint, Prettier, GitHub Actions,
Vercel.

## Architecture

Browser -> POST /api/search -> parseQuery -> Gemini (tool call)
-> Zod validation -> one of:

- ask_clarification -> UI shows a question
- search_listings -> filterListings (pure code) -> results + filter chips

Three layers:

1. Contract: src/lib/schema.ts (Zod schemas Filters and Listing). Source of truth.
2. Interpretation: src/lib/llm/ (client, prompts, tools, parseQuery).
  Turns text into valid Filters or a clarifying question. Never touches listings.
3. Execution: src/lib/filterListings.ts. Pure function, no network, no randomness.



## Folder structure

src/app/page.tsx, layout.tsx, api/search/route.ts
src/components/ SearchBar, FilterChips, ListingCard, ClarifyPrompt, EmptyState
src/lib/ schema.ts, listings.ts, filterListings.ts (+ .test.ts), rateLimit.ts
src/lib/llm/ client.ts, prompts.ts, tools.ts, parseQuery.ts
data/listings.json (about 150 synthetic UAE listings, hardcoded)
evals/ cases.json, run.ts, compare.ts (+ .test.ts), results/
scripts/generateListings.ts
docs/ PROJECT.md, failures.md

## Data

Synthetic and hand-reviewed listings in data/listings.json. Frozen once
created so eval results stay comparable. Rent is annual AED.
8 areas: Dubai Marina, Downtown Dubai, Business Bay, Jumeirah Village Circle,
Jumeirah Lakes Towers, Palm Jumeirah, Dubai Hills Estate, Al Barsha.
Bedrooms: 0 means studio. See src/lib/schema.ts for exact fields.

## LLM design

- Library: @google/genai. Model name from env var GEMINI_MODEL (never hardcode).
- Key from GEMINI_API_KEY, server-side only (never NEXT_PUBLIC_).
- temperature 0. Function calling forced (mode ANY).
- Two tools:
  - search_listings: area, type, listingType, bedrooms, minPriceAed,
  maxPriceAed, furnished, amenities. All optional.
  - ask_clarification: question (required). Used when the query is too vague
  (for example only "cheap" or "nice", or no area, budget or bedrooms).
- Every tool call is validated with FiltersSchema. Failed validation is a
counted failure, never passed on.
- 10 second timeout, one retry on 429 or 5xx, friendly error message.
- Prompt versions in src/lib/llm/prompts.ts: PROMPT_V1 (minimal),
PROMPT_V2 (explicit rules: k/m units, studio = 0, monthly -> yearly,
area nicknames, never invent values, when to ask), PROMPT_V3 (v2 + few-shot).



## API route (/api/search)

POST { query }. Cap query at 200 characters. Simple per-IP rate limit.
Responses: { clarify: string } | { filters, results } | { error } (422 or 429).

## UI

shadcn/ui components. One centered column: search bar, filter chips showing
what the model understood, responsive grid of listing cards. Loading
skeletons, empty state, clarify prompt, error alert. Keep UI simple.

## Evaluation

- evals/cases.json: 30 cases { id, category, query, expect }.
expect is { kind: "filters", filters: {...} } or { kind: "clarify" }.
Only listed fields are compared.
- Categories: simple (6), shorthand and units (6), UAE-specific fields (5),
messy (5), vague (4), unsupported or tricky (4).
- Metrics: exact match rate, field-level accuracy, clarify accuracy,
schema validity rate, average latency.
- evals/run.ts calls the same parseQuery the app uses, one case at a time
with a delay and retry on 429. Saves evals/results/vN.json with scores,
per-category scores and failed cases (expected vs actual).
- A held-out set of 10 extra queries is run only at the end.
- docs/failures.md records each cycle: failure, hypothesis, change, new score.



## Rules

- The LLM only produces validated Filters. It never picks or invents listings.
- filterListings stays pure.
- No `any` in core files. TypeScript strict.
- No new libraries, database or features without asking first.
- Small changes, explain what changed and why.
- Update this file when a decision changes.



## Scope

Must have: search, tool calling, validation, filtering, cards, chips,
clarify path, eval harness with 2+ prompt versions, README, deployment.
Nice to have: v3 few-shot prompt, search logging with one chart,
retry-on-zero-results loop.
Out of scope: database, auth, maps, images, real listings, pagination.

## Status

- [ ] Day 1: scaffold, tooling, schema.ts
- [ ] Day 2: listings.json, filterListings + tests
- [ ] Day 3: Gemini integration (parseQuery)
- [ ] Day 4: API route and UI
- [ ] Day 5: eval harness, v1 baseline
- [ ] Day 6: improve prompts, failures.md, v2 (and v3)
- [ ] Day 7: CI, deploy, README
- [ ] Day 8: polish