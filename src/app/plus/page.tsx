import { Check } from "lucide-react";
import Link from "next/link";
import { DemoPayment } from "@/components/demo-payment";

export const metadata = { title: "Fieldwork Plus" };
const features = ["More generations each day", "A longer history of saved results", "Export results as plain text"];

export default function PlusPage() {
  return (
    <div className="page space-y-6">
      <h1 className="page-title">Fieldwork Plus</h1>
      <p className="lead">Preview what the paid plan could include.</p>
      <div className="panel space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">What’s included</h2>
        <ul className="space-y-3">
          {features.map((feature) => <li className="flex items-center gap-3" key={feature}><Check size={19} aria-hidden />{feature}</li>)}
        </ul>
        <DemoPayment />
      </div>
      <Link className="text-link" href="/result">Back to your result</Link>
    </div>
  );
}
