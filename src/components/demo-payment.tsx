"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/visitor";

export function DemoPayment() {
  const [complete, setComplete] = useState(false);

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <p className="text-sm text-muted-foreground">Demo checkout. No card details and no charge. Plus features are a preview.</p>
      {complete
        ? <p role="status" className="rounded-lg bg-muted p-3 font-medium">Demo complete. You were not charged.</p>
        : <Button type="button" size="lg" onClick={() => { track("pay_click"); setComplete(true); }}>Try demo checkout</Button>}
    </div>
  );
}
