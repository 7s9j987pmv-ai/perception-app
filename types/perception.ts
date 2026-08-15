export interface Trait {
  key: string;
  label: string;
  emoji: string;
  question: string;
  lo: string;
  hi: string;
}

export interface Profile {
  code: string;
  name: string;
  avatar: string;
  ageRange: string;
  gender: string;
  selfScores: Record<string, number>;
  createdAt: string;
}

export interface Response {
  id: string;
  scores: Record<string, number>;
  createdAt: string;
}

export interface PerceptionResults {
  responseCount: number;
  avgGap: number;
  traitResults: TraitResult[];
  blindSpot: TraitResult;
  positiveSurprise: TraitResult;
  youCalledIt: TraitResult;
  strongestTrait: TraitResult;
}

export interface TraitResult {
  trait: Trait;
  selfScore: number;
  avgOtherScore: number;
  diff: number; // others - self (positive = others rate higher)
  absDiff: number;
}
