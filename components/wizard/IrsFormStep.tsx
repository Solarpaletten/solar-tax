"use client";
// components/wizard/IrsFormStep.tsx
// Universal IRS form step for wizard.
// Each form gets: blue header, part sections, live line rows, summary bar. s

interface FormLine {
  num:       string;
  label:     string;
  value:     string | number;
  formula?:  string;
  bold?:     boolean;
  highlight?: boolean;
  red?:      boolean;
  green?:    boolean;
  sub?:      boolean;
}

interface FormPart {
  title: string;
  lines: FormLine[];
}

interface SummaryItem {
  label: string;
  value: string | number;
  color?: "red" | "green" | "blue" | "muted";
}

interface Props {
  formNumber: string;
  title:      string;
  year:       number;
  partI?:     FormPart;
  partII?:    FormPart;
  partIII?:   FormPart;
  note?:      string;
  summary?:   SummaryItem[];
}

export function IrsFormStep({ formNumber, title, year, partI, partII, partIII, note, summary }: Props) {

  const C = {
    blue:    "#1a3a6b",
    red:     "var(--solar-red, #dc2626)",
    green:   "var(--solar-green, #16a34a)",
    muted:   "var(--solar-muted, #6b7280)",
    border:  "var(--solar-border, #e5e7eb)",
    label:   "var(--solar-text, #111827)",
    surface: "var(--solar-surface, #f9fafb)",
    sun:     "var(--solar-sun, #c45400)",
    bg:      "var(--solar-bg, #fff)",
  };

  const Line = ({ line }: { line: FormLine }) => (
    <div style={{
      display:        "flex",
      alignItems:     "baseline",
      padding:        line.sub ? "4px 16px 4px 32px" : "8px 16px",
      borderBottom:   `1px solid ${C.border}`,
      background:     line.highlight ? "rgba(26,58,107,0.04)" : "transparent",
    }}>
      <span style={{ width: 30, fontSize: 10, fontWeight: 700, color: C.sun, flexShrink: 0 }}>
        {line.num}
      </span>
      <span style={{ flex: 1, fontSize: line.sub ? 11 : 12, color: C.label, lineHeight: 1.5 }}>
        {line.label}
        {line.formula && (
          <span style={{ marginLeft: 8, fontSize: 9, color: "#9ca3af", fontFamily: "monospace" }}>
            = {line.formula}
          </span>
        )}
      </span>
      {line.value !== "" && (
        <span style={{
          fontSize:    line.bold ? 14 : 12,
          fontWeight:  line.bold ? 800 : 600,
          color:       line.red   ? C.red
                     : line.green ? C.green
                     : line.highlight ? C.blue
                     : C.label,
          fontFamily:  "monospace",
          minWidth:    90,
          textAlign:   "right",
        }}>
          {line.value}
        </span>
      )}
    </div>
  );

  const Part = ({ part }: { part: FormPart }) => (
    <div style={{ marginBottom: 2 }}>
      <div style={{
        padding:     "8px 16px",
        background:  C.blue,
        color:       "#fff",
        fontSize:    9,
        fontWeight:  700,
        letterSpacing: 0.8,
        textTransform: "uppercase",
      }}>
        {part.title}
      </div>
      {part.lines.map((l, i) => <Line key={i} line={l} />)}
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* IRS Form header */}
      <div style={{
        border:       `1px solid ${C.border}`,
        borderRadius: 10,
        overflow:     "hidden",
        marginBottom: 16,
      }}>
        {/* Blue header band */}
        <div style={{
          background: C.blue, padding: "14px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: -0.3 }}>
              {formNumber}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
              {title}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
              Department of the Treasury · IRS
            </div>
            <div style={{
              marginTop: 4, padding: "3px 8px",
              background: "rgba(196,84,0,0.55)", borderRadius: 4,
              fontSize: 10, fontWeight: 700, color: "#fff",
            }}>
              Tax Year {year}
            </div>
          </div>
        </div>

        {/* Parts */}
        <div style={{ background: C.surface }}>
          {partI   && <Part part={partI} />}
          {partII  && <Part part={partII} />}
          {partIII && <Part part={partIII} />}
        </div>

        {/* Note */}
        {note && (
          <div style={{
            padding:      "9px 16px",
            background:   "rgba(26,58,107,0.04)",
            borderTop:    `1px solid ${C.border}`,
            fontSize:     11,
            color:        C.muted,
            lineHeight:   1.6,
            fontStyle:    "italic",
          }}>
            ℹ {note}
          </div>
        )}
      </div>

      {/* Summary bar */}
      {summary && summary.length > 0 && (
        <div style={{
          display:       "flex",
          gap:           12,
          flexWrap:      "wrap",
          padding:       "12px 16px",
          background:    C.surface,
          border:        `1px solid ${C.border}`,
          borderRadius:  10,
          marginBottom:  16,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, alignSelf: "center" }}>
            Flows to →
          </span>
          {summary.map((s, i) => (
            <div key={i} style={{
              padding:      "4px 12px",
              borderRadius: 20,
              background:   s.color === "red"   ? "rgba(220,38,38,0.08)"
                          : s.color === "green" ? "rgba(22,163,74,0.08)"
                          : s.color === "blue"  ? "rgba(26,58,107,0.08)"
                          : "rgba(0,0,0,0.04)",
              border:       `1px solid ${
                s.color === "red"   ? "rgba(220,38,38,0.2)"
              : s.color === "green" ? "rgba(22,163,74,0.2)"
              : s.color === "blue"  ? "rgba(26,58,107,0.2)"
              : C.border}`,
            }}>
              <span style={{ fontSize: 10, color: C.muted }}>{s.label}: </span>
              <span style={{
                fontSize:   12,
                fontWeight: 700,
                fontFamily: "monospace",
                color:      s.color === "red"   ? C.red
                          : s.color === "green" ? C.green
                          : s.color === "blue"  ? C.blue
                          : C.muted,
              }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
