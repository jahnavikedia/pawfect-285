"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PetImage } from "./PetImage";
import { getUserId } from "@/lib/userId";
import type { Choice, Pet } from "@/lib/types";

type DetailRow = Pet & {
  yes_count: number;
  no_count: number;
  skip_count: number;
  total_votes: number;
  user_choice: Choice | null;
};

type Props = {
  petId: number | null;
  onClose: () => void;
  onVoted?: (petId: number, choice: Choice | null) => void;
};

export function PetDetailModal({ petId, onClose, onVoted }: Props) {
  const [data, setData] = useState<DetailRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (petId == null) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/pet/${petId}?userId=${encodeURIComponent(getUserId())}`)
      .then((r) => r.json())
      .then((d: { pet: DetailRow }) => setData(d.pet))
      .finally(() => setLoading(false));
  }, [petId]);

  useEffect(() => {
    if (petId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [petId, onClose]);

  async function vote(choice: Choice) {
    if (!data) return;
    setBusy(true);
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId: data.id, userId: getUserId(), choice }),
      });
      const next: DetailRow = {
        ...data,
        user_choice: choice,
        yes_count: data.yes_count + (choice === "yes" ? 1 : 0) - (data.user_choice === "yes" ? 1 : 0),
        no_count:  data.no_count  + (choice === "no"  ? 1 : 0) - (data.user_choice === "no"  ? 1 : 0),
        skip_count:data.skip_count+ (choice === "skip"? 1 : 0) - (data.user_choice === "skip"? 1 : 0),
        total_votes: data.total_votes + (data.user_choice == null ? 1 : 0),
      };
      setData(next);
      onVoted?.(data.id, choice);
    } finally {
      setBusy(false);
    }
  }

  async function clearVote() {
    if (!data || !data.user_choice) return;
    setBusy(true);
    try {
      await fetch(
        `/api/vote?userId=${encodeURIComponent(getUserId())}&petId=${data.id}`,
        { method: "DELETE" },
      );
      const prev = data.user_choice;
      const next: DetailRow = {
        ...data,
        user_choice: null,
        yes_count:  data.yes_count  - (prev === "yes"  ? 1 : 0),
        no_count:   data.no_count   - (prev === "no"   ? 1 : 0),
        skip_count: data.skip_count - (prev === "skip" ? 1 : 0),
        total_votes: data.total_votes - 1,
      };
      setData(next);
      onVoted?.(data.id, null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {petId != null && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92dvh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {loading || !data ? (
              <div className="p-10 text-center text-stone-500">Loading…</div>
            ) : (
              <>
                <div className="relative">
                  <PetImage
                    src={data.image_url}
                    alt={data.name}
                    species={data.species}
                    accent={data.accent}
                    className="w-full aspect-[4/3]"
                  />
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-stone-700 text-lg font-bold shadow-md"
                  >
                    ✕
                  </button>
                  {data.user_choice && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-xs font-semibold text-stone-700 shadow">
                      Your vote:{" "}
                      <span
                        className={
                          data.user_choice === "yes"
                            ? "text-green-700"
                            : data.user_choice === "no"
                              ? "text-rose-700"
                              : "text-stone-600"
                        }
                      >
                        {data.user_choice === "yes" ? "♥ Adopt" : data.user_choice === "no" ? "✕ Pass" : "Skipped"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 scroll-y flex-1">
                  <div className="flex items-end justify-between gap-2">
                    <h2 className="text-2xl font-bold leading-tight">{data.name}</h2>
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      {data.age}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 mt-0.5">
                    {data.species} · {data.breed}
                  </p>
                  <p className="text-base font-medium mt-3 text-stone-800">{data.tagline}</p>
                  <p className="text-sm text-stone-600 mt-2 leading-relaxed">{data.description}</p>

                  <div className="mt-5">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-stone-500 mb-1.5">
                      Community votes
                    </p>
                    <CommunityBar
                      yes={data.yes_count}
                      no={data.no_count}
                      skip={data.skip_count}
                    />
                    <p className="text-xs text-stone-600 mt-1.5">
                      <span className="text-green-700 font-semibold">{data.yes_count} adopt</span>
                      {" · "}
                      <span className="text-rose-700 font-semibold">{data.no_count} pass</span>
                      {data.skip_count > 0 && (
                        <>
                          {" · "}
                          <span className="text-stone-500">{data.skip_count} skip</span>
                        </>
                      )}
                      {" · "}
                      <span className="text-stone-500">{data.total_votes} total</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-stone-200 p-3 flex items-center gap-2 bg-white">
                  <ChoiceBtn
                    label="Pass"
                    glyph="✕"
                    active={data.user_choice === "no"}
                    color="rose"
                    disabled={busy}
                    onClick={() => vote("no")}
                  />
                  <ChoiceBtn
                    label="Skip"
                    glyph="—"
                    active={data.user_choice === "skip"}
                    color="stone"
                    disabled={busy}
                    onClick={() => vote("skip")}
                  />
                  <ChoiceBtn
                    label="Adopt"
                    glyph="♥"
                    active={data.user_choice === "yes"}
                    color="green"
                    disabled={busy}
                    onClick={() => vote("yes")}
                  />
                </div>
                {data.user_choice && (
                  <button
                    onClick={clearVote}
                    disabled={busy}
                    className="text-xs text-stone-500 underline underline-offset-2 pb-3 pt-1 self-center"
                  >
                    Clear my vote
                  </button>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommunityBar({ yes, no, skip }: { yes: number; no: number; skip: number }) {
  const total = yes + no + skip;
  if (total === 0) {
    return (
      <div className="h-3 rounded-full bg-stone-200 flex items-center justify-center text-[10px] text-stone-500">
        no votes yet
      </div>
    );
  }
  return (
    <div className="h-3 rounded-full bg-stone-200 overflow-hidden flex">
      <div className="h-full bg-green-500" style={{ width: `${(yes / total) * 100}%` }} />
      <div className="h-full bg-rose-400"  style={{ width: `${(no / total) * 100}%` }} />
      <div className="h-full bg-stone-400" style={{ width: `${(skip / total) * 100}%` }} />
    </div>
  );
}

function ChoiceBtn({
  label,
  glyph,
  active,
  color,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  active: boolean;
  color: "rose" | "stone" | "green";
  disabled?: boolean;
  onClick: () => void;
}) {
  const palette =
    color === "rose"
      ? active
        ? "bg-rose-500 text-white border-rose-500"
        : "bg-white text-rose-600 border-rose-300"
      : color === "green"
        ? active
          ? "bg-green-500 text-white border-green-500"
          : "bg-white text-green-600 border-green-300"
        : active
          ? "bg-stone-500 text-white border-stone-500"
          : "bg-white text-stone-600 border-stone-300";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 h-12 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${palette}`}
    >
      <span className="text-lg">{glyph}</span>
      {label}
    </button>
  );
}
