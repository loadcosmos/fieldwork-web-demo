"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { beginVisit, track } from "@/lib/visitor";

export function Analytics() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === previousPath.current) return;
    previousPath.current = pathname;
    if (pathname === "/stats") return;
    beginVisit();
    if (pathname === "/start") track("start");
  }, [pathname]);

  return null;
}
