import { openDB, type DBSchema } from 'idb';
import type { ScanRecord } from '../types';
import { decideVerdict, normalizeVerdict, verdictCopy } from '../../shared/verdict';

interface ScanDatabase extends DBSchema {
  scans: { key: string; value: ScanRecord };
  meta: { key: string; value: boolean };
}
export const LEGACY_STORAGE_KEY = 'halalscan-storage';
export const PREFERENCES_KEY = 'halalscan-preferences';
export const openScanDatabase = () => openDB<ScanDatabase>('halalscan-device', 1, {
  upgrade(db) { db.createObjectStore('scans', { keyPath: 'id' }); db.createObjectStore('meta'); },
});

export function migrateScan(value: any, index: number): ScanRecord {
  const originalVerdict = typeof value.verdict === 'string' ? value.verdict : 'UNKNOWN';
  const rows = Array.isArray(value.ingredient_results) ? value.ingredient_results.filter((row: any) => row && typeof row.ingredient === 'string' && typeof row.status === 'string') : [];
  const evidenceVerdict = decideVerdict(value.ingredients, rows);
  const verdict = normalizeVerdict(originalVerdict) === 'NON-COMPLIANT' || evidenceVerdict === 'NON-COMPLIANT'
    ? 'NON-COMPLIANT' : normalizeVerdict(originalVerdict) === 'REQUIRES REVIEW' ? 'REQUIRES REVIEW' : evidenceVerdict;
  return {
    ...value, id: String(value.id || `legacy-${index}`), name: String(value.name || 'Previous check'),
    date: typeof value.date === 'string' ? value.date : '', barcode: String(value.barcode || ''),
    brand: String(value.brand || ''), ingredients: String(value.ingredients || ''), image: value.image || null,
    verdict, originalVerdict, confidence: Number(value.confidence) || 0, ingredient_results: rows,
    flagged_ingredients: rows.filter((row: any) => row.status !== 'HALAL').map((row: any) => row.ingredient),
    ...verdictCopy[verdict], evidenceMode: 'historical', policyVersion: 2,
  };
}

export async function migrateLegacyStorage(storage: Pick<Storage, 'getItem' | 'setItem'>) {
  const db = await openScanDatabase();
  try {
    if (await db.get('meta', 'legacy-migrated')) return;
    const raw = storage.getItem(LEGACY_STORAGE_KEY);
    const legacy = raw ? JSON.parse(raw) : null;
    const scans = legacy?.state?.scans ?? [];
    if (!Array.isArray(scans) || scans.some(item => !item || typeof item !== 'object')) throw new Error('Previous history could not be read. The original data has been kept.');
    const tx = db.transaction(['scans', 'meta'], 'readwrite');
    for (let i = 0; i < scans.length; i++) {
      const scan = migrateScan(scans[i], i);
      if (!await tx.objectStore('scans').get(scan.id)) await tx.objectStore('scans').put(scan);
    }
    await tx.objectStore('meta').put(true, 'legacy-migrated');
    await tx.done;
    // Only remove the old copy after the IndexedDB transaction has committed.
    if (legacy?.state) {
      delete legacy.state.scans;
      try { storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy)); } catch { /* committed copy remains authoritative */ }
    }
  } finally { db.close(); }
}

export async function listScans(): Promise<ScanRecord[]> {
  const db = await openScanDatabase();
  try { return (await db.getAll('scans')).sort((a, b) => b.date.localeCompare(a.date)); }
  finally { db.close(); }
}
export async function saveScan(scan: ScanRecord) {
  const db = await openScanDatabase();
  try {
    const tx = db.transaction('scans', 'readwrite');
    const existing = await tx.store.get(scan.id);
    await tx.store.put({ ...scan, favorite: existing?.favorite ?? scan.favorite ?? false });
    await tx.done;
  } finally { db.close(); }
}
export async function removeScan(id: string) {
  const db = await openScanDatabase();
  try { await db.delete('scans', id); } finally { db.close(); }
}
export async function toggleScanFavorite(id: string) {
  const db = await openScanDatabase();
  try {
    const tx = db.transaction('scans', 'readwrite');
    const scan = await tx.store.get(id);
    if (!scan) throw new Error('This saved result no longer exists.');
    await tx.store.put({ ...scan, favorite: !scan.favorite });
    await tx.done;
  } finally { db.close(); }
}
export async function clearScanStorage() {
  const db = await openScanDatabase();
  try { await db.clear('scans'); } finally { db.close(); }
}
export function searchScans(scans: ScanRecord[], query: string, verdict = 'ALL', favorites = false) {
  const needle = query.trim().toLocaleLowerCase();
  return scans.filter(scan => (!favorites || scan.favorite) && (verdict === 'ALL' || scan.verdict === verdict)
    && [scan.name, scan.brand, scan.barcode, scan.ingredients].some(value => value.toLocaleLowerCase().includes(needle)));
}
