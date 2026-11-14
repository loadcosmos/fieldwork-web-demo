"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultCard } from "@/components/result-card";
import { history, track } from "@/lib/visitor";
import type { Result } from "@/lib/demo";

let lastResult: Result | undefined;
let lastSerialized: string | undefined;

function currentResult() {
  const candidate = history()[0];
  const serialized = JSON.stringify(candidate);
  if (serialized !== lastSerialized) {
    lastSerialized = serialized;
    lastResult = candidate;
  }
  return lastResult ?? null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function SavedResult() {
  const result = useSyncExternalStore(subscribe, currentResult, () => undefined);

  const shown = useRef(false);
  useEffect(() => {
    if (result && !shown.current) {
      shown.current = true;
      track("result_shown");
    }
  }, [result]);

  return (
    <div className="page space-y-6">
      <h1 className="page-title">Your result</h1>
      {result === undefined && <p role="status">Loading your result…</p>}
      {result === null && <p className="lead">Add some text to create your first result.</p>}
      {result && <ResultCard result={result} />}
      {result !== undefined && (
        <div className="flex flex-wrap items-center gap-4">
          {result && <Button asChild size="lg"><Link href="/plus">See what’s in Plus <ArrowRight aria-hidden /></Link></Button>}
          <Link href="/start" className="text-link">{result ? "Try another input" : "Add text"}</Link>
        </div>
      )}
      {result && <p className="text-sm text-muted-foreground">Saved in this browser.</p>}
    </div>
  );
}
