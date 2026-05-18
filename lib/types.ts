export type Pet = {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  tagline: string;
  description: string;
  image_url: string;
  accent: string;
};

export type Choice = "yes" | "no" | "skip";

export type PetWithUserVote = Pet & {
  user_choice: Choice | null;
};

export type ResultRow = {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  tagline: string;
  image_url: string;
  accent: string;
  yes_count: number;
  no_count: number;
  skip_count: number;
  total_votes: number;
  yes_pct: number;
  divisiveness: number;
};

export type SortKey =
  | "most-loved"
  | "most-divisive"
  | "most-skipped"
  | "most-voted"
  | "least-loved";
