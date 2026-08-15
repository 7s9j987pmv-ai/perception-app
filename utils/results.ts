import { Profile, Response, PerceptionResults, TraitResult } from '@/types/perception';
import { TRAITS } from '@/constants/traits';

export function calculateResults(profile: Profile, responses: Response[]): PerceptionResults {
  console.log('[results] calculateResults', profile.code, responses.length);

  const traitResults: TraitResult[] = TRAITS.map((trait) => {
    const selfScore = profile.selfScores[trait.key] ?? 5;
    const otherScores = responses.map(r => r.scores[trait.key] ?? 5);
    const avgOtherScore = otherScores.length > 0
      ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length
      : selfScore;
    const diff = avgOtherScore - selfScore;
    const absDiff = Math.abs(diff);
    return { trait, selfScore, avgOtherScore, diff, absDiff };
  });

  const sorted = [...traitResults].sort((a, b) => b.absDiff - a.absDiff);
  const blindSpot = sorted[0];

  const positiveCandidates = traitResults.filter(t => t.diff > 0).sort((a, b) => b.diff - a.diff);
  const positiveSurprise = positiveCandidates[0] ?? sorted[0];

  const youCalledIt = [...traitResults].sort((a, b) => a.absDiff - b.absDiff)[0];

  const strongestTrait = [...traitResults].sort((a, b) => b.avgOtherScore - a.avgOtherScore)[0];

  const avgGap = traitResults.reduce((sum, t) => sum + t.absDiff, 0) / traitResults.length;

  return {
    responseCount: responses.length,
    avgGap,
    traitResults,
    blindSpot,
    positiveSurprise,
    youCalledIt,
    strongestTrait,
  };
}
