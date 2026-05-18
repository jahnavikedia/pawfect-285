"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PetImage } from "./PetImage";
import { getUserId, resetUserId } from "@/lib/userId";
import type { ResultRow, SortKey } from "@/lib/types";

const POLL_MS = 5000;

type Totals = { voters: number; votes: number; pets: number };
type SpeciesCount = { species: string; n: number };

const SORTS: { key: SortKey; label: string; hint: string }[] = [
  { key: "most-loved",    label: "Most loved",   hint: "Highest yes percentage" },
  { key: "most-divisive", label: "Most divisive", hint: "Closest yes/no split" },
  { key: "most-voted",    label: "Most voted",   hint: "Most total votes" },
  { key: "least-loved",   label: "Least loved",  hint: "Lowest yes percentage" },
  { key: "most-skipped",  label: "Most skipped", hint: "Most skip votes" },
];

export function Results() {
  const [sort, setSort] = useState<SortKey>("most-loved");
  const [species, setSpecies] = useState("All");
  const [rows, setRows] = useState<ResultRow[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [speciesList, setSpeciesList] = useState<SpeciesCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);
  const lastVoteCountRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d: { species: SpeciesCount[] }) => setSpeciesList(d.species))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const qs = new URLSearchParams({ sort, species });
      try {
        const r = await fetch(`/api/results?${qs}`, { cache: "no-store" });
        const d = (await r.json()) as { results: ResultRow[]; totals: Totals };
        if (cancelled) return;
        if (
          lastVoteCountRef.current != null &&
          d.totals.votes !== lastVoteCountRef.current
        ) {
          setPulse((p) => p + 1);
        }
        lastVoteCountRef.current = d.totals.votes;
        setRows(d.results);
        setTotals(d.totals);
      } catch {
        // swallow — next poll retries
      } finally {
        if (!cancelled) setLoading(false);
      }
      if (!cancelled && document.visibilityState !== "hidden") {
        timer = setTimeout(tick, POLL_MS);
      }
    };

    setLoading(true);
    lastVoteCountRef.current = null;
    void tick();

    const onVisible = () => {
      if (document.visibilityState !== "hidden" && !timer) {
        timer = setTimeout(tick, 0);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sort, species]);

  const headline = useMemo(() => {
    if (!totals) return "";
    const voters = totals.voters === 1 ? "1 voter" : `${totals.voters} voters`;
    const votes = totals.votes === 1 ? "1 vote" : `${totals.votes.toLocaleString()} votes`;
    return `${voters} · ${votes}`;
  }, [totals]);

  return (
    <div className="flex-1 w-full flex flex-col">
      <div className="px-4 pt-2 pb-3 border-b border-stone-200 bg-[#faf5ff] sticky top-[52px] z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <LivePulse trigger={pulse} />
            Community results
          </p>
          <p className="text-xs text-stone-500">{headline}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              title={s.hint}
              className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full border font-medium ${
                sort === s.key
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 mt-2 pb-1 no-scrollbar">
          <SpeciesChip
            label="All"
            count={speciesList.reduce((a, b) => a + b.n, 0)}
            active={species === "All"}
            onClick={() => setSpecies("All")}
          />
          {speciesList.map((s) => (
            <SpeciesChip
              key={s.species}
              label={s.species}
              count={s.n}
              active={species === s.species}
              onClick={() => setSpecies(s.species)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 scroll-y px-3 pt-3 pb-24">
        {loading && !rows ? (
          <div className="text-center text-stone-500 py-12">Loading results…</div>
        ) : rows && rows.length > 0 ? (
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <ResultItem key={r.id} rank={i + 1} row={r} sort={sort} />
            ))}
          </ol>
        ) : (
          <div className="text-center text-stone-500 py-12">No pets match that filter.</div>
        )}

        <div className="pt-8 text-center">
          <button
            onClick={() => {
              if (confirm("Reset all your votes? This clears your local voting history and starts you fresh.")) {
                resetUserId();
                location.reload();
              }
            }}
            className="text-xs text-stone-500 underline underline-offset-2"
          >
            Reset my votes
          </button>
          <p className="text-[10px] text-stone-400 mt-2">
            user id: <span className="font-mono">{getUserId().slice(0, 8)}…</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function LivePulse({ trigger }: { trigger: number }) {
  const [bright, setBright] = useState(false);
  useEffect(() => {
    if (trigger === 0) return;
    setBright(true);
    const id = setTimeout(() => setBright(false), 900);
    return () => clearTimeout(id);
  }, [trigger]);
  return (
    <span
      aria-label="live"
      className={`inline-block w-2 h-2 rounded-full transition-colors ${
        bright ? "bg-green-500" : "bg-green-400/50"
      }`}
      style={{
        boxShadow: bright ? "0 0 0 4px rgba(34,197,94,0.20)" : "none",
        transition: "box-shadow 600ms ease, background-color 200ms ease",
      }}
    />
  );
}

function SpeciesChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border ${
        active
          ? "bg-violet-100 border-violet-400 text-violet-900"
          : "bg-white border-stone-200 text-stone-600"
      }`}
    >
      {label} <span className="opacity-60">({count})</span>
    </button>
  );
}

function ResultItem({
  rank,
  row,
  sort,
}: {
  rank: number;
  row: ResultRow;
  sort: SortKey;
}) {
  const yesPct = Math.round((row.yes_pct ?? 0) * 100);
  const noPct  = 100 - yesPct;
  const decisive = row.yes_count + row.no_count;
  const hasVotes = row.total_votes > 0;

  return (
    <li className="flex gap-3 p-3 rounded-2xl bg-white border border-stone-200">
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden">
        <PetImage
          src={row.image_url}
          alt={row.name}
          species={row.species}
          accent={row.accent}
          className="w-full h-full"
        />
        <div className="absolute top-1 left-1 bg-stone-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          #{rank}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold truncate">{row.name}</p>
          <span className="text-[10px] uppercase tracking-wider text-stone-500 shrink-0">
            {row.species}
          </span>
        </div>
        <p className="text-xs text-stone-500 truncate">{row.breed} · {row.age}</p>

        {hasVotes ? (
          <>
            <div className="mt-2 h-2 rounded-full bg-stone-200 overflow-hidden flex">
              <div
                className="h-full bg-green-500"
                style={{ width: `${decisive ? yesPct : 0}%` }}
              />
              <div
                className="h-full bg-red-400"
                style={{ width: `${decisive ? noPct : 0}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-stone-600">
              <span>
                <span className="text-green-700 font-semibold">{row.yes_count} yes</span>
                {" · "}
                <span className="text-red-700 font-semibold">{row.no_count} no</span>
                {row.skip_count > 0 && (
                  <>
                    {" · "}
                    <span className="text-stone-500">{row.skip_count} skip</span>
                  </>
                )}
              </span>
              <span className="font-semibold">{decisive ? `${yesPct}%` : "—"}</span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-stone-400">No votes yet</p>
        )}

        <SortBadge sort={sort} row={row} />
      </div>
    </li>
  );
}

function SortBadge({ sort, row }: { sort: SortKey; row: ResultRow }) {
  if (sort === "most-divisive" && row.divisiveness > 0) {
    return (
      <p className="mt-1 text-[10px] uppercase tracking-wider text-violet-700">
        divisiveness score: {row.divisiveness}
      </p>
    );
  }
  if (sort === "most-skipped" && row.skip_count > 0) {
    return (
      <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-500">
        skipped {row.skip_count}×
      </p>
    );
  }
  return null;
}
