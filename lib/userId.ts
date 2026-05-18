const KEY = "pawvote.userId";
const NAME_KEY = "pawvote.displayName";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto as Crypto).randomUUID?.() ??
      `u_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function resetUserId(): string {
  if (typeof window === "undefined") return "";
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(NAME_KEY);
  return getUserId();
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim().slice(0, 40);
  if (trimmed) window.localStorage.setItem(NAME_KEY, trimmed);
  else window.localStorage.removeItem(NAME_KEY);
  void fetch("/api/identity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: getUserId(), displayName: trimmed || null }),
  }).catch(() => {});
}
