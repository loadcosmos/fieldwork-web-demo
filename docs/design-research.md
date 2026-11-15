# Benefits Unlocker: visual research

Studied November 15, 2026. These are design references, not evidence that a layout converts better. The direction adapts patterns to a US employee reviewing sensitive benefits information; it does not copy brand assets or imply third-party endorsement.

## References

| Reference | Pattern worth taking |
| --- | --- |
| [Mercury](https://mercury.com/) | Restrained hero typography and a product preview that feels like the actual tool. Use a composed result preview instead of decorative finance imagery. |
| [Ramp](https://ramp.com/) | One short headline and an immediately visible next step. Keep the first action obvious, without competing navigation. |
| [Wealthsimple](https://www.wealthsimple.com/en-ca) | Warm, editorial consumer-finance tone. Use generous spacing and quiet surfaces rather than a hard corporate-blue dashboard. |
| [Copilot Money](https://www.copilot.money/) | Lead with a useful number in a realistic product view; put trust and privacy cues near the request for financial data. |
| [Origin](https://useorigin.com/) | Specific action cards paired with dollar values. Make the result scan as amount → reason → deadline → action. |
| [Stripe](https://stripe.com/) | Exacting number typography and clear visual hierarchy for complex money information. Use tabular figures and controlled contrast. |
| [Linear](https://linear.app/) | Precise type scale, alignment, and restrained detail. Let layout and typography supply polish instead of ornament. |
| [Mobbin onboarding study](https://mobbin.com/blog/the-long-onboarding-a-study-of-1-460-flows) | A flow should establish its tone in the first screens and make progress legible. Keep the existing three-step path visible and calm. |
| [Behance: Wirely](https://www.behance.net/gallery/229291501/Wirely-FinTech-SaaS-Platform-Product-UIUX-Design) | Dense financial information benefits from a firm card hierarchy. Apply that principle to plan terms and actions; avoid its extra dashboard density. |
| [Dribbble: Nova digital banking](https://dribbble.com/shots/27881279-Website-Design-Nova-Digital-Banking) | A hero should offer one clear next step and show familiar money tasks. Keep the sample action primary, then explain personal upload. |
| [Land-book finance gallery](https://land-book.com/design/website/finance) | Curated finance examples often use a single strong hero with a concrete product surface. Apply that structure to the PDF-to-plan story. |
| [Lapa Ninja finance gallery](https://www.lapa.ninja/category/finance/) | Repeated landing-page anatomy: headline, useful preview, trust cues, clear call to action. Place privacy proof next to the upload choice. |

I also attempted [Awwwards fintech](https://www.awwwards.com/websites/fintech/) and [Godly](https://godly.website/). The first timed out; the second redirected to an inaccessible page. No specific pattern is attributed to either. Behance and Land-book search previews were readable, while their detail pages blocked direct fetching; those observations are correspondingly limited.

## Previous direction (redesign-v2)

1. Treat the site as a calm personal-finance workspace, with warm ivory and dark ink.
2. Reserve deep green for the primary action and positive progress.
3. Give the hero one large example dollar amount, clearly labeled as an example.
4. Make the user's actual result the largest element in the action plan.
5. Use tabular numerals so amounts and deadlines remain easy to compare.
6. Show the three-step path early, with the active step easy to locate.
7. Put the PDF privacy promise beside upload, without invented badges or certifications.
8. Use light borders, generous spacing, and low shadows to separate information.
9. Make deadline status readable in words and color, with accessible contrast.
10. Use short entrance motion and a restrained number count-up, removed for reduced-motion users.

## Patterns taken

| # | Reference pattern | Implementation |
| --- | --- | --- |
| 1 | Origin: oversized serif headline, italic emphasis, atmospheric hero, outcome device | `Landing` uses the serif hero, sky gradient, and Northwind sample outcome screen. |
| 2 | Copilot: overlapping floating cards and progress ring | `Landing` places the FSA, 401(k), and learning cards around the sample device with a deadline ring. The sample is labeled, and flow-only phrases stay out of the preview. |
| 3 | Copilot: short trust pills below the headline | `Landing` lists in-memory PDF reading, 2026 IRS limits, and no sign-up. |
| 4 | Ramp: thin strip of sourced figures | `Landing` shows the four supplied EBRI, Devenir, Hartford, and Voya facts with source labels. |
| 5 | Stripe/Ramp: unequal bento cards with product detail | `Landing` has upload, verification, and action cards, each with a mini interface. The sample PDF actually says “first 6%”; the requested “first 4%” wording would misquote it. |
| 6 | Ramp: dark full-width section | `Landing` includes the three-promise privacy band. |
| 7 | Focused product entry | `BenefitsFlow` has a large `#start` upload section with the sample as a secondary choice. |
| 8 | Receipt or statement review | `BenefitsFlow` groups found terms into two columns with editable values and source quotes, then separates missing terms. |
| 9 | Origin outcome plus dashboard | `BenefitsFlow` shows the large result number, deadline timeline, category bars, action column, and sticky summary with Plus/calendar controls. |
| 10 | Origin editorial type plus finance numerals | Instrument Serif is loaded for display text and big numbers; Instrument Sans remains the interface face, with tabular money figures. |
| 11 | Gentle staged motion | IntersectionObserver reveals sections, floating cards bob, the result count rises, and reduced-motion disables movement. |
