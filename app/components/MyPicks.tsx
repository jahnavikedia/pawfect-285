"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PetImage } from "./PetImage";
import { PetDetailModal } from "./PetDetailModal";
import { getUserId } from "@/lib/userId";
import type { Choice, Pet } from "@/lib/types";

const MATCH_THRESHOLD = 0.6;
const MATCH_MIN_VOTES = 2;

type MyVote = Pet & {
  user_choice: Choice;
  voted_at: number;
  yes_count: number;
  no_count: number;
  skip_count: number;
  total_votes: number;
  yes_rate: number;
};
type Counts = { yes: number; no: number; skip: number; total: number };
type Filter = "all" | Choice | "match";

const FILTERS: { key: Filter; label: string; emoji: string }[] = [
  { key: "all",   label: "All",     emoji: "🐾" },
  { key: "match", label: "Matches", emoji: "✨" },
  { key: "yes",   label: "Adopted", emoji: "♥" },
  { key: "no",    label: "Passed",  emoji: "✕" },
  { key: "skip",  label: "Skipped", emoji: "—" },
];

function isMatch(v: MyVote): boolean {
  return (
    v.user_choice === "yes" &&
    v.yes_count + v.no_count >= MATCH_MIN_VOTES &&
    v.yes_rate >= MATCH_THRESHOLD
  );
}

export function MyPicks() {
  const [votes, setVotes] = useState<MyVote[] | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [detailPetId, setDetailPetId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    const r = await fetch(`/api/my-votes?userId=${encodeURIComponent(userId)}`);
    const data = (await r.json()) as { votes: MyVote[]; counts: Counts };
    setVotes(data.votes);
    setCounts(data.counts);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const matchCount = useMemo(
    () => (votes ?? []).filter(isMatch).length,
    [votes],
  );

  const filtered = (votes ?? []).filter((v) => {
    if (filter === "all") return true;
    if (filter === "match") return isMatch(v);
    return v.user_choice === filter;
  });

  return (
    <div className="flex-1 w-full flex flex-col">
      <div className="px-4 pt-2 pb-3 border-b border-stone-200 bg-[#faf5ff] sticky top-[52px] z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">
            Your votes
          </p>
          <p className="text-xs text-stone-500">
            {counts ? `${counts.total} total` : ""}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
          {FILTERS.map((f) => {
            const n =
              f.key === "all"
                ? counts?.total ?? 0
                : f.key === "match"
                  ? matchCount
                  : (counts?.[f.key] ?? 0);
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full border font-medium ${
                  active
                    ? f.key === "match"
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-700 border-stone-200"
                }`}
              >
                <span className="mr-1">{f.emoji}</span>
                {f.label}
                <span className="ml-1.5 opacity-70">{n}</span>
              </button>
            );
          })}
        </div>

        {filter === "match" && (
          <p className="text-[11px] text-stone-500 mt-2 px-1">
            Pets you adopted that the community also loves (≥{Math.round(MATCH_THRESHOLD * 100)}% yes-rate, ≥{MATCH_MIN_VOTES} decisive votes).
          </p>
        )}
      </div>

      <div className="flex-1 scroll-y px-3 pt-3 pb-12">
        {votes == null ? (
          <div className="text-center text-stone-500 py-12">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <ul className="space-y-2">
            {filtered.map((v) => (
              <PickItem
                key={v.id}
                vote={v}
                onTap={() => setDetailPetId(v.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <PetDetailModal
        petId={detailPetId}
        onClose={() => setDetailPetId(null)}
        onVoted={() => void load()}
      />
    </div>
  );
}

function PickItem({ vote, onTap }: { vote: MyVote; onTap: () => void }) {
  const match = isMatch(vote);
  const badge =
    vote.user_choice === "yes"
      ? { text: "Adopted", cls: "bg-green-100 text-green-800 border-green-300" }
      : vote.user_choice === "no"
        ? { text: "Passed", cls: "bg-rose-100 text-rose-800 border-rose-300" }
        : { text: "Skipped", cls: "bg-stone-100 text-stone-700 border-stone-300" };
  return (
    <li>
      <button
        onClick={onTap}
        className={`w-full flex gap-3 p-3 rounded-2xl bg-white border text-left active:bg-stone-50 ${
          match ? "border-violet-300 ring-1 ring-violet-200" : "border-stone-200"
        }`}
      >
        <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden">
          <PetImage
            src={vote.image_url}
            alt={vote.name}
            species={vote.species}
            accent={vote.accent}
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold truncate flex items-center gap-1.5">
              {vote.name}
              {match && (
                <span className="text-violet-600 text-sm" title="Community also loves them">
                  ✨
                </span>
              )}
            </p>
            <span className={`shrink-0 text-[10px] uppercase tracking-wider font-bold border rounded-full px-2 py-0.5 ${badge.cls}`}>
              {badge.text}
            </span>
          </div>
          <p className="text-xs text-stone-500 truncate">
            {vote.species} · {vote.breed} · {vote.age}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-stone-600 line-clamp-1 flex-1 min-w-0">{vote.tagline}</p>
            {vote.yes_count + vote.no_count > 0 && (
              <span className="shrink-0 text-[10px] text-stone-500 font-medium">
                community {Math.round(vote.yes_rate * 100)}%
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const msg =
    filter === "yes"
      ? "You haven't adopted any pets yet."
      : filter === "no"
        ? "You haven't passed on any pets yet."
        : filter === "skip"
          ? "You haven't skipped any pets yet."
          : filter === "match"
            ? "No matches yet — keep voting! A match is a pet you adopted that the community also loves."
            : "You haven't voted on any pets yet.";
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">🐾</div>
      <p className="text-stone-600 max-w-xs mx-auto">{msg}</p>
      <p className="text-xs text-stone-500 mt-1">Head to the Vote tab to start.</p>
    </div>
  );
}
