import { ArrowDown, ArrowUpRight, ListChecks } from "lucide-react";

export function Preview() {
  return (
    <aside className="preview" aria-label="Example result">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-widest text-[#dfff9b] uppercase">
        <ListChecks size={16} aria-hidden /> Example result
      </div>
      <div className="rounded-2xl border border-white/20 bg-white/8 p-4 text-sm leading-relaxed text-white/85 sm:p-5">
        “The library wants to host a seed swap next month…”
      </div>
      <ArrowDown className="my-3 ml-4 text-[#dfff9b]" size={17} aria-hidden />
      <div className="rounded-2xl bg-[#f4f7e9] p-4 text-[#182f25] sm:p-5">
        <p className="mb-1 text-xl font-semibold tracking-tight">Plan a library seed swap</p>
        <p className="text-sm leading-relaxed">A small team needs a simple format for a 30-person event that welcomes beginners.</p>
        <div className="mt-4 flex items-start gap-2 border-t border-[#ccd7c3] pt-3 text-sm font-semibold">
          <ArrowUpRight size={16} className="mt-0.5 shrink-0" aria-hidden />
          Ask attendees which seeds they plan to bring.
        </div>
      </div>
    </aside>
  );
}
