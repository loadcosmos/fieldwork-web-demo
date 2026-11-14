import { ArrowUpRight } from "lucide-react";
import type { PartialResult } from "@/lib/demo";

export function ResultCard({ result }: { result: PartialResult }) {
  const points = [result.keyPoints?.first, result.keyPoints?.second, result.keyPoints?.third];

  return (
    <article className="panel space-y-6 wrap-break-word">
      {result.title && <h2 className="text-3xl font-semibold tracking-tight">{result.title}</h2>}
      {result.summary && <p className="leading-relaxed text-muted-foreground">{result.summary}</p>}
      {points.some(Boolean) && (
        <section className="border-t border-border pt-5">
          <h3 className="mb-3 font-semibold">Key points</h3>
          <ul className="list-disc space-y-2 pl-5 marker:text-[#527659]">
            {points.map((point, index) => point && <li key={index}>{point}</li>)}
          </ul>
        </section>
      )}
      {result.nextStep && (
        <section className="flex items-start gap-3 rounded-xl bg-muted p-4">
          <ArrowUpRight className="mt-0.5 shrink-0" size={20} aria-hidden />
          <div><h3 className="font-semibold">Next step</h3><p className="mt-1 text-muted-foreground">{result.nextStep}</p></div>
        </section>
      )}
    </article>
  );
}
