import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Preview } from "@/components/preview";
import { ReturningVisitor } from "@/components/returning-visitor";

export default function Home() {
  return (
    <div className="hero-grid">
      <div className="space-y-6">
        <h1 className="heading">Find what matters in your text.</h1>
        <p className="lead">Paste a note, a draft, or a list. Get a short summary, three key points, and a next step.</p>
        <Button asChild size="lg" className="h-12 px-5"><Link href="/start">Start <ArrowRight aria-hidden /></Link></Button>
        <ReturningVisitor />
      </div>
      <Preview />
    </div>
  );
}
