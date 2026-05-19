"use client";

import { useState, useCallback, useEffect } from "react";
import { SwipeDeck } from "./components/SwipeDeck";
import { Results } from "./components/Results";
import { MyPicks } from "./components/MyPicks";
import { IdentityChip } from "./components/IdentityChip";

type View = "vote" | "picks" | "results";

export default function Home() {
  const [view, setView] = useState<View>("vote");
  const [progress, setProgress] = useState<{ voted: number; total: number }>({
    voted: 0,
    total: 0,
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onProgress = useCallback((voted: number, total: number) => {
    setProgress({ voted, total });
  }, []);

  if (!mounted) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-5xl opacity-80">🐾</div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center w-full max-w-md mx-auto px-4">
      <header className="w-full h-[52px] flex items-center justify-between sticky top-0 bg-[#faf5ff] z-20 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-2xl">🐾</span>
          <h1 className="font-bold text-lg leading-none">
            Paw<span className="text-violet-600">Vote</span>
          </h1>
        </div>

        <nav className="flex items-center bg-white border border-stone-200 rounded-full p-1">
          <TabButton active={view === "vote"} onClick={() => setView("vote")}>
            Vote
          </TabButton>
          <TabButton active={view === "picks"} onClick={() => setView("picks")}>
            Picks
          </TabButton>
          <TabButton active={view === "results"} onClick={() => setView("results")}>
            Results
          </TabButton>
        </nav>

        <IdentityChip />
      </header>

      {view === "vote" && (
        <div className="flex flex-col items-center flex-1 w-full pt-3 pb-6">
          <div className="w-full max-w-sm h-1 rounded-full bg-stone-200 mb-3 overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{
                width:
                  progress.total > 0
                    ? `${Math.min(100, (progress.voted / progress.total) * 100)}%`
                    : "0%",
              }}
            />
          </div>
          <SwipeDeck
            onShowResults={() => setView("results")}
            onProgress={onProgress}
          />
        </div>
      )}

      {view === "picks"   && <MyPicks />}
      {view === "results" && <Results />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${
        active ? "bg-stone-900 text-white" : "text-stone-600"
      }`}
    >
      {children}
    </button>
  );
}
