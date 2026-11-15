import type { Extraction, TermKey, Terms } from "./types";

const MONEY = /(?:\$\s*|USD\s+)(\d[\d,]*(?:\.\d{1,2})?)/i;
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function dateIn(text: string): string | null {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const named = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})\b/i);
  const value = iso?.[1] ?? (named ? `${named[3]}-${String(MONTHS.indexOf(named[1].toLowerCase()) + 1).padStart(2, "0")}-${named[2].padStart(2, "0")}` : null);
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

export function extractTerms(text: string): Extraction {
  const terms: Terms = {
    employerName: null, matchRate: null, matchCapPct: null,
    afterTaxAllowed: null, inPlanRothConversion: null,
    hsaEmployerContribution: null, fsaCarryover: null, fsaGraceDeadline: null,
    wellnessStipend: null, learningStipend: null, homeOfficeStipend: null,
    claimDeadline: null,
  };
  const found: TermKey[] = [];
  const evidence: Extraction["evidence"] = {};
  const normalized = text.replace(/[\u2010-\u2015]/g, "-").replace(/\s+/g, " ").trim();
  const set = <K extends TermKey>(key: K, value: Terms[K], sentence: string) => {
    if (value === null || terms[key] !== null) return;
    terms[key] = value;
    found.push(key);
    evidence[key] = sentence.trim().slice(0, 160).trim();
  };
  const employer = normalized.match(/\bEmployer\s*:\s*([^.;\n]{2,80})/i)
    ?? normalized.match(/^(.{2,80}?)\s+-\s+(?:20\d{2}\s+)?Benefits Summary\b/i);
  if (employer) set("employerName", employer[1].trim(), employer[0]);

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  let preceding = "";
  for (const sentence of sentences) {
    const context = `${preceding.slice(-180)} ${sentence}`;
    const percent = "(\\d+(?:\\.\\d+)?)\\s*%";
    const standard = sentence.match(new RegExp(`match(?:es|ing)?\\s+(?:at\\s+)?${percent}[^.!?%]{0,70}?(?:first|up to)\\s+${percent}`, "i"));
    const reverse = sentence.match(new RegExp(`${percent}\\s+(?:employer\\s+)?match[^.!?%]{0,50}?(?:first|up to)\\s+${percent}`, "i"));
    const dollar = sentence.match(new RegExp(`dollar[- ]for[- ]dollar[^.!?%]{0,50}?(?:first|up to)\\s+${percent}`, "i"));
    if (standard || reverse) {
      const match = (standard ?? reverse)!;
      set("matchRate", Number(match[1]) / 100, sentence);
      set("matchCapPct", Number(match[2]), sentence);
    } else if (dollar) {
      set("matchRate", 1, sentence);
      set("matchCapPct", Number(dollar[1]), sentence);
    } else {
      // Real summaries often state only the cap ("up to 5% match"); the rate stays unknown.
      const capOnly = sentence.match(new RegExp(`up to\\s+${percent}\\s+(?:employer\\s+)?match`, "i"));
      if (capOnly) set("matchCapPct", Number(capOnly[1]), sentence);
    }

    for (const clause of sentence.split(/;|\bbut\b/i)) {
      if (/after[- ]tax contributions/i.test(clause)) {
        if (/\b(?:not|no|cannot|unavailable|prohibited|doesn't)\b/i.test(clause)) set("afterTaxAllowed", false, sentence);
        else if (/\b(?:allow(?:s|ed)?|accept(?:s|ed)?|permi(?:t|ts|tted)|available|may|can)\b/i.test(clause)) set("afterTaxAllowed", true, sentence);
      }
      if (/in[- ]plan Roth conversion|mega backdoor|in[- ]service withdrawal/i.test(clause)) {
        if (/\b(?:not|no|cannot|unavailable|prohibited|doesn't)\b/i.test(clause)) set("inPlanRothConversion", false, sentence);
        else if (/\b(?:allow(?:s|ed)?|permi(?:t|ts|tted)|available|offer(?:s|ed)?|may|can)\b/i.test(clause)) set("inPlanRothConversion", true, sentence);
      }
    }
    if (/\bHSA\b|health savings account/i.test(sentence)) {
      const contribution = sentence.match(/\bemployer\s+(?:HSA\s+)?contribut(?:es|ion(?:s)?)\b[^.!?]{0,65}/i);
      // Also "will match your pretax contribution to your HSA up to $1,000" (the cap is what you can get).
      const hsaMatch = sentence.match(/\bmatch\b[^.!?]{0,80}?\bHSA\b[^.!?]{0,30}?up to/i);
      const amount = (contribution?.[0] ?? (hsaMatch ? sentence.slice(hsaMatch.index!, hsaMatch.index! + hsaMatch[0].length + 20) : "")).match(MONEY);
      if (amount) set("hsaEmployerContribution", Number(amount[1].replace(/,/g, "")), sentence);
    }
    if (/\bFSA\b|flexible spending/i.test(context)) {
      const carry = sentence.match(/carry[- ]?over|carry over/i);
      if (carry) {
        const amount = sentence.slice(carry.index! + carry[0].length, carry.index! + carry[0].length + 70).match(MONEY);
        if (/\bno\s+carry[- ]?over|\bno\s+carry over|carry[- ]?over\s+(?:is\s+)?not\s+(?:allowed|available)/i.test(sentence)) set("fsaCarryover", 0, sentence);
        else if (amount) set("fsaCarryover", Number(amount[1].replace(/,/g, "")), sentence);
      }
      if (/grace period/i.test(sentence) && !/no grace period|grace period\s+(?:is\s+)?not/i.test(sentence)) {
        set("fsaGraceDeadline", dateIn(sentence.slice(sentence.search(/grace period/i))), sentence);
      }
    }
    const stipendKeys: [TermKey, RegExp][] = [
      ["wellnessStipend", /wellness\s+(?:reimbursement|stipend|allowance|benefit)/i],
      ["learningStipend", /(?:tuition(?:\s*\/\s*learning)?|learning|education(?:al)?|professional development)\s+(?:reimbursement|stipend|allowance|benefit)/i],
      ["homeOfficeStipend", /(?:home[- ]office(?:\s*\/\s*ergonomic)?|ergonomic)\s+(?:reimbursement|stipend|allowance|benefit)/i],
    ];
    for (const [key, keyword] of stipendKeys) {
      const matched = sentence.match(keyword);
      if (!matched) continue;
      const amount = sentence.slice(matched.index! + matched[0].length, matched.index! + matched[0].length + 70).match(MONEY);
      if (amount) set(key, Number(amount[1].replace(/,/g, "")), sentence);
    }
    if (/\bclaims?\b/i.test(sentence) && /submit|deadline|\bby\b|due/i.test(sentence)) {
      set("claimDeadline", dateIn(sentence), sentence);
    }
    preceding = sentence;
  }
  return { terms, found, evidence };
}
