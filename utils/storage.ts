import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, Response } from '@/types/perception';

const PROFILE_KEY = 'perception_profile';
const RESPONSES_KEY = (code: string) => `perception_responses_${code}`;
const PROFILE_BY_CODE_KEY = (code: string) => `perception_profile_code_${code}`;

export async function saveProfile(profile: Profile): Promise<void> {
  console.log('[storage] saveProfile', profile.code, profile.name);
  const json = JSON.stringify(profile);
  await SecureStore.setItemAsync(PROFILE_KEY, json);
  // Also store by code so raters on same device can find it
  await AsyncStorage.setItem(PROFILE_BY_CODE_KEY(profile.code), json);
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
  } catch (e) {
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

export async function loadProfileByCode(code: string): Promise<Profile | null> {
  console.log('[storage] loadProfileByCode', code);
  try {
    const json = await AsyncStorage.getItem(PROFILE_BY_CODE_KEY(code));
    if (!json) return null;
    return JSON.parse(json) as Profile;
  } catch (e) {
    console.warn('[storage] loadProfileByCode error', e);
    return null;
  }
}

export async function saveResponse(code: string, response: Response): Promise<void> {
  console.log('[storage] saveResponse', code, response.id);
  const existing = await loadResponses(code);
  existing.push(response);
  await AsyncStorage.setItem(RESPONSES_KEY(code), JSON.stringify(existing));
}

export async function loadResponses(code: string): Promise<Response[]> {
  console.log('[storage] loadResponses', code);
  try {
    const json = await AsyncStorage.getItem(RESPONSES_KEY(code));
    if (!json) return [];
    return JSON.parse(json) as Response[];
  } catch (e) {
    console.warn('[storage] loadResponses error', e);
    return [];
  }
}

export async function clearAll(): Promise<void> {
  console.log('[storage] clearAll');
  await SecureStore.deleteItemAsync(PROFILE_KEY);
  const keys = await AsyncStorage.getAllKeys();
  const perceptionKeys = keys.filter(k => k.startsWith('perception_'));
  if (perceptionKeys.length > 0) {
    await AsyncStorage.multiRemove(perceptionKeys);
  }
}
