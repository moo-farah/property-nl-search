# Failures Log

## Evaluation setup

- Development dataset: 30 cases
- Model: `gemini-3.5-flash-lite`
- Temperature: `0`
- Function-calling mode: `ANY`
- Prompt versions tested: V1, V2, and V3
- Expected fields only are compared
- Amenity order is ignored
- Clarification question wording is not compared
- V1 run: 2026-10-28 15:21 UTC
- V2 run: 2026-10-28 16:38 UTC
- V3 run: 2026-10-28 16:55 UTC

## Initial results

### V1 baseline

- Exact matches: 21/30
- Exact-match rate: 70.00%
- Field accuracy: 91.18%
- Clarification accuracy: 100%
- Schema-validity rate: 100%
- Average latency: 19,472 ms
- Median latency: 19,015 ms
- P95 latency: 38,920 ms

### V2

- Exact matches: 19/30
- Exact-match rate: 63.33%
- Field accuracy: 89.22%
- Clarification accuracy: 100%
- Schema-validity rate: 100%
- Average latency: 12,394 ms
- Median latency: 8,902 ms
- P95 latency: 24,204 ms

### V3

- Exact matches: 20/30
- Exact-match rate: 66.67%
- Field accuracy: 90.20%
- Clarification accuracy: 100%
- Schema-validity rate: 100%
- Average latency: 30,134 ms
- Median latency: 16,333 ms
- P95 latency: 29,163 ms

V3 contained one extreme latency outlier: `vague-04` took 420,184 ms.
Therefore, median latency is more representative than average latency for V3.

## Initial conclusion

V1 produced the highest exact-match and field-accuracy scores. V2 was the
fastest by median latency, but its accuracy was lower. V3 recovered one exact
match compared with V2 but did not outperform V1.

All prompt versions achieved 100% clarification accuracy and 100% schema
validity. The primary problem is therefore filter accuracy rather than output
validity or clarification behavior.

## Cycle 1: Missing default listing type

### Failure

The most common failure was a missing `listingType: "rent"` when the query did
not explicitly contain the word "rent".

V1 failures caused by this pattern:

- `uae-01`
- `uae-02`
- `tricky-01`
- `tricky-02`
- `simple-06`
- `uae-03`
- `uae-05`
- `messy-05`
- `tricky-03`

V2 failures caused by this pattern:

- `uae-01`
- `uae-02`
- `tricky-01`
- `tricky-02`
- `simple-06`
- `uae-03`
- `uae-04`
- `uae-05`
- `tricky-03`

V3 failures caused by this pattern:

- `uae-01`
- `uae-02`
- `tricky-02`
- `simple-06`
- `units-04`
- `uae-03`
- `uae-05`
- `messy-05`
- `tricky-03`

### Evidence

The current instructions contain two competing rules:

1. Omit fields the user did not mention.
2. Assume rent unless the user wants to buy.

The model frequently follows the omission rule and leaves out `listingType`.
However, the evaluation contract expects `listingType` to default to `rent`.

### Hypothesis

The phrase "omit any field the user did not mention" is more general and
conflicts with the default-rent instruction.

### Proposed change

Keep V1 unchanged as the baseline. Update V2 so the rule is explicit:

> Omit fields the user did not mention, except listingType. Always include
> listingType. Use sale when the user indicates buying or sale. Otherwise use
> rent.

### Expected result

Cases that failed only because `listingType` was absent should pass. V2 should
improve beyond the V1 exact-match rate of 70%.

### Result after change

- Run: `2026-10-29T11:35:53.434Z`
- Exact matches: 28/30
- Exact-match rate: 93.33%
- Field accuracy: 98.04%
- Clarification accuracy: 100%
- Schema-validity rate: 100%
- Average latency: 1,675 ms
- Median latency: 1,176 ms
- P95 latency: 3,547 ms

The exact-match rate improved by 30 percentage points, from 63.33% to
93.33%. Field accuracy improved from 89.22% to 98.04%.

Most cases that previously omitted the default rent value passed after the
change. No broad regression was observed, so the prompt change was accepted.

The original V2 result is preserved at
`evals/results/history/v2-before-default-rent.json`.

### Remaining failures

#### `uae-05`

Query:

> Palm apartment with beach access and concierge

Expected `listingType: "rent"`, but the model still omitted `listingType`.
The remaining default-rent failure is isolated rather than systematic.

