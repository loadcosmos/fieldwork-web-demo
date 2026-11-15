"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, FileText, Link2Off, LockKeyhole, Quote, Upload, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPlan } from "@/lib/benefits/plan";
import type { Action, Extraction, TermKey, Terms, UserInput } from "@/lib/benefits/types";

type Step = "start" | "details" | "result";
type Saved = { terms: Terms; user: UserInput; extraction: Extraction | null; done: string[]; plus: boolean };

const EMPTY_TERMS: Terms = {
  employerName: null, matchRate: null, matchCapPct: null, afterTaxAllowed: null,
  inPlanRothConversion: null, hsaEmployerContribution: null, fsaCarryover: null,
  fsaGraceDeadline: null, wellnessStipend: null, learningStipend: null,
  homeOfficeStipend: null, claimDeadline: null,
};
const EMPTY_USER: UserInput = {
  salary: 0, contributionPct: 0, fsaBalance: 0, hsaCash: 0, hsaKeepCash: 0,
  coverage: "self", wellnessUsed: 0, learningUsed: 0, homeOfficeUsed: 0,
};
const DEMO_USER: UserInput = {
  salary: 95000, contributionPct: 3, fsaBalance: 1400, hsaCash: 6200,
  hsaKeepCash: 2000, coverage: "self", wellnessUsed: 150,
  learningUsed: 0, homeOfficeUsed: 300,
};

