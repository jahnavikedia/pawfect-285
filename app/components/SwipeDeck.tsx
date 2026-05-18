"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { PetDetailModal } from "./PetDetailModal";
import type { Choice, PetWithUserVote } from "@/lib/types";
import { getUserId } from "@/lib/userId";

type Props = {
  onShowResults: () => void;
  onProgress?: (voted: number, total: number) => void;
};

export function SwipeDeck({ onShowResults, onProgress }: Props) {
  const [pets, setPets] = useState<PetWithUserVote[] | null>(null);
  const [allCount, setAllCount] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [lastVote, setLastVote] = useState<{ petId: number; choice: Choice } | null>(null);
  const [detailPetId, setDetailPetId] = useState<number | null>(null);
  const activeSinceRef = useRef<number>(Date.now());

  useEffect(() => {
    const userId = getUserId();
    let cancelled = false;
    fetch(`/api/pets?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data: { pets: PetWithUserVote[] }) => {
        if (cancelled) return;
        setAllCount(data.pets.length);
        const unvoted = data.pets.filter((p) => p.user_choice == null);
        const shuffled = shuffle(unvoted);
        setPets(shuffled);
      })
      .catch((e) => setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const total = pets?.length ?? 0;
  const remaining = Math.max(0, total - index);
  const voted = index;

  useEffect(() => {
    onProgress?.(voted, total);
  }, [voted, total, onProgress]);

  useEffect(() => {
    activeSinceRef.current = Date.now();
  }, [index, pets]);

  const current = pets?.[index];
  const next    = pets?.[index + 1];
  const after   = pets?.[index + 2];

  const submit = useCallback(
    async (petId: number, choice: Choice, decisionMs: number) => {
      setPosting(true);
      try {
        await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ petId, userId: getUserId(), choice, decisionMs }),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setPosting(false);
      }
    },
    [],
  );

  const vote = useCallback(
    (choice: Choice) => {
      if (!current) return;
      const decisionMs = Date.now() - activeSinceRef.current;
      void submit(current.id, choice, decisionMs);
      setLastVote({ petId: current.id, choice });
      setIndex((i) => i + 1);
    },
    [current, submit],
  );

  const undo = useCallback(async () => {
    if (!lastVote) return;
    setPosting(true);
    try {
      await fetch(
        `/api/vote?userId=${encodeURIComponent(getUserId())}&petId=${lastVote.petId}`,
        { method: "DELETE" },
      );
      setIndex((i) => Math.max(0, i - 1));
      setLastVote(null);
    } finally {
      setPosting(false);
    }
  }, [lastVote]);

  if (error) {
    return <FallbackMessage title="Couldn't load pets" body={error} />;
  }
  if (!pets) {
    return <FallbackMessage title="Loading good boys & girls…" body="" />;
  }
  if (pets.length === 0) {
    if (allCount === 0) {
      return (
        <FallbackMessage
          title="No pets in the database yet"
          body="Run `npm run seed` to load the 103-pet starter set, then refresh."
        />
      );
    }
    return (
      <FallbackMessage
        title="You've voted on every pet!"
        body="Pull up the results tab to see what the community thinks."
        cta={{ label: "See Results", onClick: onShowResults }}
      />
    );
  }
  if (!current) {
    return (
      <FallbackMessage
        title="That's everyone!"
        body="Thanks for voting on every pet. Check out the aggregate results."
        cta={{ label: "See Results", onClick: onShowResults }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-between flex-1 w-full">
      <div className="w-full max-w-sm flex-1 relative">
        <div className="relative aspect-[3/4.4] w-full">
          {after && (
            <SwipeCard
              key={`after-${after.id}`}
              pet={after}
              depth={2}
              active={false}
              onVote={() => {}}
              onPullDown={() => {}}
            />
          )}
          {next && (
            <SwipeCard
              key={`next-${next.id}`}
              pet={next}
              depth={1}
              active={false}
              onVote={() => {}}
              onPullDown={() => {}}
            />
          )}
          <SwipeCard
            key={`current-${current.id}`}
            pet={current}
            depth={0}
            active={!posting}
            onVote={vote}
            onPullDown={onShowResults}
            onTap={() => setDetailPetId(current.id)}
          />
        </div>
      </div>

      <div className="w-full max-w-sm flex items-center justify-between gap-3 mt-5 px-1">
        <ActionButton
          ariaLabel="Pass"
          color="red"
          onClick={() => vote("no")}
          disabled={posting}
        >
          ✕
        </ActionButton>
        <button
          onClick={() => {
            if (!current) return;
            const decisionMs = Date.now() - activeSinceRef.current;
            void submit(current.id, "skip", decisionMs);
            setLastVote({ petId: current.id, choice: "skip" });
            setIndex((i) => i + 1);
          }}
          className="text-xs uppercase tracking-widest font-semibold text-stone-500 px-3 py-2 rounded-full hover:bg-stone-100 active:bg-stone-200"
        >
          Skip
        </button>
        <ActionButton
          ariaLabel="Adopt"
          color="green"
          onClick={() => vote("yes")}
          disabled={posting}
        >
          ♥
        </ActionButton>
      </div>

      <div className="h-9 mt-3 flex items-center justify-center">
        <AnimatePresence>
          {lastVote ? (
            <motion.button
              key="undo"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              onClick={undo}
              disabled={posting}
              className="text-xs font-semibold text-violet-700 bg-violet-100 border border-violet-300 px-3 py-1.5 rounded-full disabled:opacity-50"
            >
              ↶ Undo last {lastVote.choice === "yes" ? "adopt" : lastVote.choice === "no" ? "pass" : "skip"}
            </motion.button>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-stone-500"
            >
              {remaining} left · swipe → adopt · swipe ← pass · swipe ↓ for results
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <PetDetailModal
        petId={detailPetId}
        onClose={() => setDetailPetId(null)}
      />
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function ActionButton({
  children,
  onClick,
  ariaLabel,
  color,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  color: "red" | "green";
  disabled?: boolean;
}) {
  const palette =
    color === "red"
      ? "border-rose-300 text-rose-600 hover:bg-rose-50 active:bg-rose-100"
      : "border-green-300 text-green-600 hover:bg-green-50 active:bg-green-100";
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`w-16 h-16 rounded-full bg-white shadow-md border-2 text-3xl font-bold transition disabled:opacity-50 ${palette}`}
    >
      {children}
    </button>
  );
}

function FallbackMessage({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center text-center px-6">
      <div className="text-5xl mb-4">🐾</div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {body ? <p className="text-stone-600 mt-2">{body}</p> : null}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-5 px-5 py-2.5 rounded-full bg-stone-900 text-white font-medium"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