#### `messy-05`

Query:

> need studio... downtown... budget monthly 9k

Expected `area: "Downtown Dubai"`, but the model omitted the area. It correctly
returned the apartment type, rent listing type, studio bedroom value, and
annualized budget.

## Observations from the rerun

Two failures from the initial V2 run did not reproduce:

- `units-03` correctly mapped Palm to Palm Jumeirah.
- `messy-04` no longer invented the parking amenity.

No prompt rule specifically targeting those failures was changed. This
demonstrates that temperature `0` reduces variation but does not guarantee
identical responses from the hosted model.

## Cycle 2: V3 few-shot comparison

### Question

V3 extends the improved V2 prompt with five examples. This experiment tested
whether those few-shot examples improved accuracy over V2 on the same 30
development cases.

### Result

- Run: `2026-10-29T11:47:17.381Z`
- Exact matches: 27/30
- Exact-match rate: 90.00%
- Field accuracy: 97.06%
- Clarification accuracy: 100%
- Schema-validity rate: 100%
- Average latency: 3,586 ms
- Median latency: 1,491 ms
- P95 latency: 10,562 ms

### Comparison with improved V2

- V2 exact-match rate: 93.33%
- V3 exact-match rate: 90.00%
- V2 field accuracy: 98.04%
- V3 field accuracy: 97.06%
- V2 median latency: 1,176 ms
- V3 median latency: 1,491 ms
- V2 P95 latency: 3,547 ms
- V3 P95 latency: 10,562 ms

V3 produced one fewer exact match, lower field accuracy, and higher median and
P95 latency than V2.

### V3 failures

#### `units-03`

Expected `area: "Palm Jumeirah"`, but the model omitted the area.

#### `uae-02`

Expected `listingType: "rent"`, but the model omitted the listing type.

#### `tricky-01`

Expected `listingType: "rent"`, but the model omitted the listing type.

### Conclusion

The few-shot examples did not improve performance on the development set. V2
remains the selected prompt because it is more accurate, simpler, and faster.
Adding more V3 examples solely to improve the development score would risk
overfitting.

## Final holdout evaluation

V2 was evaluated once against 10 unseen cases in `evals/holdout.json`. The
prompt, tool definitions, comparison logic, and model were not changed after
this run. Holdout failures must not be used to tune V2.

### Result

- Run: `2026-10-29T12:18:00.156Z`
- Dataset: holdout
- Prompt: V2
- Model: `gemini-3.5-flash-lite`
- Exact matches: 7/10
- Exact-match rate: 70.00%
- Field accuracy: 86.11%
- Clarification accuracy: 100%
- Schema-validity rate: 100%
- Average latency: 4,020 ms
- Median latency: 4,489 ms
- P95 latency: 6,204 ms

Results are stored in `evals/results/holdout-v2.json`.

### Comparison with the development set

- Development V2 exact-match rate: 93.33% (28/30)
- Holdout V2 exact-match rate: 70.00% (7/10)
- Development V2 field accuracy: 98.04%
- Holdout V2 field accuracy: 86.11%

The drop is expected. The 30 development cases were used while improving the
default-rent instruction. The holdout queries were not used for prompt changes.

### Passed categories

- UAE-specific: 2/2
- Messy: 2/2
- Vague: 1/1

### Holdout failures

#### `holdout-simple-02`

Query:

> partly furnished apartment in Business Bay

The model returned `type`, `listingType: "rent"`, and
`furnished: "partly_furnished"`, but omitted `area: "Business Bay"`.

#### `holdout-units-02`

Query:

> Downtown rental, 10k a month

Monthly conversion was correct (`maxPriceAed: 120000`) and
`listingType: "rent"` was present. The model omitted
`area: "Downtown Dubai"`.

#### `holdout-tricky-01`

Query:

> 2 bedroom apartment in Abu Dhabi with a sauna

Expected a `search_listings` call with the supported filters (`type`,
`listingType`, `bedrooms`) and omission of unsupported values. The model asked
a clarification about searching in Dubai instead. That behavior is reasonable,
but it fails this case because the expected kind is `filters`.

### Conclusion

V2 remains the production prompt. The holdout run is a complete, schema-valid
measurement of generalization: 70% exact match on unseen queries, with
clarification still at 100%. The prompt will not be changed in response to
these three failures.