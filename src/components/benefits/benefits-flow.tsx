"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Landing } from "@/components/benefits/landing";
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
    if (!("IntersectionObserver" in window)) return;
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, rootMargin: "0px 0px 40px 0px" });
    targets.forEach((target) => { target.classList.add("will-reveal"); observer.observe(target); });
    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    if (step !== "start") window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

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

  function termControl({ key, label, kind, hint }: (typeof termFields)[number]) {
    const found = extraction?.found.includes(key) ?? false;
    const value = terms[key];
    return <div key={key} className={`receipt-term ${found ? "receipt-found" : "receipt-missing"}`}>
      <div className="receipt-term-heading"><label htmlFor={`term-${key}`}>{label}</label>{found && <span>✓ found</span>}</div>
      {kind === "boolean" ? <select id={`term-${key}`} value={value === null ? "" : value ? "yes" : "no"} onChange={(event) => updateTerm(key, event.target.value, kind)} className="field"><option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select>
        : <input id={`term-${key}`} type={kind === "text" ? "text" : kind} step={kind === "number" ? "any" : undefined} min={kind === "number" ? 0 : undefined} value={value === null ? "" : String(value)} onChange={(event) => updateTerm(key, event.target.value, kind)} className="field" />}
      {hint && <p className="term-hint">{hint}</p>}
      {found && extraction?.evidence[key] && <p className="source-quote">“{extraction.evidence[key]}”</p>}
    </div>;
  }

  function fields() {
    const found = termFields.filter(({ key }) => extraction?.found.includes(key));
    const missing = termFields.filter(({ key }) => !extraction?.found.includes(key));
    return <div className="review-stack">
      <section className="receipt">
        <div className="receipt-header"><div><span className="receipt-label">YOUR PLAN, IN PLAIN SIGHT</span><h2>What we found in your plan</h2><p>Check each quote against your PDF. Correct any value before continuing.</p></div><FileText size={30} strokeWidth={1.3} aria-hidden /></div>
        {found.length > 0 && <div className="receipt-grid">{found.map(termControl)}</div>}
        {missing.length > 0 && <div className="missing-terms"><h3>Not in this PDF — add if you know it</h3><p>Unknown values stay out of calculations that require them.</p><div className="receipt-grid">{missing.map(termControl)}</div></div>}
      </section>
      <section className="numbers-section"><div className="numbers-intro"><h2>Your numbers complete the picture.</h2><p>Use current balances. These values stay in your browser.</p></div><div className="numbers-grid">
        {numberFields.map(({ key, label, suffix }) => <div key={key}><label htmlFor={`user-${key}`}>{label} {suffix && <span>({suffix})</span>}</label><input id={`user-${key}`} type="number" min="0" step="any" value={user[key]} onChange={(event) => setUser((current) => ({ ...current, [key]: Number(event.target.value) }))} className="field" /></div>)}
        <div><label htmlFor="coverage">Health coverage</label><select id="coverage" value={user.coverage} onChange={(event) => setUser((current) => ({ ...current, coverage: event.target.value as UserInput["coverage"] }))} className="field"><option value="self">Self</option><option value="family">Family</option></select></div>
      </div></section>
    </div>;
  }

  const yearEnd = `${localToday().slice(0, 4)}-12-31`;
  const timeline = [
    { label: "Before Dec 31", actions: plan.actions.filter((action) => action.deadline < yearEnd) },
    { label: "Dec 31", actions: plan.actions.filter((action) => action.deadline === yearEnd) },
    { label: "Next year", actions: plan.actions.filter((action) => action.deadline > yearEnd) },
  ];
  const breakdown = [
    { name: "Retirement", ids: ["401k-match", "mega-backdoor"] },
    { name: "Health savings", ids: ["fsa", "hsa-invest"] },
    { name: "Reimbursements", ids: ["wellness", "learning", "home-office"] },
  ].map((category) => {
    const actions = plan.actions.filter((action) => category.ids.includes(action.id));
    return {
      name: category.name,
      lost: actions.filter((action) => action.kind === "lost").reduce((sum, action) => sum + action.amount, 0),
      opportunity: actions.filter((action) => action.kind === "opportunity").reduce((sum, action) => sum + action.amount, 0),
    };
  }).filter((category) => category.lost + category.opportunity > 0);

  return <div className={`flow-shell flow-${step}`}>
    {step === "start" && <><Landing /><section id="start" className="start-section" aria-labelledby="start-title"><div className="start-intro" data-reveal><h2 id="start-title">Find the value in <em>your</em> plan.</h2><p>Bring a Benefits Summary PDF. We&apos;ll turn it into a reviewable list of terms and actions.</p></div><div className="upload-panel" data-reveal><div className="upload-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file && !busy) void parseFile(file, false); }}><UploadCloud size={48} strokeWidth={1.3} aria-hidden /><h3>Drop your benefits PDF here</h3><p>or choose a file to get started</p><Button size="lg" onClick={() => uploadRef.current?.click()} disabled={busy}>{busy ? "Reading PDF…" : "Choose a PDF"}<ArrowRight /></Button><input ref={uploadRef} className="sr-only" type="file" accept=".pdf,application/pdf" aria-label="Choose benefits PDF" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file, false); event.target.value = ""; }} /></div><div className="upload-alternative"><p>Want to see it first?</p><Button variant="outline" onClick={trySample} disabled={busy}><FileText size={18} />Try a sample benefits PDF</Button><a href="/sample-benefits.pdf" target="_blank" rel="noopener noreferrer">View the sample PDF</a><button type="button" onClick={startManual}>No PDF? Enter terms by hand</button></div></div>{error && <p role="alert" className="upload-error">{error} <button onClick={startManual}>Enter terms by hand</button></p>}</section></>}
    {step !== "start" && <nav className="flow-progress" aria-label="Progress"><span className="progress-complete">Upload <Check size={14} aria-hidden /></span><span aria-current={step === "details" ? "step" : undefined}>Review</span><span aria-current={step === "result" ? "step" : undefined}>Your plan</span></nav>}
    {step === "details" && <div className="work-area"><div className="work-intro"><h1>First, check what we read.</h1><p>Your PDF supplies the rules. Your numbers make the result useful.</p></div>{fields()}<div className="review-actions"><Button size="lg" onClick={() => setStep("result")}>See my action plan <ArrowRight /></Button><Button variant="ghost" onClick={() => setStep("start")}>Choose another PDF</Button></div></div>}
    {step === "result" && <div className="work-area result-area">
      {returning && <div className="returning-note"><Check size={17} aria-hidden />Welcome back — {remaining.length} actions left{remaining[0] ? `, next deadline ${formatDeadline(remaining[0].deadline)}` : ""}</div>}
      <section className="outcome-screen"><div><p className="outcome-label">Based on your plan</p><h1 className="outcome-number"><AnimatedAmount value={plan.totalAtRisk} /></h1><p className="outcome-sentence">you&apos;ll lose by doing nothing</p></div><p className="outcome-opportunity">Plus <strong>{money(plan.totalOpportunity)}</strong> in tax-advantaged room or potential growth to explore</p></section>
      <section className="timeline-section" aria-labelledby="timeline-title"><div className="result-section-head"><h2 id="timeline-title">What comes due, and when.</h2><p>{plan.actions.length} actions across your plan</p></div><div className="timeline-line">{timeline.map((group) => <div className="timeline-stop" key={group.label}><span className="timeline-node" /><strong>{group.label}</strong><div className="timeline-dots" aria-label={`${group.actions.length} actions due ${group.label}`}>{group.actions.map((action) => <span key={action.id} title={`${action.title}: ${money(action.amount)}`} />)}</div><small>{group.actions.length} {group.actions.length === 1 ? "action" : "actions"}</small></div>)}</div></section>
      <section className="breakdown-section" aria-labelledby="breakdown-title"><div className="result-section-head"><h2 id="breakdown-title">Where the value sits.</h2><div className="bar-legend"><span><i className="legend-lost" />At risk</span><span><i className="legend-opportunity" />Opportunity</span></div></div><div className="breakdown-rows">{breakdown.map((category) => <div className="breakdown-row" key={category.name}><span>{category.name}</span><div className="breakdown-track" role="img" aria-label={`${category.name}: ${money(category.lost)} at risk and ${money(category.opportunity)} in opportunity`}><i className="bar-lost" style={{ width: `${category.lost / (category.lost + category.opportunity) * 100}%` }} /><i className="bar-opportunity" style={{ width: `${category.opportunity / (category.lost + category.opportunity) * 100}%` }} /></div><strong>{money(category.lost + category.opportunity)}</strong></div>)}</div><p className="breakdown-note">Each bar shows the mix within its category. Opportunity includes room or estimated growth, not cash you can claim today.</p></section>
      <div className="result-layout"><div className="action-column"><div className="result-section-head"><h2>Your next moves.</h2><p>{remaining.length} still to do</p></div>{plan.actions.length === 0 ? <div className="empty-actions"><h3>No actions yet</h3><p>We could not identify a benefit to calculate. Add plan terms or balances below.</p></div> : plan.actions.map((action, index) => <article key={action.id} className={`action-card ${done.includes(action.id) ? "action-done" : ""}`}><label className="action-checkbox"><input type="checkbox" checked={done.includes(action.id)} onChange={(event) => setDone((current) => event.target.checked ? [...current, action.id] : current.filter((id) => id !== action.id))} aria-label={`Done: ${action.title}`} className="sr-only" /><Check size={20} aria-hidden className={done.includes(action.id) ? "" : "opacity-0"} /></label><div className="action-body"><div className="action-meta"><span>Action {String(index + 1).padStart(2, "0")}</span><span className={`deadline-chip ${deadlineTone(action.deadline)}`}><Clock3 size={14} aria-hidden />{formatDeadline(action.deadline)}</span></div><div className="action-title-row"><h3>{action.title}</h3><strong>{money(action.amount)}</strong></div><p>{action.detail}</p></div></article>)}</div>
        <aside className="summary-card" aria-label="Plan summary"><div className="summary-top"><span>YOUR PLAN</span><strong>{money(plan.totalAtRisk)} <small>at risk</small></strong><p>{money(plan.totalOpportunity)} in opportunity</p></div><div className="summary-progress"><div className="progress-ring" style={{ background: `conic-gradient(#a9d9c4 ${plan.actions.length ? (plan.actions.length - remaining.length) / plan.actions.length * 100 : 0}%, #3a5551 0)` }}><span>{plan.actions.length - remaining.length}<small>of {plan.actions.length}</small></span></div><p>actions completed</p></div><div className="summary-plus"><h3>Keep every deadline close.</h3><p>Plus adds a calendar file with reminders. $179/year or $24/month.</p><p className="demo-note">Demo — nothing is charged.</p>{!plus ? <Button variant="secondary" onClick={() => setPlus(true)}>Unlock Plus <ArrowRight size={17} /></Button> : <Button variant="secondary" onClick={() => downloadCalendar(plan.actions)}><CalendarDays size={18} />Download deadlines (.ics)</Button>}{plus && <small>Demo unlocked. No payment was made.</small>}</div></aside></div>
      <details className="edit-details"><summary>Edit plan terms and your numbers</summary><div>{fields()}</div></details>
    </div>}
  </div>;
}
