"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResultCard } from "@/components/result-card";
import { example, maxInput, resultSchema, type PartialResult } from "@/lib/demo";
import { saveResult, visitorId } from "@/lib/visitor";
import { readResultStream } from "@/lib/result-stream";

export function InputForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<PartialResult>();
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (text.trim().length < 12) {
      setError("Enter at least 12 characters to give the model something to work with.");
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError("");
    setDraft(undefined);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, visitorId: visitorId() }),
      });
      const result = resultSchema.parse(await readResultStream(response, setDraft));
      saveResult(result);
      router.push("/result");
    } catch (failure) {
      setDraft(undefined);
      setError(failure instanceof Error && failure.name === "ResultStreamError"
        ? failure.message
        : "We couldn’t finish your result. Your text is here when you’re ready to try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="page space-y-6">
      <h1 className="page-title">What are you working with?</h1>
      <p className="lead">Add a note, a draft, or a few thoughts you want to organize.</p>
      <form className="panel space-y-4" onSubmit={submit}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="font-semibold" htmlFor="source-text">Your text</label>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setText(example); setError(""); }}>Use an example</Button>
        </div>
        <Textarea className="min-h-40 resize-y text-base" id="source-text" aria-describedby="input-note" placeholder="Paste or type something here…" value={text} onChange={(event) => { setText(event.target.value); setError(""); }} maxLength={maxInput} disabled={busy} />
        <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground" id="input-note">
          <span>Your text is sent to an AI model.</span><span>{text.length} / {maxInput}</span>
        </div>
        {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="h-12 w-full sm:w-auto" disabled={busy}>
          {busy ? <><LoaderCircle className="animate-spin" aria-hidden /> Working on it…</> : <>Generate result <ArrowRight aria-hidden /></>}
        </Button>
      </form>
      {busy && <p role="status" className="text-sm text-muted-foreground">Building your result…</p>}
      {busy && draft && <ResultCard result={draft} />}
    </div>
  );
}
