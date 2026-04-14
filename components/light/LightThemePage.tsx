"use client";
// components/light/LightThemePage.tsx
// Pixel-perfect port of Asset Bilans / Solar ERP light landing

import { useEffect, useState } from "react";
import Link from "next/link";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.solar-light-root {
  --sun:        #E85500;
  --sun-bright: #F06A00;
  --sun-glow:   #FF8C2A;
  --sun-pale:   #FFB347;
  --sun-deep:   #C04400;
  --bg:         #FFFBF5;
  --bg2:        #FFF6EC;
  --surface:    #FFFFFF;
  --surface2:   #FFF8F0;
  --border:     #F0DEC8;
  --border2:    #E8CEAA;
  --text:       #2A1A08;
  --text2:      #7A4E28;
  --text3:      #B08060;
  --green:      #1A8A50;

  background: var(--bg);
  color: var(--text);
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* Sun rays background */
.solar-light-root::before {
  content: '';
  position: fixed;
  top: -30vh; left: 50%;
  transform: translateX(-50%);
  width: 160vw; height: 80vh;
  background: conic-gradient(
    from 270deg at 50% 0%,
    transparent 0deg, rgba(232,85,0,0.07) 8deg, transparent 16deg,
    rgba(232,85,0,0.05) 24deg, transparent 32deg,
    rgba(232,85,0,0.06) 40deg, transparent 48deg,
    rgba(232,85,0,0.04) 56deg, transparent 64deg,
    rgba(240,106,0,0.07) 72deg, transparent 80deg,
    rgba(232,85,0,0.05) 88deg, transparent 96deg,
    rgba(232,85,0,0.06) 104deg, transparent 112deg,
    rgba(232,85,0,0.04) 120deg, transparent 128deg,
    rgba(232,85,0,0.07) 136deg, transparent 144deg,
    rgba(240,106,0,0.05) 152deg, transparent 160deg,
    rgba(232,85,0,0.06) 168deg, transparent 176deg,
    rgba(232,85,0,0.04) 184deg, transparent 192deg
  );
  pointer-events: none; z-index: 0;
}
.solar-light-root::after {
  content: '';
  position: fixed;
  top: -20vh; left: 50%; transform: translateX(-50%);
  width: 700px; height: 420px;
  background: radial-gradient(ellipse at 50% 0%, rgba(232,85,0,0.10) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}

.sl-app { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; padding: 0 24px 80px; }

/* HEADER */
.sl-header {
  padding: 28px 0 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 60px;
  display: flex; align-items: center; justify-content: space-between;
  animation: slFadeDown .6s ease both;
}
@keyframes slFadeDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
@keyframes slFadeUp   { from { opacity:0; transform:translateY(16px)  } to { opacity:1; transform:translateY(0) } }
@keyframes slSpinSlow { from { transform:rotate(0) } to { transform:rotate(360deg) } }
@keyframes slBlink    { 0%,100%{opacity:1} 50%{opacity:.3} }

.sl-brand { display: flex; align-items: center; gap: 16px; }
.sl-brand-sun { position: relative; width: 48px; height: 48px; flex-shrink: 0; }
.sl-brand-sun svg { width: 100%; height: 100%; animation: slSpinSlow 20s linear infinite; }
.sl-brand-title h1 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--sun); letter-spacing: -.3px; line-height: 1; }
.sl-brand-title p  { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text3); margin-top: 4px; letter-spacing: .5px; }

.sl-nav { display: flex; align-items: center; gap: 20px; }
.sl-nav a { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text3); text-decoration: none; transition: color .2s; }
.sl-nav a:hover { color: var(--sun); }

.sl-badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 20px; padding: 5px 12px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: .3px; }
.sl-badge-sun { background: rgba(232,85,0,.08); border: 1px solid rgba(232,85,0,.2); color: var(--sun); }
.sl-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: slBlink 2s ease-in-out infinite; }

/* HERO */
.sl-hero {
  text-align: center;
  padding: 20px 0 64px;
  animation: slFadeUp .7s ease .1s both;
}
.sl-hero-tag {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
  color: var(--text3); text-transform: uppercase; letter-spacing: 1.2px;
  margin-bottom: 20px;
}
.sl-hero-tag::before, .sl-hero-tag::after { content: ''; width: 32px; height: 1px; background: var(--border2); }
.sl-hero h2 {
  font-family: 'Syne', sans-serif; font-size: clamp(36px, 6vw, 64px); font-weight: 800;
  color: var(--text); line-height: 1.05; letter-spacing: -1.5px;
  margin-bottom: 16px;
}
.sl-hero h2 span { color: var(--sun); }
.sl-hero p {
  font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--text3);
  line-height: 1.8; max-width: 560px; margin: 0 auto 36px;
}
.sl-hero-meta {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 8px; padding: 10px 18px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text3);
}
.sl-hero-meta strong { color: var(--text2); }

