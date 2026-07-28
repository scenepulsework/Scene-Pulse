import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'scenepulse.voterId';

let cached: string | null = null;

function generateId(): string {
  // RFC4122-ish random id without needing a crypto polyfill.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getVoterId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
    const id = generateId();
    await AsyncStorage.setItem(STORAGE_KEY, id);
    cached = id;
    return id;
  } catch {
    cached = cached ?? generateId();
    return cached;
  }
}
