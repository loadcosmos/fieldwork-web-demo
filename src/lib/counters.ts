import { BlobError, BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { eventNames, type EventName } from "./demo";

type Counts = {
  attempts: number;
  visitors: Record<string, number>;
  events: Record<EventName, number>;
};

const dailyLimit = 80;
const visitorLimit = 10;
const trackingLimit = 400;
// Next.js can bundle each route separately even in the same local process.
const shared = globalThis as typeof globalThis & { fieldworkCounters?: Map<string, Counts> };

function localCounters() {
  return shared.fieldworkCounters ??= new Map<string, Counts>();
}

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function empty(): Counts {
  return {
    attempts: 0,
    visitors: {},
    events: { visit: 0, start: 0, result_shown: 0, pay_click: 0, return: 0 },
  };
}

function usesBlob() {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return true;
  if (process.env.VERCEL) throw new Error("Shared counter storage is missing.");
  return false;
}

async function readBlob(path: string) {
  const current = await get(path, { access: "private", useCache: false });
  if (!current) return { counts: empty(), etag: undefined };
  if (current.statusCode !== 200) throw new Error("Shared counters could not be fetched.");
  const counts: Counts = await new Response(current.stream).json();
  return { counts, etag: current.blob.etag };
}

async function update<T>(key: string, apply: (counts: Counts) => { changed: boolean; value: T }) {
  if (!usesBlob()) {
    const local = localCounters();
    const counts = local.get(key) ?? empty();
    const result = apply(counts);
    if (result.changed) local.set(key, counts);
    return result.value;
  }

  const path = `counters/${key}.json`;
  for (let attempt = 0; attempt < 7; attempt++) {
    const { counts, etag } = await readBlob(path);
    const result = apply(counts);
    if (!result.changed) return result.value;

    try {
      await put(path, JSON.stringify(counts), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: etag !== undefined,
        ifMatch: etag,
      });
      return result.value;
    } catch (error) {
      // The first writer creates the daily file. Losing writers reload it and try again.
      const createdByAnotherRequest = !etag && error instanceof BlobError && /already exists/i.test(error.message);
      if (!(error instanceof BlobPreconditionFailedError) && !createdByAnotherRequest) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 80));
    }
  }
  throw new Error("Shared counters are busy.");
}

export async function reserveGeneration(visitor: string) {
  return update(`quota-${utcDay()}`, (counts) => {
    const personal = counts.visitors[visitor] ?? 0;
    if (counts.attempts >= dailyLimit) return { changed: false, value: "daily" as const };
    if (personal >= visitorLimit) return { changed: false, value: "visitor" as const };
    counts.attempts++;
    counts.visitors[visitor] = personal + 1;
    return { changed: true, value: "allowed" as const };
  });
}

export async function recordEvent(event: EventName) {
  return update(`events-${utcDay()}`, (counts) => {
    if (eventNames.reduce((total, name) => total + counts.events[name], 0) >= trackingLimit) {
      return { changed: false, value: false };
    }
    counts.events[event]++;
    return { changed: true, value: true };
  });
}

export async function readStats() {
  const day = utcDay();
  const key = `events-${day}`;
  const counts = usesBlob()
    ? (await readBlob(`counters/${key}.json`)).counts
    : localCounters().get(key) ?? empty();
  return { day, events: counts.events };
}