/* MODULES */
.sl-modules {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  margin-bottom: 48px;
  animation: slFadeUp .7s ease .2s both;
}
.sl-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 24px;
  text-decoration: none; color: inherit;
  position: relative; overflow: hidden;
  transition: all .25s cubic-bezier(.34,1.2,.64,1);
  display: flex; flex-direction: column; gap: 12px;
  cursor: pointer;
}
.sl-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--sun), var(--sun-glow));
  opacity: 0; transition: opacity .25s;
}
.sl-card:hover { border-color: var(--border2); transform: translateY(-4px); box-shadow: 0 12px 32px rgba(232,85,0,.10); }
.sl-card:hover::before { opacity: 1; }
.sl-card:hover .sl-arrow { opacity: 1; }

.sl-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(232,85,0,.08); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.sl-icon.green { background: rgba(26,138,80,.08); }
.sl-icon.blue  { background: rgba(0,100,200,.08); }
.sl-icon.gold  { background: rgba(184,120,0,.08); }

.sl-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; }
.sl-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); line-height: 1.2; }
.sl-desc  { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--text3); line-height: 1.7; flex: 1; }
.sl-arrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--sun); display: flex; align-items: center; gap: 4px; margin-top: 4px; opacity: 0; transition: opacity .2s; }

/* Featured card */
.sl-card.featured {
  grid-column: 1 / -1;
  flex-direction: row; align-items: center; gap: 24px;
  background: linear-gradient(135deg, var(--surface) 60%, rgba(232,85,0,.03));
}
.sl-featured-content { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.sl-cta {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--sun-glow), var(--sun-deep));
  border: none; border-radius: 8px; color: #fff;
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  padding: 12px 22px; letter-spacing: .2px;
  box-shadow: 0 4px 16px rgba(232,85,0,.25);
  white-space: nowrap; transition: all .2s;
  text-decoration: none; cursor: pointer;
}
.sl-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,85,0,.30); }

/* STATUS BAR */
.sl-statusbar {
  border-top: 1px solid var(--border);
  padding-top: 24px;
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
  font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text3);
  animation: slFadeUp .7s ease .35s both;
}
.sl-sb-item { display: flex; align-items: center; gap: 6px; }
.sl-sb-dot { width: 6px; height: 6px; border-radius: 50%; }
.sl-sb-dot.green  { background: var(--green); }
.sl-sb-dot.orange { background: var(--sun); }
.sl-sb-dot.gray   { background: var(--border2); }
.sl-sb-right { margin-left: auto; font-size: 9px; }

