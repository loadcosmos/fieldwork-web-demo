import "@fontsource-variable/instrument-sans";
import "./globals.css";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Benefits Unlocker — find the money in your benefits PDF",
  description: "Upload your benefits PDF to find money at risk, deadlines, and clear next steps. No account required.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site">
          <header className="site-header"><span className="brand"><span className="brand-mark"><Sparkles size={18} aria-hidden /></span> Benefits Unlocker</span><span className="hidden text-sm text-muted-foreground sm:block">Your plan, made useful.</span></header>
          <main>{children}</main>
          <footer className="site-footer">Not tax, legal or financial advice. Your PDF is read in memory and not stored. Your numbers stay in this browser.</footer>
        </div>
      </body>
    </html>
  );
}
