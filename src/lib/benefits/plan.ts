import type { Action, Plan, Terms, UserInput } from "./types";

// IRS 2026 limits: https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500
// HSA: Rev. Proc. 2025-19; health FSA: Rev. Proc. 2025-32.
export const IRS_LIMITS_2026 = {
  employeeDeferral: 24_500,
  total415c: 72_000,
  hsaSelf: 4_400,
  hsaFamily: 8_750,
  healthFsa: 3_400,
  maxFsaCarryover: 680,
} as const;

const DAY_MS = 86_400_000;
const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

/** Deterministic calendar arithmetic in UTC; the caller supplies today's date. */
export function buildPlan(terms: Terms, user: UserInput, today: string): Plan {
  const now = new Date(`${today}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !Number.isFinite(now.getTime()) || now.toISOString().slice(0, 10) !== today) {
    throw new RangeError("today must be a valid YYYY-MM-DD date");
  }
  const year = now.getUTCFullYear();
  const yearEnd = `${year}-12-31`;
  const nextYear = Date.UTC(year + 1, 0, 1);
  const daysInYear = (nextYear - Date.UTC(year, 0, 1)) / DAY_MS;
  const daysRemaining = (nextYear - now.getTime()) / DAY_MS;
  const actions: Action[] = [];
  const add = (action: Action) => {
    if (Number.isFinite(action.amount) && action.amount >= 1) {
      actions.push({ ...action, amount: Math.round(action.amount) });
    }
  };

  if (terms.matchRate !== null && terms.matchCapPct !== null && user.contributionPct < terms.matchCapPct) {
    const gap = terms.matchCapPct - user.contributionPct;
    add({
      id: "401k-match", kind: "lost", deadline: yearEnd,
      title: `Raise 401(k) from ${user.contributionPct}% to ${terms.matchCapPct}%`,
      amount: user.salary * gap / 100 * terms.matchRate * daysRemaining / daysInYear,
      detail: `${dollars(user.salary)} salary × (${terms.matchCapPct}% − ${user.contributionPct}%) × ${terms.matchRate} match × ${daysRemaining}/${daysInYear} days remaining; assumes even pay and an immediate contribution change.`,
    });
  }
  {
    const amount = Math.max(0, user.fsaBalance - (terms.fsaCarryover ?? 0));
    add({
      id: "fsa", kind: "lost", deadline: terms.fsaGraceDeadline ?? yearEnd,
      title: `Spend ${dollars(amount)} of FSA`, amount,
      detail: `max(0, ${dollars(user.fsaBalance)} balance − ${dollars(terms.fsaCarryover ?? 0)} carryover) = ${dollars(amount)} at risk; spend on eligible expenses by the deadline.`,
    });
  }
  const stipends = [
    { id: "wellness", label: "wellness", limit: terms.wellnessStipend, used: user.wellnessUsed },
    { id: "learning", label: "learning", limit: terms.learningStipend, used: user.learningUsed },
    { id: "home-office", label: "home office", limit: terms.homeOfficeStipend, used: user.homeOfficeUsed },
  ];
  for (const stipend of stipends) {
    if (stipend.limit === null) continue;
    const amount = Math.max(0, stipend.limit - stipend.used);
    add({
      id: stipend.id, kind: "lost", deadline: terms.claimDeadline ?? yearEnd,
      title: `Claim ${dollars(amount)} of ${stipend.label} benefits`, amount,
      detail: `max(0, ${dollars(stipend.limit)} annual allowance − ${dollars(stipend.used)} already used) = ${dollars(amount)} unused; submit eligible receipts by the claim deadline.`,
    });
  }
  const invest = Math.max(0, user.hsaCash - user.hsaKeepCash);
  add({
    id: "hsa-invest", kind: "opportunity",
    deadline: new Date(now.getTime() + 14 * DAY_MS).toISOString().slice(0, 10),
    title: `Consider investing ${dollars(invest)} of HSA cash`, amount: invest * 0.07,
    detail: `max(0, ${dollars(user.hsaCash)} cash − ${dollars(user.hsaKeepCash)} cash reserve) × 7% = ${dollars(invest * 0.07)} estimated one-year growth; assumption: 7%/yr, returns are not guaranteed and investments can lose value; check your provider's investment minimum.`,
  });
  // Match terms must be known to calculate remaining total-contribution room.
  if (terms.afterTaxAllowed === true && terms.inPlanRothConversion === true && terms.matchRate !== null && terms.matchCapPct !== null) {
    const employerMatch = user.salary * Math.min(user.contributionPct, terms.matchCapPct) / 100 * terms.matchRate;
    const room = Math.max(0, IRS_LIMITS_2026.total415c - IRS_LIMITS_2026.employeeDeferral - employerMatch);
    add({
      id: "mega-backdoor", kind: "opportunity", deadline: yearEnd,
      title: `Explore ${dollars(room)} of mega backdoor Roth room`, amount: room,
      detail: `${dollars(IRS_LIMITS_2026.total415c)} total limit − ${dollars(IRS_LIMITS_2026.employeeDeferral)} employee deferral − (${dollars(user.salary)} × min(${user.contributionPct}%, ${terms.matchCapPct}%) × ${terms.matchRate}) employer match = ${dollars(room)} tax-free growth room, not cash; assumes no other employer or after-tax contributions.`,
    });
  }
  actions.sort((a, b) => a.deadline.localeCompare(b.deadline) || b.amount - a.amount);
  return {
    totalAtRisk: actions.filter((a) => a.kind === "lost").reduce((sum, a) => sum + a.amount, 0),
    totalOpportunity: actions.filter((a) => a.kind === "opportunity").reduce((sum, a) => sum + a.amount, 0),
    actions,
  };
}