/* Theme toggle */
.sl-theme-toggle {
  position: fixed; bottom: 24px; right: 24px; z-index: 100;
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 24px; padding: 8px 16px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2);
  cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,.08);
  transition: all .2s; text-decoration: none;
}
.sl-theme-toggle:hover { border-color: var(--sun); color: var(--sun); }
`;

export function LightThemePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="solar-light-root">
        <div className="sl-app">

          {/* HEADER */}
          <header className="sl-header">
            <div className="sl-brand">
              <div className="sl-brand-sun">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" opacity="0.6">
                    <line x1="24" y1="2" x2="24" y2="7" />
                    <line x1="24" y1="41" x2="24" y2="46" />
                    <line x1="2" y1="24" x2="7" y2="24" />
                    <line x1="41" y1="24" x2="46" y2="24" />
                    <line x1="7.5" y1="7.5" x2="11" y2="11" />
                    <line x1="37" y1="37" x2="40.5" y2="40.5" />
                    <line x1="40.5" y1="7.5" x2="37" y2="11" />
                    <line x1="11" y1="37" x2="7.5" y2="40.5" />
                  </g>
                  <circle cx="24" cy="24" r="10" fill="url(#slsg)" />
                  <circle cx="24" cy="24" r="10" stroke="#FF8C2A" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <defs>
                    <radialGradient id="slsg" cx="40%" cy="35%" r="60%">
                      <stop offset="0%" stopColor="#FFD28F" />
                      <stop offset="50%" stopColor="#FF8C2A" />
                      <stop offset="100%" stopColor="#CC4A00" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
              <div className="sl-brand-title">
                <h1>Asset Bilans</h1>
                <p>SOLAR ERP · assetbilans.pl · Poland</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <nav className="sl-nav">
                <Link href="/dashboard">SolarTax US →</Link>
                <a href="https://assetbilans.pl/jpk/" target="_blank" rel="noopener">JPK VAT PL →</a>
              </nav>
              <div className="sl-badge sl-badge-sun">
                <div className="sl-badge-dot" />
                SOLAR ERP v0.1
              </div>
            </div>
          </header>

          {/* HERO */}
          <div className="sl-hero">
            <div className="sl-hero-tag">Solar ERP Development Project</div>
            <h2>Automatyzacja<br />podatków <span>i księgowości</span></h2>
            <p>
              Asset Bilans Sp. z o.o. buduje system SOLAR ERP — platformę do automatycznego
              przygotowania i składania deklaracji JPK_VAT do Urzędu Skarbowego.
            </p>
            <div className="sl-hero-meta">
              NIP: <strong>5252966590</strong> &nbsp;·&nbsp; Warszawa-Targówek &nbsp;·&nbsp;
              KodUrzędu: <strong>1438</strong>
            </div>
          </div>

          {/* MODULES */}
          <div className="sl-modules">

            {/* Featured — JPK */}
            <a className="sl-card featured" href="https://assetbilans.pl/jpk/" target="_blank" rel="noopener">
              <div className="sl-icon" style={{ width: 56, height: 56, fontSize: 24, flexShrink: 0 }}>☀</div>
              <div className="sl-featured-content">
                <div className="sl-label">Moduł gotowy · v0.1</div>
                <div className="sl-title" style={{ fontSize: 22 }}>Solar VAT Bridge</div>
                <div className="sl-desc" style={{ marginTop: 6 }}>
                  Generator JPK_V7M — wypełnij faktury sprzedaży i zakupów, wygeneruj poprawny
                  plik XML gotowy do podpisania i wysłania do e-Urząd Skarbowy.
                  Kompatybilny z XSD 1-0E, namespace ns2.
                </div>
              </div>
              <span className="sl-cta">⬇ Otwórz generator JPK</span>
            </a>

            {/* SolarTax US */}
            <Link className="sl-card" href="/dashboard">
              <div className="sl-icon" style={{ background: "rgba(99,102,241,.08)" }}>🇺🇸</div>
              <div className="sl-label">IRS 1040 · US Tax</div>
              <div className="sl-title">SolarTax Engine</div>
              <div className="sl-desc">
                Optymalizacja podatków federalnych USA. Self-employment, dependents,
                scenarios, fast filing. Vercel · Next.js · PostgreSQL.
              </div>
              <div className="sl-arrow">Przejdź →</div>
            </Link>

            {/* API */}
            <Link className="sl-card" href="/api/debug">
              <div className="sl-icon green">⚡</div>
              <div className="sl-label">REST API · v1</div>
              <div className="sl-title">SOLAR ERP API</div>
              <div className="sl-desc">
                Interfejs programistyczny do integracji z systemami zewnętrznymi.
                Endpointy JPK, VAT, IRS PDF, fakturowanie.
              </div>
              <div className="sl-arrow">Przejdź →</div>
            </Link>

            {/* Status */}
            <Link className="sl-card" href="/api/debug">
              <div className="sl-icon gold">📊</div>
              <div className="sl-label">Monitoring</div>
              <div className="sl-title">System Status</div>
              <div className="sl-desc">
                Stan serwisów SOLAR ERP w czasie rzeczywistym. DB, Prisma, engine,
                PDF generator, scenario runner.
              </div>
              <div className="sl-arrow">Przejdź →</div>
            </Link>

          </div>

          {/* STATUS BAR */}
          <div className="sl-statusbar">
            <div className="sl-sb-item"><div className="sl-sb-dot green" />solar-tax.vercel.app · online</div>
            <div className="sl-sb-item"><div className="sl-sb-dot green" />assetbilans.pl · online</div>
            <div className="sl-sb-item"><div className="sl-sb-dot orange" />JPK_V7M(2) · XSD 1-0E</div>
            <div className="sl-sb-item"><div className="sl-sb-dot green" />IRS 1040 · 2023–2025</div>
            <div className="sl-sb-item"><div className="sl-sb-dot green" />PostgreSQL · 207.154.220.86</div>
            <div className="sl-sb-right">
              Asset Bilans Sp. z o.o. · assetbilans@gmail.com · +48 732 080 955
            </div>
          </div>

        </div>

        {/* Theme toggle */}
        <Link className="sl-theme-toggle" href="/dashboard">
          🌙 Dark Mode →
        </Link>

      </div>
    </>
  );
}
