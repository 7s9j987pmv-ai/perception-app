import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'perception_device_id';

// Generate or retrieve a stable device ID (not tied to any personal info)
export async function getDeviceId(): Promise<string> {
  try {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      console.log('[fingerprint] generated new device id', id);
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    } else {
      console.log('[fingerprint] loaded existing device id', id);
    }
    return id;
  } catch {
    // Fallback for web
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      console.log('[fingerprint] generated new device id (web fallback)', id);
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    } else {
      console.log('[fingerprint] loaded existing device id (web fallback)', id);
    }
    return id!;
  }
}
