"use client";

import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "pawvote.adminToken";

type Analytics = {
  totals: {
    swipes: number;
    yes_swipes: number | null;
    no_swipes: number | null;
    skip_swipes: number | null;
    sessions: number;
    avg_decision_ms: number | null;
    total_pets: number;
  };
  per_species: {
    species: string;
    votes: number;
    yes_votes: number | null;
    decisive: number | null;
    yes_rate: number;
  }[];
  recent_voters: {
    user_id: string;
    display_name: string | null;
    first_seen: number;
    last_seen: number;
    vote_count: number;
  }[];
  top_loved: {
    id: number;
    name: string;
    species: string;
    yes: number;
    no: number;
  }[];
};

export default function AdminPage() {
  const [token, setToken] = useState<string>("");
  const [authed, setAuthed] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem(TOKEN_KEY) ?? "";
    if (t) {
      setToken(t);
      void tryAuth(t);
    }
  }, []);

  const tryAuth = useCallback(async (t: string) => {
    setLoadingAnalytics(true);
    setAuthError(null);
    try {
      const r = await fetch("/api/admin/analytics", {
        headers: { "x-admin-token": t },
        cache: "no-store",
      });
      if (r.status === 401) {
        setAuthed(false);
        setAuthError("That token didn't work.");
        return;
      }
      const data = (await r.json()) as Analytics;
      setAnalytics(data);
      setAuthed(true);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (token) void tryAuth(token);
  }, [token, tryAuth]);

  const onSubmitToken = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tokenDraft.trim();
    if (!t) return;
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    void tryAuth(t);
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setAuthed(false);
    setAnalytics(null);
    setTokenDraft("");
  };

  if (!authed) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={onSubmitToken}
          className="w-full max-w-sm bg-white rounded-2xl shadow p-6 border border-stone-200"
        >
          <h1 className="text-xl font-bold">Admin sign-in</h1>
          <p className="text-sm text-stone-600 mt-1">
            Enter the admin token to manage pets and view analytics.
          </p>
          <input
            type="password"
            autoFocus
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
            placeholder="admin token"
            className="mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          {authError && (
            <p className="text-sm text-rose-600 mt-2">{authError}</p>
          )}
          <button
            type="submit"
            disabled={loadingAnalytics}
            className="mt-4 w-full bg-stone-900 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {loadingAnalytics ? "Checking…" : "Sign in"}
          </button>
          <p className="text-[11px] text-stone-500 mt-3">
            Default token is <code className="bg-stone-100 px-1 rounded">letmein</code> unless{" "}
            <code className="bg-stone-100 px-1 rounded">ADMIN_TOKEN</code> is set.
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">PawVote admin</h1>
          <p className="text-xs text-stone-500">analytics + pet management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="text-sm font-medium px-3 py-1.5 rounded-full bg-white border border-stone-200"
          >
            ↻ Refresh
          </button>
          <button
            onClick={logout}
            className="text-sm font-medium px-3 py-1.5 rounded-full bg-stone-900 text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      {analytics && <AnalyticsPanel a={analytics} />}

      <AddPetForm token={token} onAdded={refresh} />
    </main>
  );
}

function AnalyticsPanel({ a }: { a: Analytics }) {
  const t = a.totals;
  return (
    <section className="space-y-4 mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Total swipes"  value={t.swipes.toLocaleString()} />
        <Stat label="Sessions"      value={t.sessions.toLocaleString()} />
        <Stat label="Pets"          value={t.total_pets.toLocaleString()} />
        <Stat
          label="Avg decision"
          value={
            t.avg_decision_ms != null
              ? `${(t.avg_decision_ms / 1000).toFixed(1)}s`
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label="Yes"  value={t.yes_swipes ?? 0}  color="text-green-700" />
        <Mini label="No"   value={t.no_swipes ?? 0}   color="text-rose-700" />
        <Mini label="Skip" value={t.skip_swipes ?? 0} color="text-stone-600" />
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-1.5">
          By species
        </h2>
        <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
          {a.per_species.map((s) => (
            <div key={s.species} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="font-medium">{s.species}</span>
              <span className="text-stone-500">
                {s.votes} votes ·{" "}
                <span className={s.yes_rate >= 0.5 ? "text-green-700" : "text-rose-700"}>
                  {(s.decisive ?? 0) > 0 ? `${Math.round(s.yes_rate * 100)}% yes` : "no data"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {a.top_loved.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-1.5">
            Top 5 most loved
          </h2>
          <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
            {a.top_loved.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  <span className="font-bold text-stone-400 mr-2">#{i + 1}</span>
                  <span className="font-medium">{p.name}</span>{" "}
                  <span className="text-stone-500">· {p.species}</span>
                </span>
                <span className="text-xs text-stone-500">
                  <span className="text-green-700 font-semibold">{p.yes}</span>
                  {" / "}
                  <span className="text-rose-700 font-semibold">{p.no}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-1.5">
          Recent voters
        </h2>
        <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
          {a.recent_voters.length === 0 ? (
            <p className="px-3 py-3 text-sm text-stone-500">No voters yet.</p>
          ) : (
            a.recent_voters.map((u) => (
              <div key={u.user_id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{u.display_name || "anonymous"}</span>{" "}
                  <span className="text-stone-400 font-mono text-[10px]">
                    ({u.user_id.slice(0, 8)})
                  </span>
                </span>
                <span className="text-xs text-stone-500">
                  {u.vote_count} votes · {timeAgo(u.last_seen)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function AddPetForm({ token, onAdded }: { token: string; onAdded: () => void }) {
  const [form, setForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    age: "",
    tagline: "",
    description: "",
    image_url: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const upd = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error ?? "Failed to add pet.");
      } else {
        setMsg(`Added ${form.name} (#${data.id}).`);
        setForm({
          name: "",
          species: form.species,
          breed: "",
          age: "",
          tagline: "",
          description: "",
          image_url: "",
        });
        onAdded();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-1.5">
        Add a pet
      </h2>
      <form
        onSubmit={submit}
        className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3"
      >
        <div className="grid grid-cols-2 gap-2">
          <Field label="Name" value={form.name} onChange={(v) => upd("name", v)} required />
          <Field
            label="Species"
            value={form.species}
            onChange={(v) => upd("species", v)}
            required
          />
          <Field label="Breed" value={form.breed} onChange={(v) => upd("breed", v)} required />
          <Field
            label="Age"
            value={form.age}
            onChange={(v) => upd("age", v)}
            required
            placeholder="3 yrs"
          />
        </div>
        <Field
          label="Tagline"
          value={form.tagline}
          onChange={(v) => upd("tagline", v)}
          required
          placeholder="A short, charming one-liner"
        />
        <Field
          label="Description"
          value={form.description}
          onChange={(v) => upd("description", v)}
          required
          multiline
          placeholder="2–3 sentences about personality, care needs, etc."
        />
        <Field
          label="Image URL (optional)"
          value={form.image_url}
          onChange={(v) => upd("image_url", v)}
          placeholder="Leave blank to auto-generate from loremflickr"
        />

        {err && <p className="text-sm text-rose-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-stone-900 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add pet"}
        </button>
      </form>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl px-3 py-3">
      <p className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
        {label}
      </p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl px-3 py-2">
      <p className={`text-lg font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-[10px] uppercase tracking-widest text-stone-500">{label}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          rows={3}
          className="mt-0.5 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="mt-0.5 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      )}
    </label>
  );
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
