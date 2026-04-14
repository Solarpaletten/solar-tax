"use client";
// components/theme/ThemeToggle.tsx
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      title={isLight ? "Switch to Dark" : "Switch to Light"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 14px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: .3,
        cursor: "pointer",
        border: isLight
          ? "1px solid rgba(99,102,241,0.3)"
          : "1px solid rgba(245,158,11,0.3)",
        background: isLight
          ? "rgba(99,102,241,0.08)"
          : "rgba(245,158,11,0.08)",
        color: isLight ? "#6366F1" : "#F59E0B",
        transition: "all .2s",
      }}
    >
      {isLight ? "🌙 Dark" : "☀ Light"}
    </button>
  );
}
