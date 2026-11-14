import { connection } from "next/server";
import { readStats } from "@/lib/counters";
import type { EventName } from "@/lib/demo";

export const metadata = { title: "Demo activity" };

const labels: Record<EventName, string> = {
  visit: "Visits",
  start: "Starts",
  result_shown: "Results shown",
  pay_click: "Demo checkout clicks",
  return: "Return visits",
};

export default async function StatsPage() {
  await connection();
  const stats = await readStats().catch(() => null);

  return (
    <div className="page space-y-6">
      <h1 className="page-title">Demo activity</h1>
      {stats
        ? <>
            <p className="lead">Event totals for <time dateTime={stats.day}>{stats.day}</time> (UTC).</p>
            <dl className="panel divide-y divide-border py-1 sm:py-2">
              {Object.entries(stats.events).map(([event, count]) => (
                <div key={event} className="flex items-center justify-between gap-4 py-4">
                  <dt className="font-medium">{labels[event as EventName]}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          </>
        : <p role="status" className="lead">Activity is temporarily unavailable. Please refresh to try again.</p>}
    </div>
  );
}
