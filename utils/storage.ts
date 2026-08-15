import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, Response } from '@/types/perception';
import {
  apiCreateProfile,
  apiGetProfile,
  apiSubmitResponse,
  apiGetResponseCount,
  apiGetAggregatedResults,
  PublicProfile,
} from '@/utils/api';
import { getDeviceId } from '@/utils/fingerprint';

const PROFILE_KEY = 'perception_profile';
const RESPONSES_KEY = (code: string) => `perception_responses_${code}`;
const PROFILE_BY_CODE_KEY = (code: string) => `perception_profile_code_${code}`;

// ─── Creator profile (local SecureStore cache) ────────────────────────────────

export async function saveProfile(profile: Profile): Promise<{ success: boolean; error?: string }> {
  console.log('[storage] saveProfile', profile.code, profile.name);
  const json = JSON.stringify(profile);
  // Save locally first (fast, works offline)
  try {
    await SecureStore.setItemAsync(PROFILE_KEY, json);
  } catch {
    await AsyncStorage.setItem(PROFILE_KEY, json);
  }
  // Also store by code for same-device backward compat
  await AsyncStorage.setItem(PROFILE_BY_CODE_KEY(profile.code), json);

  // Sync to Supabase
  console.log('[storage] syncing profile to Supabase', profile.code);
  const result = await apiCreateProfile({
    code: profile.code,
    name: profile.name,
    avatar: profile.avatar,
    ageRange: profile.ageRange,
    gender: profile.gender,
    selfScores: profile.selfScores,
  });
  if (!result.success) {
    console.warn('[storage] Supabase sync failed', result.error);
    return { success: false, error: result.error ?? 'Failed to sync to server' };
  }
  console.log('[storage] profile synced to Supabase successfully');
  return { success: true };
}

export async function loadProfile(): Promise<Profile | null> {
  console.log('[storage] loadProfile');
  try {
    const json = await SecureStore.getItemAsync(PROFILE_KEY);
    if (!json) {
      console.log('[storage] loadProfile: no profile found (first run)');
      return null;
    }
    return JSON.parse(json) as Profile;
  } catch {
    // SecureStore may throw on web — fall back to AsyncStorage
    try {
      const json = await AsyncStorage.getItem(PROFILE_KEY);
      if (!json) return null;
      return JSON.parse(json) as Profile;
    } catch {
      return null;
    }
  }
}

// ─── Public profile by code (cross-device via Supabase) ──────────────────────

export async function loadProfileByCode(code: string): Promise<PublicProfile | null> {
  console.log('[storage] loadProfileByCode', code);

  // Primary: Supabase (cross-device, authoritative)
  try {
    const { profile, error } = await apiGetProfile(code);
    if (profile) {
      console.log('[storage] loadProfileByCode: found in Supabase', code);
      return profile;
    }
    if (error === 'not_found') {
      // Code genuinely doesn't exist — skip retry and fallback
      console.log('[storage] loadProfileByCode: not found in Supabase', code);
    } else if (error) {
      // Network/server error — retry once after 1s
      console.warn('[storage] loadProfileByCode Supabase error, retrying...', error);
      await new Promise(r => setTimeout(r, 1000));
      const retry = await apiGetProfile(code);
      if (retry.profile) {
        console.log('[storage] loadProfileByCode: found in Supabase on retry', code);
        return retry.profile;
      }
      if (retry.error === 'not_found') {
        console.log('[storage] loadProfileByCode: not found in Supabase (retry)', code);
        return null;
      }
    }
  } catch (e) {
    console.warn('[storage] loadProfileByCode Supabase exception', e);
  }

  // Fallback: same-device local storage (backward compat / offline)
  try {
    const json = await AsyncStorage.getItem(PROFILE_BY_CODE_KEY(code));
    if (json) {
      console.log('[storage] loadProfileByCode: found in local storage (fallback)', code);
      return JSON.parse(json) as PublicProfile;
    }
  } catch (e) {
    console.warn('[storage] loadProfileByCode local fallback error', e);
  }

  return null;
}

// ─── Responses (Supabase only) ────────────────────────────────────────────────

export async function saveResponse(
  code: string,
  scores: Record<string, number>,
): Promise<{ success: boolean; responseCount: number; error?: string }> {
  console.log('[storage] saveResponse', code);
  const fingerprint = await getDeviceId();
  const result = await apiSubmitResponse(code, scores, fingerprint);
  if (result.error) {
    console.warn('[storage] saveResponse error', result.error);
    return { success: false, responseCount: 0, error: result.error };
  }
  console.log('[storage] saveResponse success, count', result.responseCount);
  return { success: true, responseCount: result.responseCount ?? 0 };
}

export async function loadResponseCount(code: string): Promise<number> {
  console.log('[storage] loadResponseCount', code);
  return apiGetResponseCount(code);
}

export async function loadAggregatedResults(
  code: string,
): Promise<{ results: any; profile: any } | null> {
  console.log('[storage] loadAggregatedResults', code);
  const data = await apiGetAggregatedResults(code);
  if (data.error) {
    console.warn('[storage] loadAggregatedResults error', data.error);
    return null;
  }
  return { results: data.results, profile: data.profile };
}

// ─── Backward compat (kept for any remaining callers) ────────────────────────

export async function loadResponses(code: string): Promise<Response[]> {
  console.log('[storage] loadResponses (legacy, returns empty)', code);
  try {
    const json = await AsyncStorage.getItem(RESPONSES_KEY(code));
    if (!json) return [];
    return JSON.parse(json) as Response[];
  } catch {
    return [];
  }
}

export async function clearAll(): Promise<void> {
  console.log('[storage] clearAll');
  try {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  } catch { /* web */ }
  const keys = await AsyncStorage.getAllKeys();
  const perceptionKeys = keys.filter(k => k.startsWith('perception_'));
  if (perceptionKeys.length > 0) {
    await Promise.all(perceptionKeys.map(k => AsyncStorage.removeItem(k)));
  }
}
