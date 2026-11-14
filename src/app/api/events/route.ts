import { z } from "zod";
import { eventNames } from "@/lib/demo";
import { recordEvent } from "@/lib/counters";

const eventSchema = z.strictObject({ event: z.enum(eventNames) });

export async function POST(request: Request) {
  const payload = eventSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) return new Response(null, { status: 400 });

  try {
    return new Response(null, { status: await recordEvent(payload.data.event) ? 204 : 429 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
