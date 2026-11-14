import "@fontsource-variable/instrument-sans";
import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
import Link from "next/link";
import { Asterisk } from "lucide-react";

export const metadata: Metadata = {
  title: { default: "Fieldwork", template: "%s · Fieldwork" },
  description: "Turn a block of text into a clear summary, key points, and a next step.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site">
          <header className="site-header">
            <Link href="/" className="brand"><span className="brand-mark"><Asterisk size={19} strokeWidth={2.6} aria-hidden /></span>Fieldwork</Link>
            <Link className="text-link text-sm" href="/stats">Stats</Link>
          </header>
          <main>{children}</main>
          <Analytics />
          <footer className="site-footer"><span>Fieldwork</span><span>Web demo</span></footer>
        </div>
      </body>
    </html>
  );
}
