# Benefits Unlocker

Benefits Unlocker helps US employees aged 25–45 spot unused value and approaching deadlines in a benefits summary. Upload a PDF, check the extracted plan terms against source quotes, add your own balances, and get a prioritized action list.

## How it works

`POST /api/parse` reads a PDF in memory and extracts selectable text with `unpdf`. The rule-based parser in `src/lib/benefits/extract.ts` identifies plan terms and returns short evidence quotes. The deterministic calculator in `src/lib/benefits/plan.ts` turns those terms and user inputs into dated actions. Missing terms stay unknown and can be entered by hand.

The calculation uses these formulas:

- Remaining employer 401(k) match = salary × (match cap % − current contribution %) × match rate × days remaining in year / days in year.
- FSA at risk = max(0, FSA balance − permitted carryover).
- Each unused stipend = max(0, annual stipend − amount already used).
- Possible HSA investment growth = max(0, HSA cash − cash reserve) × an illustrative 7% for one year. Returns are not guaranteed.
- Possible after-tax 401(k) room = $72,000 total 2026 limit − $24,500 employee deferral limit − estimated employer match, when the plan allows after-tax contributions and Roth conversion. This is contribution room, not cash.

The first three categories sum to “you'll lose by doing nothing”; HSA growth and after-tax room sum to the separate opportunity figure. Amounts are estimates, subject to eligibility and individual circumstances. The app is not tax, legal, or financial advice.

## Privacy and demo scope

The PDF is sent to the server only for in-memory extraction; it is never stored. Terms, personal numbers, completed actions, and Plus demo status stay in this browser's local storage. There is no account or bank connection. The sample PDF runs through the same API as an uploaded PDF. Plus is a demo unlock with no card or charge; it enables a real `.ics` calendar download with one event and a three-day reminder per action. Re-checks after open enrollment and in new plan years describe the proposed Plus product; they are not automated in this demo.

## Run locally

Requires Node.js 22 and npm. No environment variables are required.

```sh
npm ci
npm run dev
npm run check
npm run build
npm test
npm run test:e2e
```

The Playwright test uses a local development server. Set `E2E_BASE_URL` to run it against an existing URL.
