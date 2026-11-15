import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";
import { extractTerms } from "../src/lib/benefits/extract.ts";
import { buildPlan } from "../src/lib/benefits/plan.ts";
import type { Terms, UserInput } from "../src/lib/benefits/types";

const empty = (): Terms => extractTerms("").terms;
const user: UserInput = {
  salary: 95_000, contributionPct: 3, fsaBalance: 0, hsaCash: 0,
  hsaKeepCash: 0, coverage: "self", wellnessUsed: 0, learningUsed: 0, homeOfficeUsed: 0,
};
const today = "2026-11-15";
const plan = (terms: Partial<Terms> = {}, input: Partial<UserInput> = {}, date = today) =>
  buildPlan({ ...empty(), ...terms }, { ...user, ...input }, date);

test("the actual two-page sample PDF extracts all advertised terms and computes the demo", async () => {
  const data = new Uint8Array(await readFile(new URL("../public/sample-benefits.pdf", import.meta.url)));
  const pdf = await getDocumentProxy(data);
  {
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    assert.equal(totalPages, 2);
    const result = extractTerms(text);
    assert.deepEqual(result.terms, {
      employerName: "Northwind Labs", matchRate: 1, matchCapPct: 6,
      afterTaxAllowed: true, inPlanRothConversion: true, hsaEmployerContribution: 1000,
      fsaCarryover: 680, fsaGraceDeadline: null, wellnessStipend: 600,
      learningStipend: 2000, homeOfficeStipend: 300, claimDeadline: "2027-01-31",
    });
    assert.equal(result.found.length, 11);
    for (const key of result.found) {
      assert.ok(result.evidence[key]);
      assert.ok(result.evidence[key]!.length <= 160);
      assert.equal(result.evidence[key], result.evidence[key]!.trim());
    }
    const actual = buildPlan(result.terms, {
      ...user, fsaBalance: 1400, hsaCash: 6200, hsaKeepCash: 2000,
      wellnessUsed: 150, learningUsed: 0, homeOfficeUsed: 300,
    }, today);
    assert.equal(actual.totalAtRisk, 3537);
    assert.equal(actual.totalOpportunity, 44944);
    assert.deepEqual(actual.actions.map(({ id, amount, deadline }) => ({ id, amount, deadline })), [
      { id: "hsa-invest", amount: 294, deadline: "2026-11-29" },
      { id: "mega-backdoor", amount: 44650, deadline: "2026-12-31" },
      { id: "fsa", amount: 720, deadline: "2026-12-31" },
      { id: "401k-match", amount: 367, deadline: "2026-12-31" },
      { id: "learning", amount: 2000, deadline: "2027-01-31" },
      { id: "wellness", amount: 450, deadline: "2027-01-31" },
    ]);
  }
});

for (const [text, rate, cap] of [
  ["The company matches 100% of the first 6% of pay.", 1, 6],
  ["401(k): 50% match on up to 6% of pay.", 0.5, 6],
  ["We match dollar-for-dollar up to 4% of pay.", 1, 4],
  ["The company MATCHES 50.5% OF THE FIRST 6.5% of pay.", 0.505, 6.5],
] as const) {
  test(`match phrasing: ${text}`, () => {
    const { terms } = extractTerms(text);
    assert.equal(terms.matchRate, rate);
    assert.equal(terms.matchCapPct, cap);
  });
}

for (const [text, expected] of [
  ["After-tax contributions are allowed.", { afterTaxAllowed: true }],
  ["The plan accepts after-tax contributions.", { afterTaxAllowed: true }],
  ["After-tax contributions are not allowed.", { afterTaxAllowed: false }],
  ["In-plan Roth conversion is available.", { inPlanRothConversion: true }],
  ["A mega backdoor Roth option is available.", { inPlanRothConversion: true }],
  ["In-service withdrawal of after-tax money is allowed.", { inPlanRothConversion: true }],
  ["In-plan Roth conversion is not available.", { inPlanRothConversion: false }],
  ["The employer contributes $1,000 to your HSA.", { hsaEmployerContribution: 1000 }],
  ["Health FSA: carry over up to $680 of unused funds.", { fsaCarryover: 680 }],
  ["FSA carryover is not allowed.", { fsaCarryover: 0 }],
  ["The FSA grace period ends March 15, 2027.", { fsaGraceDeadline: "2027-03-15" }],
  ["The FSA has no grace period. Claims by March 15, 2027.", { fsaGraceDeadline: null }],
  ["Wellness reimbursement up to $600 annually.", { wellnessStipend: 600 }],
  ["Tuition/learning stipend $2,000.", { learningStipend: 2000 }],
  ["Home office/ergonomic stipend $300.", { homeOfficeStipend: 300 }],
  ["Claims must be submitted by January 31, 2027.", { claimDeadline: "2027-01-31" }],
] as [string, Partial<Terms>][]) {
  test(`term phrasing: ${text}`, () => {
    const { terms } = extractTerms(text);
    for (const key of Object.keys(expected) as (keyof Terms)[]) assert.equal(terms[key], expected[key]);
  });
}

test("unrelated text and missing numbers never invent values", () => {
  const actual = extractTerms("Welcome aboard. Dental, vision and PTO are offered.");
  assert.ok(Object.values(actual.terms).every((value) => value === null));
  assert.deepEqual(actual.found, []);
  assert.deepEqual(actual.evidence, {});
  assert.equal(extractTerms("Wellness stipend is available.").terms.wellnessStipend, null);
  assert.equal(extractTerms("FSA grace period ends March 15.").terms.fsaGraceDeadline, null);
  assert.equal(extractTerms("FSA grace period ends February 30, 2027.").terms.fsaGraceDeadline, null);
});

