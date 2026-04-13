// components/ai/Assistant.tsx
// AI Assistant — Phase 2 placeholder
// Structure ready for: OpenAI Whisper (STT) + TTS
// No real API calls in MVP

"use client";

import { useState, useRef } from "react";

type AssistantState = "idle" | "listening" | "processing" | "speaking";

const STATE_LABELS: Record<AssistantState, string> = {
  idle:       "Ask Solar AI",
  listening:  "Listening…",
  processing: "Thinking…",
  speaking:   "Speaking…",
};

const MOCK_RESPONSES = [
  "Your effective tax rate across all scenarios is between 18% and 26%. The aggressive scenario saves you the most through higher expense deductions.",
  "You have 3 dependents qualifying for Child Tax Credit. At current income, you'll receive the full $2,000 per child.",
  "Your auto expense at 100% business use may trigger an audit flag. Consider splitting personal use.",
  "Based on your 1099-NEC income, your estimated SE tax is around $7,200. The deductible half reduces your AGI.",
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AssistantState>("idle");
  const [log, setLog] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // TODO Phase 2: Replace with real Whisper STT
  function handleMic() {
    if (state !== "idle") return;
    setState("listening");
    setTimeout(() => {
      setState("processing");
      setTimeout(() => {
        const mockQuestion = "What's my estimated tax liability?";
        const mockAnswer = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
        setLog((prev) => [
          ...prev,
          { role: "user", text: mockQuestion },
          { role: "ai",   text: mockAnswer },
        ]);
        setState("idle");
        scrollLog();
      }, 1200);
    }, 1500);
  }

  // TODO Phase 2: Replace with real AI call
  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || state !== "idle") return;
    const question = inputText.trim();
    setInputText("");
    setState("processing");
    setLog((prev) => [...prev, { role: "user", text: question }]);

    setTimeout(() => {
      const answer = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      setLog((prev) => [...prev, { role: "ai", text: answer }]);
      setState("idle");
      scrollLog();
    }, 900);
  }

  function scrollLog() {
    setTimeout(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl shadow-lg hover:bg-indigo-500 transition-colors"
        title="Solar AI Assistant"
        aria-label="Open AI Assistant"
      >
        {open ? "✕" : "✦"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-3 border-b border-gray-700">
            <span className="text-indigo-400 text-lg">✦</span>
            <div>
              <p className="text-xs font-semibold text-gray-100">Solar AI</p>
              <p className="text-xs text-gray-500">Phase 2 — Preview</p>
            </div>
            <span className="ml-auto rounded-full bg-yellow-900 px-2 py-0.5 text-xs text-yellow-400 font-medium">
              Placeholder
            </span>
          </div>

          {/* Log */}
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[160px] max-h-64"
          >
            {log.length === 0 && (
              <p className="text-xs text-gray-500 text-center pt-6">
                Ask about your tax scenarios, credits, or estimated liability.
                <br />
                <span className="text-yellow-500">(Responses are mocked in MVP)</span>
              </p>
            )}
            {log.map((entry, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-xs ${
                  entry.role === "user"
                    ? "bg-indigo-900 text-indigo-100 ml-6"
                    : "bg-gray-800 text-gray-200 mr-6"
                }`}
              >
                <span className="font-medium text-gray-400 text-xs block mb-0.5">
                  {entry.role === "user" ? "You" : "Solar AI"}
                </span>
                {entry.text}
              </div>
            ))}
            {state === "processing" && (
              <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 mr-6">
                <span className="animate-pulse">Thinking…</span>
              </div>
            )}
          </div>

          {/* State indicator */}
          {state === "listening" && (
            <div className="px-4 py-1.5 bg-red-900 text-red-300 text-xs font-medium text-center animate-pulse">
              🎤 Listening…
            </div>
          )}

          {/* Input row */}
          <div className="border-t border-gray-700 p-3">
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your taxes…"
                className="input flex-1 text-xs py-1.5"
                disabled={state !== "idle"}
              />
              <button
                type="button"
                onClick={handleMic}
                disabled={state !== "idle"}
                className="rounded-lg bg-gray-700 px-2.5 text-sm hover:bg-gray-600 transition-colors disabled:opacity-40"
                title="Voice input (placeholder)"
              >
                🎤
              </button>
              <button
                type="submit"
                disabled={state !== "idle" || !inputText.trim()}
                className="btn-primary py-1.5 px-3 text-xs"
              >
                →
              </button>
            </form>
            <p className="text-xs text-gray-600 mt-1.5 text-center">
              {/* TODO Phase 2: wire Whisper + OpenAI */}
              STT / TTS placeholder — real AI in v2
            </p>
          </div>
        </div>
      )}
    </>
  );
}
