# AI Recommendations and Schedule Assistant

## 1. Goals

The AI layer should help a user discover acts and make tradeoffs. It should not be necessary for schedule browsing, plan storage, conflict detection, exports, or offline use.

The assistant must be grounded in the application’s validated dataset and must not invent schedule facts.

## 2. Two recommendation engines

### Deterministic offline engine

Always available. Score unselected artists using normalized metadata.

Example score:

```text
0.35 genre/tag Jaccard similarity
0.20 mood similarity
0.15 instrumentation/performance-character similarity
0.10 energy fit
0.10 schedule availability / conflict penalty
0.05 discovery preference
0.05 preferred-stage proximity
```

For multiple liked acts, use the maximum similarity plus a smaller average-similarity contribution. Penalize direct conflicts with Must See selections unless the user asks for alternatives.

This engine should produce a reason from matched tags:

> Recommended because you selected Artist A and Artist B: harmony-led, roots-rock, upbeat, and collaborative.

### OpenRouter AI engine

Available online. It receives the selected act metadata, candidate acts, current conflicts, and explicit preferences. It can make nuanced connections and explain tradeoffs, but it returns only IDs from the candidate set.

## 3. Request design

Client request:

```ts
type AssistantRequest = {
  mode: 'recommend' | 'chat' | 'build-plan' | 'resolve-conflicts';
  query?: string;
  selected: Array<{ setId: string; priority: 'must' | 'interested' }>;
  preferences: {
    discovery?: boolean;
    energy?: string[];
    genres?: string[];
    avoidConflicts?: boolean;
    preferredStageId?: string;
    availableWindow?: { start: string; end: string };
  };
  scheduleVersion: string;
};
```

Do not send the entire static dataset from the browser. The server loads the canonical dataset and resolves IDs.

## 4. Context construction

The server builds a compact context containing:

- selected acts with tags and schedule details;
- unselected candidate acts with tags and schedule details;
- conflict summary;
- stage transition matrix;
- verified relevant policies for policy questions;
- schedule version and “times subject to change” statement.

For a general chat question, retrieve only relevant records by keyword and structured filtering. The dataset is small enough for launch that a full concise context may still fit, but avoid unnecessary tokens.

## 5. Structured recommendation response

Use OpenRouter structured outputs with strict JSON Schema.

```ts
const RecommendationResponseSchema = z.object({
  summary: z.string().max(500),
  recommendations: z.array(z.object({
    artistId: z.string(),
    setId: z.string(),
    score: z.number().min(0).max(100),
    reason: z.string().max(260),
    tradeoff: z.string().max(200).optional(),
    conflictType: z.enum(['none', 'transition', 'overlap'])
  })).max(5),
  warnings: z.array(z.string().max(240)).max(5)
});
```

After model response:

1. parse JSON;
2. validate schema;
3. remove any unknown artist/set ID;
4. recalculate conflict status locally/server-side;
5. cap and sort results;
6. return normalized response.

Never trust model-provided times or conflicts without checking against code.

## 6. Prompt contract

System prompt principles:

```text
You are the planning assistant for an unofficial Newport Folk schedule planner.
Use only the supplied festival dataset.
Never invent an artist, set, time, stage, policy, or schedule change.
Recommend only candidate IDs supplied in the context.
Treat Must See selections as hard constraints unless the user asks to reconsider them.
Explain musical fit using supplied tags and descriptions, not unsupported biography.
Flag overlaps and short stage transitions.
If the context does not answer a factual question, say the information is not verified and link the user to the official source through the application.
Return exactly the required JSON schema for structured modes.
```

## 7. Chat response design

For conversational questions, stream text for responsiveness, but support structured UI actions separately.

A chat response can contain:

- concise answer;
- cited in-app records such as artist or policy IDs;
- optional action objects:
  - select act;
  - remove act;
  - open artist;
  - open stage;
  - apply proposed plan.

Do not let raw model text directly mutate the user plan. The user must tap an explicit action.

## 8. Plan-building algorithm

For “build my day”:

1. lock Must See sets;
2. identify open intervals;
3. generate candidate combinations using code;
4. score combinations for preferences, conflict avoidance, and transition burden;
5. pass top combinations to AI for explanation/ranking;
6. return a proposal;
7. user explicitly applies it.

This hybrid approach prevents the model from overlooking schedule constraints.

## 9. Conflict-resolution algorithm

For each conflict cluster:

- preserve higher priority;
- compare deterministic preference score;
- propose non-conflicting alternatives in the same or adjacent time window;
- explain exact minutes missed when partial-set attendance is an option;
- never imply that moving between stages is instantaneous.

## 10. OpenRouter implementation sketch

```ts
import { OpenRouter } from '@openrouter/sdk';

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!
});

const response = await client.chat.send({
  model: process.env.OPENROUTER_MODEL!,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(context) }
  ],
  responseFormat: {
    type: 'json_schema',
    jsonSchema: recommendationJsonSchema
  },
  temperature: 0.2,
  maxTokens: 1200
});
```

Confirm the exact SDK method and property casing against the installed SDK version. Direct server-side `fetch` to `/api/v1/chat/completions` is a reliable fallback.

Set optional attribution headers when using direct HTTP:

- `HTTP-Referer`
- `X-OpenRouter-Title`

## 11. Model routing

Make the model an environment variable. Choose a model with:

- reliable structured output;
- adequate reasoning for constrained scheduling;
- low latency;
- acceptable cost;
- sufficient context window.

Set provider routing to permit fallbacks for availability. Consider `data_collection: "deny"` or ZDR routing when operationally appropriate. Confirm provider availability and pricing immediately before launch.

## 12. Rate limiting and budget

Recommended launch controls:

- recommendations: 10 requests per session/day;
- chat: 20 messages per session/day;
- 1 request at a time per session;
- input query max 800 characters;
- maximum candidate/context count;
- completion-token cap;
- OpenRouter account budget cap;
- 429 response with deterministic fallback.

Use an opaque client session ID stored locally. Combine with IP-based limits where possible, acknowledging shared festival networks may place many users behind one IP.

## 13. Privacy and logging

Send only:

- public artist/set IDs;
- anonymous preferences;
- the user’s text question;
- schedule context.

Do not send email, name, location history, contacts, or calendar contents.

Logs should retain:

- request ID;
- route/mode;
- model;
- latency;
- token usage;
- response status;
- schedule version.

Avoid storing full prompts unless debugging is explicitly enabled for a short period.

## 14. Offline behavior

When offline:

- use deterministic recommendations;
- show cached last AI result with its timestamp;
- disable send button with a useful explanation;
- keep suggestion chips that can be answered deterministically, such as conflict checks and gap filling.

## 15. Evaluation checklist

Create a test set of at least 20 scenarios:

- two similar selected artists;
- intentionally eclectic picks;
- no selected acts;
- one selected act;
- multiple direct conflicts;
- preferred stage constraint;
- narrow time window;
- “something different” request;
- policy question not answered in data;
- malicious prompt asking to ignore constraints;
- typo in artist name;
- request for an act not in the schedule.

Score:

- all IDs valid;
- no invented schedule facts;
- conflict correctness;
- musical relevance;
- explanation quality;
- latency;
- cost.