test("partial-year match includes today and December 31", () => {
  const actual = plan({ matchRate: 1, matchCapPct: 6 });
  assert.equal(actual.actions[0].amount, Math.round(95_000 * 0.03 * 47 / 365));
  assert.match(actual.actions[0].detail, /47\/365/);
  assert.equal(actual.actions[0].deadline, "2026-12-31");
  assert.equal(plan({ matchRate: 1, matchCapPct: 6 }, {}, "2026-12-31").actions[0].amount, 8);
});
test("match at or above cap has no gap", () => {
  for (const contributionPct of [6, 10]) assert.equal(plan({ matchRate: 1, matchCapPct: 6 }, { contributionPct }).actions.length, 0);
});
test("FSA subtracts carryover, floors at zero and uses grace deadline", () => {
  assert.equal(plan({ fsaCarryover: 680 }, { fsaBalance: 1400 }).totalAtRisk, 720);
  assert.equal(plan({ fsaCarryover: 680 }, { fsaBalance: 100 }).actions.length, 0);
  const actual = plan({ fsaGraceDeadline: "2027-03-15" }, { fsaBalance: 500 });
  assert.equal(actual.actions[0].deadline, "2027-03-15");
  assert.equal(actual.totalAtRisk, 500);
  assert.equal(plan({}, { fsaBalance: 500 }).totalAtRisk, 500);
});
test("all stipends subtract usage and honor claim deadline", () => {
  const actual = plan({ wellnessStipend: 600, learningStipend: 2000, homeOfficeStipend: 300, claimDeadline: "2027-01-31" }, { wellnessUsed: 150, learningUsed: 500, homeOfficeUsed: 50 });
  assert.deepEqual(actual.actions.map((a) => a.amount), [1500, 450, 250]);
  assert.ok(actual.actions.every((a) => a.deadline === "2027-01-31" && a.kind === "lost"));
  assert.equal(plan({ wellnessStipend: 600 }, { wellnessUsed: 700 }).actions.length, 0);
  assert.equal(plan({ homeOfficeStipend: 300 }).actions[0].deadline, "2026-12-31");
});
test("HSA uses idle cash and a clearly labeled 7% assumption", () => {
  const actual = plan({}, { hsaCash: 6200, hsaKeepCash: 2000 });
  assert.equal(actual.totalOpportunity, 294);
  assert.equal(actual.actions[0].deadline, "2026-11-29");
  assert.match(actual.actions[0].detail, /assumption: 7%\/yr/);
  assert.equal(plan({}, { hsaCash: 100, hsaKeepCash: 200 }).actions.length, 0);
  assert.equal(plan({}, { hsaCash: 100 }, "2026-12-25").actions[0].deadline, "2027-01-08");
});
test("mega backdoor needs both permissions and known match terms", () => {
  const terms = { matchRate: 1, matchCapPct: 6, afterTaxAllowed: true, inPlanRothConversion: true };
  const actual = plan(terms);
  const action = actual.actions.find((a) => a.id === "mega-backdoor")!;
  assert.equal(action.amount, 44_650);
  assert.match(action.detail, /tax-free growth room, not cash/);
  for (const flag of [false, null]) {
    assert.ok(!plan({ ...terms, afterTaxAllowed: flag }).actions.some((a) => a.id === "mega-backdoor"));
    assert.ok(!plan({ ...terms, inPlanRothConversion: flag }).actions.some((a) => a.id === "mega-backdoor"));
  }
  assert.ok(!plan({ ...terms, matchRate: null }).actions.some((a) => a.id === "mega-backdoor"));
  assert.equal(plan(terms, { contributionPct: 10 }).actions.find((a) => a.id === "mega-backdoor")!.amount, 41_800);
  assert.equal(plan(terms, { salary: 2_000_000, contributionPct: 6 }).actions.length, 0);
});
test("unknown terms with no cash balances yield no actions", () => {
  assert.deepEqual(plan(), { totalAtRisk: 0, totalOpportunity: 0, actions: [] });
});
test("actions sort by deadline then amount, totals sum rounded actions", () => {
  const actual = plan({ wellnessStipend: 200, learningStipend: 100.4, fsaCarryover: 0 }, { fsaBalance: 50.5, hsaCash: 100 });
  assert.deepEqual(actual.actions.map((a) => a.id), ["hsa-invest", "wellness", "learning", "fsa"]);
  assert.equal(actual.totalAtRisk, 351);
  assert.equal(actual.totalOpportunity, 7);
  assert.equal(plan({ wellnessStipend: 0.99 }).actions.length, 0);
});
test("dates are timezone-independent, leap years work, input is not mutated", () => {
  const terms = { ...empty(), matchRate: 1, matchCapPct: 6 };
  const before = JSON.stringify({ terms, user });
  assert.match(buildPlan(terms, user, "2024-01-01").actions[0].detail, /366\/366/);
  assert.equal(JSON.stringify({ terms, user }), before);
  assert.deepEqual(buildPlan(terms, user, today), buildPlan(terms, user, today));
  for (const date of ["bad", "2026-02-30", "2026-2-1"]) assert.throws(() => plan({}, {}, date), RangeError);
});
