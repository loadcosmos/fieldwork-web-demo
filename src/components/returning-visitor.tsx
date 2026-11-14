"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { beginVisit, history } from "@/lib/visitor";

let visited = false;
let returning = false;

function subscribe(callback: () => void) {
  if (!visited) {
    visited = true;
    returning = beginVisit();
    callback();
  }
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function greeting() {
  return history()[0]?.title ?? (returning ? "" : null);
}

export function ReturningVisitor() {
  const title = useSyncExternalStore(subscribe, greeting, () => null);
  if (title === null) return null;
  return (
    <div className="max-w-sm border-t border-border pt-4">
      <p className="font-semibold">Welcome back</p>
      {title && <Link href="/result" className="text-link text-sm">Last result: {title}</Link>}
    </div>
  );
}