const termFields: { key: TermKey; label: string; kind: "text" | "number" | "boolean" | "date"; hint?: string }[] = [
  { key: "employerName", label: "Employer", kind: "text" },
  { key: "matchRate", label: "401(k) match rate", kind: "number", hint: "1 = dollar for dollar; 0.5 = 50¢ per dollar" },
  { key: "matchCapPct", label: "401(k) match cap (% of pay)", kind: "number" },
  { key: "afterTaxAllowed", label: "After-tax 401(k) contributions allowed", kind: "boolean" },
  { key: "inPlanRothConversion", label: "In-plan Roth conversion allowed", kind: "boolean" },
  { key: "hsaEmployerContribution", label: "Employer HSA contribution ($/year)", kind: "number" },
  { key: "fsaCarryover", label: "FSA carryover ($)", kind: "number" },
  { key: "fsaGraceDeadline", label: "FSA grace deadline", kind: "date" },
  { key: "wellnessStipend", label: "Wellness stipend ($/year)", kind: "number" },
  { key: "learningStipend", label: "Learning stipend ($/year)", kind: "number" },
  { key: "homeOfficeStipend", label: "Home office stipend ($/year)", kind: "number" },
  { key: "claimDeadline", label: "Reimbursement claim deadline", kind: "date" },
];
const numberFields: { key: Exclude<keyof UserInput, "coverage">; label: string; suffix?: string }[] = [
  { key: "salary", label: "Annual salary", suffix: "$" },
  { key: "contributionPct", label: "Your 401(k) contribution", suffix: "%" },
  { key: "fsaBalance", label: "FSA left to spend", suffix: "$" },
  { key: "hsaCash", label: "HSA cash balance", suffix: "$" },
  { key: "hsaKeepCash", label: "HSA cash to keep for near-term bills", suffix: "$" },
  { key: "wellnessUsed", label: "Wellness benefit already used", suffix: "$" },
  { key: "learningUsed", label: "Learning benefit already used", suffix: "$" },
  { key: "homeOfficeUsed", label: "Home office benefit already used", suffix: "$" },
];
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
function AnimatedAmount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value <= 0) {
      const frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const duration = 850;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="tabular-nums" aria-label={money(value)}><span aria-hidden="true">{money(display)}</span></span>;
}
const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const formatDeadline = (iso: string) => {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const days = Math.max(0, Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${localToday()}T00:00:00Z`)) / 86_400_000));
  return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)} · ${days} ${days === 1 ? "day" : "days"} left`;
};
const deadlineTone = (iso: string) => {
  const days = Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${localToday()}T00:00:00Z`)) / 86_400_000);
  return days < 14 ? "deadline-urgent" : days < 30 ? "deadline-soon" : "deadline-normal";
};
const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
function foldIcs(calendar: string) {
  const encoder = new TextEncoder();
  return calendar.split("\r\n").map((line) => {
    const parts: string[] = [];
    let part = "";
    for (const char of line) {
      if (encoder.encode(part + char).length > 75) {
        parts.push(part);
        part = ` ${char}`;
      } else part += char;
    }
    parts.push(part);
    return parts.join("\r\n");
  }).join("\r\n");
}
function downloadCalendar(actions: Action[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = actions.filter((action) => /^\d{4}-\d{2}-\d{2}$/.test(action.deadline)).map((action) => {
    const start = action.deadline.replace(/-/g, "");
    const endDate = new Date(`${action.deadline}T12:00:00Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    const end = endDate.toISOString().slice(0, 10).replace(/-/g, "");
    return ["BEGIN:VEVENT", `UID:${escapeIcs(action.id)}-${start}@benefits-unlocker.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${escapeIcs(action.title)}`, `DESCRIPTION:${escapeIcs(action.detail)}`, "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-P3D", `DESCRIPTION:${escapeIcs(action.title)} is due in 3 days`, "END:VALARM", "END:VEVENT"].join("\r\n");
  });
  const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Benefits Unlocker//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
  const url = URL.createObjectURL(new Blob([foldIcs(calendar)], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "benefits-deadlines.ics";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BenefitsFlow() {
  const [step, setStep] = useState<Step>("start");
  const [terms, setTerms] = useState<Terms>(EMPTY_TERMS);
  const [user, setUser] = useState<UserInput>(EMPTY_USER);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [plus, setPlus] = useState(false);
  const [returning, setReturning] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const plan = buildPlan(terms, user, localToday());
  const remaining = plan.actions.filter((action) => !done.includes(action.id));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("benefits-unlocker.v1");
        if (raw) {
          const saved = JSON.parse(raw) as Saved;
          if (saved.terms && saved.user) {
            setTerms({ ...EMPTY_TERMS, ...saved.terms });
            setUser({ ...EMPTY_USER, ...saved.user });
            setExtraction(saved.extraction ?? null);
            setDone(Array.isArray(saved.done) ? saved.done : []);
            setPlus(Boolean(saved.plus));
            setReturning(true);
            setStep("result");
          }
        }
      } catch { /* Browser storage may be disabled. */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready || step === "start") return;
    try { localStorage.setItem("benefits-unlocker.v1", JSON.stringify({ terms, user, extraction, done, plus } satisfies Saved)); }
    catch { /* The flow still works without storage. */ }
  }, [ready, step, terms, user, extraction, done, plus]);

  async function parseFile(file: File, sample: boolean) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/parse", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read this PDF.");
      const found = data.extraction as Extraction;
      setTerms({ ...EMPTY_TERMS, ...found.terms });
      setExtraction(found);
      setUser(sample ? DEMO_USER : EMPTY_USER);
      setDone([]);
      setReturning(false);
      setStep("details");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read this PDF.");
    } finally { setBusy(false); }
  }
  async function trySample() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/sample-benefits.pdf");
      if (!response.ok) throw new Error("The sample PDF is unavailable.");
      const blob = await response.blob();
      await parseFile(new File([blob], "sample-benefits.pdf", { type: "application/pdf" }), true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The sample PDF is unavailable.");
      setBusy(false);
    }
  }
  function startManual() {
    setTerms(EMPTY_TERMS); setUser(EMPTY_USER); setExtraction(null); setDone([]); setReturning(false); setError(""); setStep("details");
  }
  const updateTerm = (key: TermKey, value: string, kind: "text" | "number" | "boolean" | "date") => {
    const parsed = value === "" ? null : kind === "number" ? Number(value) : kind === "boolean" ? value === "yes" : value;
    setTerms((current) => ({ ...current, [key]: parsed } as Terms));
  };

  function fields() {
    return <div className="space-y-8">
      <section className="panel">
        <div className="section-heading"><span className="section-number">01 / PLAN TERMS</span><h2 className="text-2xl font-semibold tracking-tight">What we found in your plan</h2><p className="mt-1 text-sm text-muted-foreground">Check the source quotes and correct anything that looks wrong. All fields are editable.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          {termFields.map(({ key, label, kind, hint }) => {
            const found = extraction?.found.includes(key) ?? false;
            const value = terms[key];
            return <div key={key} className="min-w-0">
              <label htmlFor={`term-${key}`} className="block text-sm font-semibold">{label}</label>
              <p className={`mt-1 text-xs ${found ? "text-primary" : "text-muted-foreground"}`}>{found ? "✓ found" : "not in your PDF — fill in if you know it"}</p>
              {kind === "boolean" ? <select id={`term-${key}`} value={value === null ? "" : value ? "yes" : "no"} onChange={(event) => updateTerm(key, event.target.value, kind)} className="field"><option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select>
                : <input id={`term-${key}`} type={kind === "text" ? "text" : kind} step={kind === "number" ? "any" : undefined} min={kind === "number" ? 0 : undefined} value={value === null ? "" : String(value)} onChange={(event) => updateTerm(key, event.target.value, kind)} className="field" />}
              {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
              {found && extraction?.evidence[key] && <p className="source-quote flex items-start gap-2"><Quote size={16} aria-hidden className="mt-0.5 shrink-0 text-primary" /><span>“{extraction.evidence[key]}”</span></p>}
            </div>;
          })}
        </div>
      </section>
      <section className="panel">
        <div className="section-heading"><span className="section-number">02 / YOUR NUMBERS</span><h2 className="text-2xl font-semibold tracking-tight">Your numbers</h2><p className="mt-1 text-sm text-muted-foreground">Use your current balances. These stay in your browser.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          {numberFields.map(({ key, label, suffix }) => <div key={key}><label htmlFor={`user-${key}`} className="block text-sm font-semibold">{label} {suffix && <span className="font-normal text-muted-foreground">({suffix})</span>}</label><input id={`user-${key}`} type="number" min="0" step="any" value={user[key]} onChange={(event) => setUser((current) => ({ ...current, [key]: Number(event.target.value) }))} className="field" /></div>)}
          <div><label htmlFor="coverage" className="block text-sm font-semibold">Health coverage</label><select id="coverage" value={user.coverage} onChange={(event) => setUser((current) => ({ ...current, coverage: event.target.value as UserInput["coverage"] }))} className="field"><option value="self">Self</option><option value="family">Family</option></select></div>
        </div>
      </section>
    </div>;
  }

  return <div className="flow-shell">
    <nav className="stepper" aria-label="Progress"><span aria-current={step === "start" ? "step" : undefined}>01 <span>Upload</span></span><span aria-hidden className="step-divider" /><span aria-current={step === "details" ? "step" : undefined}>02 <span>Review</span></span><span aria-hidden className="step-divider" /><span aria-current={step === "result" ? "step" : undefined}>03 <span>Your plan</span></span></nav>
    {step === "start" && <div className="hero-grid">
      <div className="hero-copy reveal"><span className="eyebrow"><span className="eyebrow-dot" /> Your benefits, in focus</span><h1 className="heading">Make the most of what&apos;s already yours<span className="heading-period">.</span></h1><p className="lead mt-6">See which benefits may expire, what they could be worth, and what to do next.</p>
        <div className="hero-actions"><Button size="lg" className="hero-button" onClick={trySample} disabled={busy}><FileText />{busy ? "Reading PDF…" : "Try a sample benefits PDF"}<ArrowRight /></Button><Button size="lg" variant="outline" className="hero-button" onClick={() => uploadRef.current?.click()} disabled={busy}><Upload />Upload my Benefits Summary (PDF)</Button><input ref={uploadRef} className="sr-only" type="file" accept=".pdf,application/pdf" aria-label="Choose benefits PDF" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file, false); event.target.value = ""; }} /><div className="hero-links"><a href="/sample-benefits.pdf" target="_blank" rel="noopener noreferrer" className="text-link text-sm underline">View the sample PDF</a><button type="button" onClick={startManual} className="text-link text-sm underline">No PDF? Enter terms by hand</button></div></div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error} <button className="underline" onClick={startManual}>Enter terms by hand</button></p>}
        <div className="trust-row" role="group" aria-label="Privacy"><span className="trust-badge"><LockKeyhole size={15} aria-hidden />Read in memory, never stored</span><span className="trust-badge"><UserRoundX size={15} aria-hidden />No account</span><span className="trust-badge"><Link2Off size={15} aria-hidden />No bank connection</span></div>
      </div>
      <div className="preview reveal reveal-later"><div className="preview-top"><span className="preview-monogram" aria-hidden>B.</span><span>YOUR PLAN AT A GLANCE</span><span className="preview-top-right">EXAMPLE</span></div><div className="preview-sheet"><div className="preview-sheet-head"><span className="preview-kicker">Potential value at risk</span><span className="preview-spark" aria-hidden>↗</span></div><p className="preview-amount">$3,537</p><p className="preview-note">Illustrative sample result · not your amount</p><div className="preview-rule" /><div className="preview-list"><div><span className="preview-list-icon"><Check size={15} aria-hidden /></span><span>Employer match</span><span>Review</span></div><div><span className="preview-list-icon"><Check size={15} aria-hidden /></span><span>FSA balance</span><span>Review</span></div><div><span className="preview-list-icon"><CalendarDays size={15} aria-hidden /></span><span>Claim deadlines</span><span>Dec 31</span></div></div></div><div className="preview-bottom"><span className="preview-bottom-dot" /> Clear next steps, grounded in your plan <ArrowRight size={16} aria-hidden /></div></div>
    </div>}
    {step === "details" && <><div className="page-intro reveal"><span className="eyebrow"><span className="eyebrow-dot" /> THE DETAILS</span><h1 className="page-title">Make it yours.</h1><p className="mt-3 text-muted-foreground">Your PDF gives us the rules. Your numbers make the result useful.</p></div>{fields()}<div className="mt-7 flex flex-wrap gap-3"><Button size="lg" className="h-12 rounded-xl" onClick={() => setStep("result")}>See my action plan <ArrowRight /></Button><Button variant="ghost" onClick={() => setStep("start")}>Choose another PDF</Button></div></>}
    {step === "result" && <>
      {returning && <div className="returning-note"><Check size={17} aria-hidden />Welcome back — {remaining.length} actions left{remaining[0] ? `, next deadline ${formatDeadline(remaining[0].deadline)}` : ""}</div>}
      <div className="result-hero reveal"><div className="result-hero-top"><p className="result-eyebrow">YOUR ACTION PLAN</p><span className="result-hero-mark" aria-hidden>✳</span></div><h1 className="result-title"><AnimatedAmount value={plan.totalAtRisk} /><span>you&apos;ll lose by doing nothing</span></h1><div className="result-hero-bottom"><p>+ {money(plan.totalOpportunity)} of tax-advantaged room / growth you&apos;re skipping</p><span>BASED ON YOUR PLAN</span></div></div>
      {plan.actions.length > 0 && <div className="actions-heading"><div><span className="section-number">YOUR NEXT STEPS</span><h2 className="text-2xl font-semibold tracking-tight">Your actions</h2></div><p role="status" aria-atomic="true" className="progress-pill">{plan.actions.length - remaining.length} of {plan.actions.length} done</p></div>}
      <div className="space-y-3">{plan.actions.length === 0 ? <div className="panel"><h2 className="text-xl font-semibold">No actions yet</h2><p className="mt-2 text-sm text-muted-foreground">We could not identify a benefit to calculate. Add plan terms or your balances below to see what may be available.</p></div> : plan.actions.map((action, index) => <article key={action.id} className={`panel action-card ${done.includes(action.id) ? "action-done" : ""}`}><div className="flex items-start gap-3 sm:gap-4"><label className="action-checkbox"><input type="checkbox" checked={done.includes(action.id)} onChange={(event) => setDone((current) => event.target.checked ? [...current, action.id] : current.filter((id) => id !== action.id))} aria-label={`Done: ${action.title}`} className="sr-only" /><Check size={20} aria-hidden className={done.includes(action.id) ? "" : "opacity-0"} /></label><div className="min-w-0 flex-1"><div className="action-card-top"><div><span className="action-index">ACTION {String(index + 1).padStart(2, "0")}</span><h3 className="text-lg font-semibold">{action.title}</h3></div><strong className="action-amount">{money(action.amount)}</strong></div><p className={`deadline-chip mt-2 ${deadlineTone(action.deadline)}`}><Clock3 size={14} aria-hidden />{formatDeadline(action.deadline)}</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{action.detail}</p></div></div></article>)}</div>
      <details className="mt-8"><summary className="cursor-pointer text-sm font-semibold underline underline-offset-4">Edit plan terms and your numbers</summary><div className="mt-5">{fields()}</div></details>
      <section className="plus-panel"><div className="flex flex-wrap justify-between gap-4"><div><p className="plus-eyebrow">Stay ahead of every deadline</p><h2 className="mt-2 text-2xl font-semibold">Benefits Unlocker Plus</h2></div><p className="text-lg font-semibold">$179/year <span className="text-sm font-normal text-[#d7e9da]">or</span> $24/month</p></div><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#d7e9da]">Get a calendar file with every deadline and reminders. Re-check after open enrollment and each new plan year.</p><div className="mt-6 flex flex-wrap gap-3">{!plus && <Button variant="secondary" className="h-auto min-h-11 rounded-xl" onClick={() => setPlus(true)}>Unlock Plus (demo — no card, nothing charged)</Button>}{plus && <Button variant="secondary" className="h-auto min-h-11 rounded-xl" onClick={() => downloadCalendar(plan.actions)}><CalendarDays />Download deadlines (.ics)</Button>}</div>{plus && <p className="mt-3 text-xs text-[#d7e9da]">Demo unlocked. No payment was made.</p>}</section>
    </>}
  </div>;
}
