import { ArrowDownRight, ArrowRight, CalendarDays, FileText, LockKeyhole, ShieldCheck, UploadCloud } from "lucide-react";

export function Landing() {
  return <div className="landing">
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="hero-inner" data-reveal>
        <h1 id="landing-title" className="hero-headline">Your benefits PDF is <em>hiding</em> money.</h1>
        <p className="hero-subtitle">Find the benefits you could miss, see what they are worth, and know what to do before the deadline.</p>
        <div className="hero-pills" aria-label="How this works"><span>PDF read in memory, never stored</span><span>2026 IRS limits</span><span>No sign-up</span></div>
        <a className="hero-cta" href="#start">Find what&apos;s yours <ArrowRight size={18} aria-hidden /></a>
      </div>
      <div className="mockup-scene" data-reveal>
        <div className="mockup-device">
          <div className="mockup-browser"><span className="browser-dots" aria-hidden><i /><i /><i /></span><span>Sample · Northwind Labs</span><span className="browser-live">2026 plan</span></div>
          <div className="mockup-screen"><span className="mockup-mark">B.</span><p className="mockup-overline">YOUR BENEFITS, UNLOCKED</p><p className="mockup-outcome">We found <em>6 actions</em> worth <strong>$3,537</strong> before Dec 31</p><div className="mockup-divider" /><div className="mockup-list"><span>Next deadline</span><strong>Nov 29</strong><span>Value at risk</span><strong>$3,537</strong></div></div>
        </div>
        <div className="float-card float-fsa"><span className="float-dot amber" /> <span><strong>FSA</strong><small>$720 expires Dec 31</small></span></div>
        <div className="float-card float-match"><span className="float-dot cobalt" /> <span><strong>401(k) match</strong><small>$367 left on the table by Dec 31</small></span></div>
        <div className="float-card float-learning"><span className="float-dot mint" /> <span><strong>Learning stipend</strong><small>$2,000 unclaimed · Jan 31</small></span></div>
        <div className="float-ring" aria-label="6 actions, next deadline November 29"><span>6</span><small>actions<br />next: Nov 29</small></div>
      </div>
    </section>

    <section className="stat-strip" aria-label="Why review benefits" data-reveal>
      <div><strong>~40%</strong><p>of FSA holders forfeited money in 2024, avg $404</p><small>EBRI</small></div>
      <div><strong>49%</strong><p>of HSA assets invested</p><small>Devenir · 2026</small></div>
      <div><strong>36%</strong><p>of workers unsure how benefits fit together</p><small>The Hartford · 2025</small></div>
      <div><strong>&lt;30 min</strong><p>spent reviewing benefits</p><small>Voya</small></div>
    </section>

    <section className="how-section" aria-labelledby="how-title">
      <div className="how-intro" data-reveal><h2 id="how-title">From dense PDF to <em>decisions you can use.</em></h2><p>One document becomes a clear list of terms, amounts, and dates. You check the evidence before calculating your plan.</p></div>
      <div className="bento-grid">
        <div className="bento-card bento-upload" data-reveal><div className="bento-copy"><span className="bento-step">01 / UPLOAD</span><h3>Upload your PDF. <span>We start with the source.</span></h3></div><div className="mini-drop"><UploadCloud size={34} strokeWidth={1.5} aria-hidden /><span>Drop your Benefits Summary here</span><div className="mini-file"><FileText size={20} aria-hidden /><span>northwind-benefits-2026.pdf</span><ShieldCheck size={17} aria-hidden /></div></div></div>
        <div className="bento-card bento-terms" data-reveal><div className="bento-copy"><span className="bento-step">02 / VERIFY</span><h3>See every term. <span>Check the fine print.</span></h3></div><div className="mini-terms"><div><span>401(k) match</span><strong>100% · first 6%</strong></div><div><span>FSA carryover</span><strong>$680</strong></div><blockquote>“Northwind Labs matches 100% of the first 6% of eligible pay…”</blockquote></div></div>
        <div className="bento-card bento-actions" data-reveal><div className="bento-copy"><span className="bento-step">03 / ACT</span><h3>Know what to do. <span>Before time runs out.</span></h3></div><div className="mini-actions"><div><span className="mini-action-icon"><CalendarDays size={17} aria-hidden /></span><span><strong>Spend FSA balance</strong><small>Dec 31 deadline</small></span><b>$720</b></div><div><span className="mini-action-icon"><ArrowDownRight size={18} aria-hidden /></span><span><strong>Claim learning stipend</strong><small>Jan 31 deadline</small></span><b>$2,000</b></div></div></div>
      </div>
    </section>

    <section className="privacy-band" aria-labelledby="privacy-title" data-reveal><div className="privacy-inner"><div><LockKeyhole size={26} strokeWidth={1.5} aria-hidden /><h2 id="privacy-title">Your plan is yours.</h2></div><p>PDF read in memory, never stored.</p><p>Your numbers stay in your browser.</p><p>No account required.</p></div></section>
  </div>;
}
