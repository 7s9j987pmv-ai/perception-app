export function getBlindSpotInsight(traitKey: string, diff: number): string {
  // diff > 0 means others rate higher than self
  const insights: Record<string, { higher: string; lower: string }> = {
    intimidating: { higher: "you're a little more intimidating than you realised", lower: "you come off way less intimidating than you think" },
    approachable: { higher: "people find you way more approachable than you give yourself credit for", lower: "you might be coming across a bit more guarded than you think" },
    confident: { higher: "you're reading as more confident than you feel", lower: "you're more visibly unsure than you let on" },
    funny: { higher: "you're funnier than you think you are", lower: "your humor is landing quieter than you expect" },
    attractive: { higher: "people rate your look higher than you do", lower: "you might be underselling how put-together you come across" },
    trustworthy: { higher: "people trust you faster than you'd guess", lower: "trust takes people a little longer to give you than you assume" },
    flirty: { higher: "you're giving off more flirty energy than you know", lower: "you're reading as less flirty than you think" },
    ambitious: { higher: "people clock your ambition before you even say anything", lower: "your drive isn't as visible to others as it is to you" },
    outgoing: { higher: "you seem far more outgoing than you feel on the inside", lower: "you might be more of a wallflower to others than you realise" },
    mysterious: { higher: "people find you harder to read than you expect", lower: "you're an open book, even when you think you're being subtle" },
  };
  return insights[traitKey]?.[diff > 0 ? 'higher' : 'lower'] ?? '';
}
