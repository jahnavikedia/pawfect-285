"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import { useEffect } from "react";
import { PetImage } from "./PetImage";
import type { Pet, Choice } from "@/lib/types";

const SWIPE_X = 110;
const SWIPE_Y = 140;
const FLY = 600;

type Props = {
  pet: Pet;
  depth: number;
  active: boolean;
  onVote: (choice: Exclude<Choice, "skip">) => void;
  onPullDown: () => void;
  onTap?: () => void;
};

function depthOffset(d: number) {
  return { scale: 1 - d * 0.05, y: d * 12 };
}

export function SwipeCard({ pet, depth, active, onVote, onPullDown, onTap }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate     = useTransform(x, [-220, 0, 220], [-18, 0, 18]);
  const yesOpacity = useTransform(x, [40, 140], [0, 1]);
  const noOpacity  = useTransform(x, [-140, -40], [1, 0]);
  const pullHint   = useTransform(y, [40, 160], [0, 1]);

  useEffect(() => {
    if (active) {
      animate(x, 0, { duration: 0.2 });
      animate(y, 0, { duration: 0.2 });
    }
  }, [active, pet.id, x, y]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const dx = info.offset.x;
    const dy = info.offset.y;
    const vx = info.velocity.x;

    if (dy > SWIPE_Y && Math.abs(dy) > Math.abs(dx)) {
      animate(y, 400, { duration: 0.25 });
      onPullDown();
      return;
    }
    if (dx > SWIPE_X || vx > 700) {
      animate(x, FLY,  { duration: 0.3 });
      animate(y, 0,    { duration: 0.3 });
      onVote("yes");
      return;
    }
    if (dx < -SWIPE_X || vx < -700) {
      animate(x, -FLY, { duration: 0.3 });
      animate(y, 0,    { duration: 0.3 });
      onVote("no");
      return;
    }
    animate(x, 0, { type: "spring", stiffness: 320, damping: 26 });
    animate(y, 0, { type: "spring", stiffness: 320, damping: 26 });
  }

  const target = depthOffset(depth);
  const enterFrom = depthOffset(depth + 1);

  return (
    <motion.div
      initial={enterFrom}
      animate={target}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      style={{ zIndex: 10 - depth }}
      className="absolute inset-0"
    >
      <motion.div
        drag={active}
        dragDirectionLock
        dragElastic={0.18}
        onDragEnd={handleDragEnd}
        onTap={active && onTap ? onTap : undefined}
        whileTap={{ cursor: "grabbing" }}
        style={{
          x: active ? x : 0,
          y: active ? y : 0,
          rotate: active ? rotate : 0,
        }}
        className={`absolute inset-0 select-none no-select rounded-3xl bg-white shadow-xl ring-1 ring-stone-200/80 overflow-hidden ${
          active ? "cursor-grab" : ""
        }`}
      >
        <PetImage
          src={pet.image_url}
          alt={`${pet.name}, ${pet.breed}`}
          species={pet.species}
          accent={pet.accent}
          className="w-full h-[58%]"
        />
        {active && onTap && (
          <div className="pointer-events-none absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] tracking-wide font-semibold backdrop-blur-sm">
            tap for details
          </div>
        )}

        <div className="p-5 h-[42%] flex flex-col">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-bold leading-tight">{pet.name}</h2>
            <span className="text-xs uppercase tracking-wide text-stone-500">
              {pet.age}
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-0.5">
            {pet.species} · {pet.breed}
          </p>
          <p className="text-base font-medium mt-2 text-stone-800">{pet.tagline}</p>
          <p className="text-sm text-stone-600 mt-2 leading-snug line-clamp-3">
            {pet.description}
          </p>
        </div>

        {active && (
          <>
            <motion.div
              style={{ opacity: yesOpacity }}
              className="pointer-events-none absolute top-6 left-6 rotate-[-12deg] px-3 py-1.5 rounded-lg border-4 border-green-500 text-green-600 font-extrabold tracking-widest text-xl bg-white/70 backdrop-blur"
            >
              ADOPT
            </motion.div>
            <motion.div
              style={{ opacity: noOpacity }}
              className="pointer-events-none absolute top-6 right-6 rotate-[12deg] px-3 py-1.5 rounded-lg border-4 border-red-500 text-red-600 font-extrabold tracking-widest text-xl bg-white/70 backdrop-blur"
            >
              PASS
            </motion.div>
            <motion.div
              style={{ opacity: pullHint }}
              className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full border-2 border-stone-700 text-stone-700 font-semibold tracking-wide text-sm bg-white/80 backdrop-blur"
            >
              ↓ Pull to see results
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
