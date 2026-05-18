"use client";

import { useState } from "react";

const EMOJI: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  Rabbit: "🐰",
  Bird: "🦜",
  Hamster: "🐹",
  "Guinea Pig": "🐹",
  Ferret: "🦝",
  Hedgehog: "🦔",
  Rat: "🐀",
  Chinchilla: "🐭",
  Reptile: "🦎",
};

export function PetImage({
  src,
  alt,
  species,
  accent,
  className = "",
}: {
  src: string;
  alt: string;
  species: string;
  accent: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const emoji = EMOJI[species] ?? "🐾";

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center text-[8rem] ${className}`}
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, #ffffff 100%)`,
        }}
        aria-label={alt}
      >
        <span className="drop-shadow">{emoji}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ background: `linear-gradient(135deg, ${accent} 0%, #ffffff 100%)` }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading="lazy"
        onError={() => setErrored(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
