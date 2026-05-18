"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayName, setDisplayName } from "@/lib/userId";

export function IdentityChip() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(getDisplayName());
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(name);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, name]);

  const save = () => {
    setDisplayName(draft);
    setName(draft.trim());
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-stone-600 px-2 py-1 rounded-full hover:bg-stone-100"
        aria-label="Set your display name"
      >
        <span className="w-6 h-6 rounded-full bg-violet-200 text-violet-800 flex items-center justify-center font-bold text-[11px]">
          {name ? name.slice(0, 1).toUpperCase() : "?"}
        </span>
        <span className="hidden sm:inline">{name || "Sign in"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 12, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl"
            >
              <h3 className="font-bold text-lg">What should we call you?</h3>
              <p className="text-sm text-stone-600 mt-1">
                Optional. Your votes are already saved on this device. A name just makes the leaderboard friendlier.
              </p>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="e.g. Tanvi"
                maxLength={40}
                className="mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                {name && (
                  <button
                    onClick={() => {
                      setDisplayName("");
                      setName("");
                      setOpen(false);
                    }}
                    className="text-sm text-stone-500 px-3 py-2 rounded-full"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm text-stone-600 px-3 py-2 rounded-full"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="text-sm font-semibold text-white bg-stone-900 px-4 py-2 rounded-full"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
