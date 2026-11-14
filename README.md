# Fieldwork

Fieldwork is a neutral web demo built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui. Paste some text to get an AI-generated summary, three key points, and a next step. Results appear progressively and stay in the browser.

## Run locally

Requires Node.js 22 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. For live generation locally, set `AI_GATEWAY_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`. You can also pull the linked Vercel project’s development OIDC token. The interface and browser test work without model credentials.

```sh
npm run check
npx playwright install chromium --only-shell
npm run test:e2e
```

The Playwright test supplies deterministic streamed data at the HTTP boundary. Set `E2E_BASE_URL` to a configured public deployment to run the same flow against the live model instead.

## How it works

- `/`, `/start`, `/result`, and `/plus` cover the demo flow. A random browser ID and the last ten completed results stay in local storage. The original text goes to AI Gateway on submit.
- `POST /api/generate` validates input, reserves quota, and streams newline-delimited JSON. The server validates the completed result against the same schema the client uses before saving it. Incomplete generations show an error and are discarded.
- A private Vercel Blob store holds the UTC-day quota and event counters. Conditional writes protect quota across concurrent functions. The demo allows up to 10 generation attempts per browser ID and 80 attempts across the deployment per UTC day. In local development, counters fall back to process memory. Production generation requires shared storage.
- `/stats` shows today's aggregate visit, start, result, demo checkout, and return events. A visit is counted once per tab session, with a return when that browser was previously seen. Engagement counts come from the client and are capped at 400 events per UTC day.
- Vercel project OIDC authenticates Gateway calls in production. The team needs active Gateway credits and access to the model configured in `AI_MODEL`. To use Claude Haiku 5.5 through Anthropic directly, add `ANTHROPIC_API_KEY` as a sensitive server-side variable and redeploy. The same route, schema, and quota apply to both connections.
- Connect a private Blob store to the Vercel project before deploying. The Vercel project can be linked to GitHub for deployments on push, or deployed directly from this directory with `vercel deploy --prod` after signing in.

## Live and simulated

Live generation, browser history, quotas, and aggregate event counts are implemented. The Plus screen previews a possible plan. Its checkout only demonstrates the click and confirmation. It takes no payment details, moves no money, and unlocks no features. The home screen's example is an illustration.
