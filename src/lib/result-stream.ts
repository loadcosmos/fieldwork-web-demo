import type { PartialResult, Result } from "./demo";

export type ResultMessage =
  | { type: "partial"; result: PartialResult }
  | { type: "result"; result: Result }
  | { type: "error"; error: string };

class ResultStreamError extends Error {
  name = "ResultStreamError";
}

export async function readResultStream(response: Response, onPartial: (result: PartialResult) => void) {
  const defaultError = "We couldn’t finish your result. Please try again.";

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ResultStreamError(typeof body?.error === "string" ? body.error : defaultError);
  }
  if (!response.body) throw new ResultStreamError(defaultError);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const message: ResultMessage = JSON.parse(line);
        if (message.type === "partial") onPartial(message.result);
        if (message.type === "result") return message.result;
        if (message.type === "error") throw new ResultStreamError(message.error);
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  throw new ResultStreamError(defaultError);
}
