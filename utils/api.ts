import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/supabase';
import { Profile, PerceptionResults, Trait, TraitResult } from '@/types/perception';
import { TRAITS } from '@/constants/traits';

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export interface PublicProfile {
  code: string;
  name: string;
  avatar: string;
  ageRange: string;
  gender: string;
}

async function callFunction(name: string, options: RequestInit = {}): Promise<any> {
  const url = `${FUNCTIONS_URL}/${name}`;
  console.log('[api] callFunction', options.method ?? 'GET', url);
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn('[api] callFunction error', res.status, text);
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* not json */ }
    return parsed ?? { error: text || `HTTP ${res.status}` };
  }
  const json = await res.json();
  console.log('[api] callFunction response', name, JSON.stringify(json).slice(0, 200));
  return json;
}

// Create a profile in Supabase
export async function apiCreateProfile(profile: {
  code: string;
  name: string;
  avatar: string;
  ageRange: string;
  gender: string;
  selfScores: Record<string, number>;
}): Promise<{ success: boolean; profile?: any; error?: string }> {
  console.log('[api] apiCreateProfile', profile.code, profile.name);
  try {
    const result = await callFunction('create-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    if (result?.error) {
      console.warn('[api] apiCreateProfile error', result.error);
      return { success: false, error: result.error };
    }
    return { success: true, profile: result.profile ?? result };
  } catch (e: any) {
    console.error('[api] apiCreateProfile exception', e?.message);
    return { success: false, error: e?.message ?? 'Network error' };
  }
}

// Get a public profile by code (for raters — no selfScores)
export async function apiGetProfile(code: string): Promise<{ profile?: PublicProfile; error?: string }> {
  console.log('[api] apiGetProfile', code);
  try {
    const result = await callFunction(`get-profile?code=${encodeURIComponent(code)}`);
    if (result?.error) {
      console.warn('[api] apiGetProfile error', result.error);
      return { error: result.error };
    }
    return { profile: result.profile as PublicProfile };
  } catch (e: any) {
    console.error('[api] apiGetProfile exception', e?.message);
    return { error: e?.message ?? 'Network error' };
  }
}

// Submit a response (anonymous rating)
export async function apiSubmitResponse(
  profileCode: string,
  scores: Record<string, number>,
  respondentFingerprint: string,
): Promise<{ success?: boolean; responseCount?: number; error?: string }> {
  console.log('[api] apiSubmitResponse', profileCode, respondentFingerprint);
  try {
    const result = await callFunction('submit-response', {
      method: 'POST',
      body: JSON.stringify({ profileCode, scores, respondentFingerprint }),
    });
    if (result?.error) {
      console.warn('[api] apiSubmitResponse error', result.error);
      return { error: result.error };
    }
    return { success: true, responseCount: result?.responseCount };
  } catch (e: any) {
    console.error('[api] apiSubmitResponse exception', e?.message);
    return { error: e?.message ?? 'Network error' };
  }
}

// Get response count for a profile
export async function apiGetResponseCount(code: string): Promise<number> {
  console.log('[api] apiGetResponseCount', code);
  try {
    const result = await callFunction(`get-response-count?code=${encodeURIComponent(code)}`);
    const count = result?.count ?? result?.responseCount ?? 0;
    console.log('[api] apiGetResponseCount result', count);
    return Number(count);
  } catch (e: any) {
    console.error('[api] apiGetResponseCount exception', e?.message);
    return 0;
  }
}

// Get aggregated results (only works if count >= 3)
export async function apiGetAggregatedResults(code: string): Promise<{
  profile?: any;
  results?: any;
  error?: string;
  count?: number;
}> {
  console.log('[api] apiGetAggregatedResults', code);
  try {
    const result = await callFunction(`get-aggregated-results?code=${encodeURIComponent(code)}`);
    if (result?.error) {
      console.warn('[api] apiGetAggregatedResults error', result.error);
      return { error: result.error };
    }
    return result;
  } catch (e: any) {
    console.error('[api] apiGetAggregatedResults exception', e?.message);
    return { error: e?.message ?? 'Network error' };
  }
}

// Map API results shape to local PerceptionResults type
export function mapApiResults(apiResults: any, profile: Profile): PerceptionResults {
  const mapOne = (tr: any): TraitResult => {
    const trait = TRAITS.find((t: Trait) => t.key === tr.traitKey) ?? TRAITS[0];
    return {
      trait,
      selfScore: tr.selfScore,
      avgOtherScore: tr.avgOtherScore,
      diff: tr.diff,
      absDiff: tr.absDiff,
    };
  };

  const traitResults: TraitResult[] = (apiResults.traitResults ?? []).map(mapOne);

  return {
    responseCount: apiResults.responseCount,
    avgGap: apiResults.avgGap,
    traitResults,
    blindSpot: mapOne(apiResults.blindSpot),
    positiveSurprise: mapOne(apiResults.positiveSurprise),
    youCalledIt: mapOne(apiResults.youCalledIt),
    strongestTrait: mapOne(apiResults.strongestTrait),
  };
}
