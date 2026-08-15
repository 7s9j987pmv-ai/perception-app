import { Trait } from '@/types/perception';

export const TRAITS: Trait[] = [
  { key: 'confident', label: 'Confident', emoji: '💀', question: 'How CONFIDENT does {name} seem?', lo: 'Second-guessing everything', hi: 'Owns every room' },
  { key: 'approachable', label: 'Approachable', emoji: '😊', question: 'How APPROACHABLE does {name} seem?', lo: 'Do not disturb', hi: 'Strangers tell me their life story' },
  { key: 'funny', label: 'Funny', emoji: '😂', question: 'How FUNNY is {name}?', lo: 'Dad jokes only', hi: 'Should have a mic' },
  { key: 'intimidating', label: 'Intimidating', emoji: '🦷', question: 'How INTIMIDATING does {name} come across?', lo: 'Golden retriever', hi: 'Slightly terrifying' },
  { key: 'attractive', label: 'Attractive', emoji: '✨', question: 'How ATTRACTIVE does {name} come across?', lo: 'Easy to overlook', hi: 'Stops conversations' },
  { key: 'trustworthy', label: 'Trustworthy', emoji: '🤝', question: 'How TRUSTWORTHY does {name} seem?', lo: 'Ask me again later', hi: 'Would trust with my life' },
  { key: 'flirty', label: 'Flirty', emoji: '😉', question: 'How FLIRTY is {name}?', lo: 'Completely oblivious', hi: 'Could flirt with a wall' },
  { key: 'ambitious', label: 'Ambitious', emoji: '🔥', question: 'How AMBITIOUS does {name} seem?', lo: "We'll see what happens", hi: 'Already planning the empire' },
  { key: 'outgoing', label: 'Outgoing', emoji: '🎉', question: 'How OUTGOING is {name}?', lo: 'Homebody', hi: 'Talks to everyone at the party' },
  { key: 'mysterious', label: 'Mysterious', emoji: '🌙', question: 'How MYSTERIOUS is {name}?', lo: 'Open book', hi: "Nobody actually knows what I'm doing" },
];

export const SELF_TRAITS: Trait[] = [
  { key: 'confident', label: 'Confident', emoji: '💀', question: 'How CONFIDENT do you feel?', lo: 'Second-guessing everything', hi: 'Owns every room' },
  { key: 'approachable', label: 'Approachable', emoji: '😊', question: 'How APPROACHABLE are you?', lo: 'Do not disturb', hi: 'Strangers tell me their life story' },
  { key: 'funny', label: 'Funny', emoji: '😂', question: 'How FUNNY are you?', lo: 'Dad jokes only', hi: 'Should have a mic' },
  { key: 'intimidating', label: 'Intimidating', emoji: '🦷', question: 'How INTIMIDATING are you?', lo: 'Golden retriever', hi: 'Slightly terrifying' },
  { key: 'attractive', label: 'Attractive', emoji: '✨', question: 'How ATTRACTIVE do you feel?', lo: 'Easy to overlook', hi: 'Stops conversations' },
  { key: 'trustworthy', label: 'Trustworthy', emoji: '🤝', question: 'How TRUSTWORTHY are you?', lo: 'Ask me again later', hi: 'Would trust with my life' },
  { key: 'flirty', label: 'Flirty', emoji: '😉', question: 'How FLIRTY are you?', lo: 'Completely oblivious', hi: 'Could flirt with a wall' },
  { key: 'ambitious', label: 'Ambitious', emoji: '🔥', question: 'How AMBITIOUS are you?', lo: "We'll see what happens", hi: 'Already planning the empire' },
  { key: 'outgoing', label: 'Outgoing', emoji: '🎉', question: 'How OUTGOING are you?', lo: 'Homebody', hi: 'Talks to everyone at the party' },
  { key: 'mysterious', label: 'Mysterious', emoji: '🌙', question: 'How MYSTERIOUS are you?', lo: 'Open book', hi: "Nobody actually knows what I'm doing" },
];
