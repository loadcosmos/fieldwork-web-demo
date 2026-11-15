import "@fontsource-variable/instrument-sans";
import "./globals.css";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Benefits Unlocker — find the money in your benefits PDF",
  description: "Upload your benefits PDF to find money at risk, deadlines, and clear next steps. No account required.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site">
          <header className="site-header"><span className="brand"><span className="brand-mark" aria-hidden>B<span className="brand-mark-dot">.</span></span><span>Benefits<span className="brand-light"> Unlocker</span></span></span><span className="header-assurance"><ShieldCheck size={16} aria-hidden /> Private by design</span></header>
          <main>{children}</main>
          <footer className="site-footer">Not tax, legal or financial advice. Your PDF is read in memory and not stored. Your numbers stay in this browser.</footer>
        </div>
      </body>
    </html>
  );
}
