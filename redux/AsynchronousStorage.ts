// MMKVStorage.ts
import type { Storage } from 'redux-persist';
import { default as AStorage } from '@react-native-async-storage/async-storage';

// Adapter for redux-persist
export const AsynchronousStorage: Storage = {
  setItem: async (key, value) => {
    await AStorage.setItem(key, value);
  },
  getItem: async (key) => {
    const value = await AStorage.getItem(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: async (key) => {
    await AStorage.removeItem(key);
    return Promise.resolve();
  },
};
