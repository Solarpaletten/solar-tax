// app/page.tsx  v2 — public landing page
// Goal: user understands product in <10 seconds, clicks demo.
import Link from "next/link";
import { loadDemo } from "@/actions/demo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* NAV */}
      <nav className="border-b border-gray-900 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-indigo-400 tracking-wide">☀ Solar Tax Engine</span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300">Dashboard</Link>
          <form action={loadDemo}>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Try demo →
            </button>
          </form>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-800 bg-indigo-950/60 px-4 py-1.5 text-xs font-medium text-indigo-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Pre-deadline tax optimization
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          Optimize your taxes<br />
          <span className="text-indigo-400">before you file.</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-xl mx-auto">
          See what to change before December 31 — and how it affects your refund, audit risk, and profit.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <form action={loadDemo}>
            <button type="submit" className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30">
              Try demo in one click →
            </button>
          </form>
          <Link href="/dashboard" className="rounded-xl border border-gray-700 bg-gray-900 px-8 py-4 text-base font-medium text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors text-center">
            Use my data →
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-600">No signup required · Takes 30 seconds</p>
      </section>

      {/* VALUE BULLETS */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon:"⚡", text:"Compare 3 tax scenarios instantly",       sub:"Conservative, Balanced, Aggressive — side by side" },
            { icon:"🛡", text:"Understand audit risk before filing",     sub:"Rule-based flags, not guesswork" },
            { icon:"✓",  text:"Get clear actions — not just numbers",   sub:"What to do now, before Dec 31, at filing" },
          ].map((item) => (
            <div key={item.text} className="rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-5">
              <div className="text-2xl mb-3">{item.icon}</div>
              <p className="text-sm font-semibold text-gray-100 mb-1">{item.text}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO BLOCK */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-indigo-800 bg-indigo-950/40 px-8 py-10 text-center">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Live demo</p>
          <p className="text-2xl font-bold text-white mb-2">
            See how a real family saves <span className="text-green-400">$2,219</span> in 30 seconds.
          </p>
          <p className="text-sm text-gray-400 mb-6">Pre-loaded household. No data entry. Just the outcome.</p>
          <form action={loadDemo}>
            <button type="submit" className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-500 transition-colors">
              Run demo →
            </button>
          </form>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-semibold text-gray-100 mb-6 text-center">How it works</h2>
        <div className="space-y-0 divide-y divide-gray-800 rounded-2xl border border-gray-800 overflow-hidden">
          {[
            { n:"1", title:"Enter your income and expenses",                                    desc:"1099-NEC, W-2, business expenses. Takes 5 minutes." },
            { n:"2", title:"Compare Conservative, Balanced, and Aggressive scenarios",         desc:"Profit, SE tax, taxable income, credits, refund — simultaneously, in real-time." },
            { n:"3", title:"See what to change — before year-end",                            desc:"What to adjust, why it matters, and what it saves." },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-5 px-6 py-5 bg-gray-900/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-400">{step.n}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-100 mb-0.5">{step.title}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="max-w-2xl mx-auto px-6 pb-16 text-center">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-8 py-8">
          <p className="text-lg font-semibold text-gray-200 mb-2">No guesswork. No hidden assumptions.</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Every recommendation is rule-based and explainable — you see why each suggestion was made,
            what to change, and what it saves.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-5">
            {["Real IRS brackets 2023–2025","Zero AI hallucinations","PDF export for your accountant"].map((t) => (
              <span key={t} className="text-xs text-gray-600 flex items-center gap-1">
                <span className="text-green-500">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* VS TABLE */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-semibold text-gray-100 mb-6 text-center">Solar vs the alternatives</h2>
        <div className="rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">TurboTax</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">H&R Block</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-indigo-400">Solar ☀</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[
                ["Scenario simulation",        "✗","✗","✓"],
                ["Pre-deadline optimization",   "✗","✗","✓"],
                ["Audit risk before filing",    "✗","✗","✓"],
                ["Explainable recommendations", "✗","✗","✓"],
                ["Guided tax filing",           "✓","✓","V2 →"],
                ["Price",                       "$79–$139/yr","$35–$85/yr","$0–$79/yr"],
              ].map(([feat,tt,hrb,sol]) => (
                <tr key={feat} className="bg-gray-900/40 hover:bg-gray-900/70 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-400">{feat}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">{tt}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">{hrb}</td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-green-400">{sol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Start optimizing your taxes today.</h2>
        <p className="text-sm text-gray-500 mb-8">Free to start. No credit card. No filing required.</p>
        <form action={loadDemo}>
          <button type="submit" className="rounded-xl bg-indigo-600 px-10 py-4 text-base font-semibold text-white hover:bg-indigo-500 transition-colors">
            Try demo →
          </button>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-900 px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-700">
          <span>☀ Solar Tax Engine · Project 43</span>
          <span>For planning purposes only. Not tax advice.</span>
        </div>
      </footer>
    </div>
  );
}
