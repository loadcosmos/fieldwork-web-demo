"use client";

import { resultSchema, type EventName, type Result } from "./demo";

const visitorKey = "fieldwork.visitor";
const historyKey = "fieldwork.history";
const seenKey = "fieldwork.seen";
let visitorInMemory: string | undefined;
let historyInMemory: Result[] = [];

export function visitorId() {
  if (!visitorInMemory) {
    visitorInMemory = crypto.randomUUID();
    try {
      visitorInMemory = localStorage.getItem(visitorKey) ?? visitorInMemory;
      localStorage.setItem(visitorKey, visitorInMemory);
    } catch {
      // Storage can be unavailable in some browser profiles.
    }
  }
  return visitorInMemory;
}

export function history() {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(historyKey) ?? "null");
    if (Array.isArray(saved)) {
      return saved.flatMap((item: unknown) => {
        const parsed = resultSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      });
    }
  } catch {
    // Keep using this tab's history if stored data cannot be read.
  }
  return historyInMemory;
}

export function saveResult(result: Result) {
  historyInMemory = [result, ...history()].slice(0, 10);
  try {
    localStorage.setItem(historyKey, JSON.stringify(historyInMemory));
  } catch {
    // The live result remains available in the current tab.
  }
}

export function track(event: EventName) {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}

export function beginVisit() {
  visitorId();
  try {
    const alreadySeen = localStorage.getItem(seenKey) === "yes";
    const session = sessionStorage.getItem(seenKey);
    if (session) return session === "returning";
    sessionStorage.setItem(seenKey, alreadySeen ? "returning" : "new");
    localStorage.setItem(seenKey, "yes");
    track("visit");
    if (alreadySeen) track("return");
    return alreadySeen;
  } catch {
    return false;
  }
}
