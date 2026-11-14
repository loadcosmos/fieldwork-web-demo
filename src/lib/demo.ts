import { z } from "zod";

export const maxInput = 2400;

export const example = "The library wants to host a seed swap next month. We have a room for 30 people, two volunteers, and a small publicity budget. We need a simple way to sort the seeds and make the event welcoming to beginners.";

export const resultSchema = z.strictObject({
  title: z.string(),
  summary: z.string(),
  keyPoints: z.object({ first: z.string(), second: z.string(), third: z.string() }).strict(),
  nextStep: z.string(),
});

export type Result = z.infer<typeof resultSchema>;

export type PartialResult = Partial<Omit<Result, "keyPoints">> & {
  keyPoints?: Partial<Result["keyPoints"]>;
};

export const eventNames = ["visit", "start", "result_shown", "pay_click", "return"] as const;
export type EventName = (typeof eventNames)[number];
