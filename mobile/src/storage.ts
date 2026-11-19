import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseCatalogue, parseSaved } from './domain';
import type { Catalogue, SavedEntry } from './domain';
const CATALOGUE_KEY = '@indiagully/public-catalogue/v1';
const SAVED_KEY = '@indiagully/public-shortlist/v1';
export async function readCache(): Promise<Catalogue | null> {
  try { const value = await AsyncStorage.getItem(CATALOGUE_KEY); return value ? parseCatalogue(JSON.parse(value)) : null; } catch { return null; }
}
export async function readSaved(): Promise<SavedEntry[]> {
  const value = await AsyncStorage.getItem(SAVED_KEY);
  if (!value) return [];
  const raw = JSON.parse(value);
  if (!Array.isArray(raw)) throw new Error('Stored shortlist is invalid');
  const parsed = parseSaved(raw);
  if (parsed.length !== Math.min(raw.length, 250)) throw new Error('Stored shortlist is incomplete');
  return parsed;
}
export async function writeCache(feed: Catalogue): Promise<void> { await AsyncStorage.setItem(CATALOGUE_KEY, JSON.stringify(feed)); }
export async function writeSaved(saved: SavedEntry[]): Promise<void> { await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)); }
export async function clearPublicCache(): Promise<void> { await AsyncStorage.removeItem(CATALOGUE_KEY); }
