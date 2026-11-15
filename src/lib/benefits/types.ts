// Shared contract between the PDF extractor, the calculator and the UI.
// All money values are US dollars per plan year. Dates are ISO "YYYY-MM-DD".

export type Terms = {
  employerName: string | null;
  /** Employer 401(k) match rate: 1 = 100% of what you put in, 0.5 = 50 cents per dollar. */
  matchRate: number | null;
  /** Share of salary the employer matches up to, in percent (e.g. 6 means "up to 6% of pay"). */
  matchCapPct: number | null;
  /** Plan accepts after-tax (non-Roth) 401(k) contributions. */
  afterTaxAllowed: boolean | null;
  /** Plan allows in-plan Roth conversion or in-service withdrawal of after-tax money. */
  inPlanRothConversion: boolean | null;
  /** Employer HSA contribution per year. */
  hsaEmployerContribution: number | null;
  /** Unused FSA dollars the plan lets you carry into next year. */
  fsaCarryover: number | null;
  /** Last day to spend last year's FSA money when the plan has a grace period. */
  fsaGraceDeadline: string | null;
  wellnessStipend: number | null;
  learningStipend: number | null;
  homeOfficeStipend: number | null;
  /** Last day to submit stipend / reimbursement claims for this plan year. */
  claimDeadline: string | null;
};

export type TermKey = keyof Terms;

export type Extraction = {
  terms: Terms;
  /** Keys the extractor actually found in the text (everything else is null). */
  found: TermKey[];
  /** Short quote from the document for each found key, so people can check it. */
  evidence: Partial<Record<TermKey, string>>;
};

export type UserInput = {
  salary: number;
  /** Your own 401(k) contribution, percent of pay. */
  contributionPct: number;
  /** FSA money not spent yet this plan year. */
  fsaBalance: number;
  /** HSA money sitting in cash. */
  hsaCash: number;
  /** Cash you want to keep in the HSA for near-term medical bills. */
  hsaKeepCash: number;
  coverage: "self" | "family";
  wellnessUsed: number;
  learningUsed: number;
  homeOfficeUsed: number;
};

export type Action = {
  id: string;
  title: string;
  /** Dollars this action is worth. */
  amount: number;
  deadline: string;
  /** One sentence: what to do and why the number is what it is. */
  detail: string;
  /** "lost" = forfeited if you do nothing; "opportunity" = tax-advantaged room or growth you are skipping. */
  kind: "lost" | "opportunity";
};

export type Plan = {
  /** Sum of "lost" actions. */
  totalAtRisk: number;
  /** Sum of "opportunity" actions. */
  totalOpportunity: number;
  /** Sorted by deadline, then by amount descending. */
  actions: Action[];
};
