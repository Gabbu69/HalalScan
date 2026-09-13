import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { deleteDB } from "idb";
import {
  migrateLegacyStorage,
  listScans,
  saveScan,
  toggleScanFavorite,
  removeScan,
  clearScanStorage,
  searchScans,
  LEGACY_STORAGE_KEY,
} from "../src/lib/scanStorage";
const legacy = (id: string, verdict = "HALAL", rows?: any[]) => ({
  id,
  date: "2026-09-13T08:00:00Z",
  name: "Rice crackers",
  brand: "Test pantry",
  barcode: "3017620422003",
  ingredients: "rice, salt",
  verdict,
  ingredient_results: rows,
});
const memoryStorage = (initial: any) => {
  const values = new Map([[LEGACY_STORAGE_KEY, JSON.stringify(initial)]]);
  return {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};
test("migration is atomic, conservative, idempotent, and survives deletion", async () => {
  await deleteDB("halalscan-device");
  const local = memoryStorage({
    state: {
      language: "Arabic",
      scans: [
        legacy("uncertain"),
        legacy("doubtful", "MASHBOOH"),
        legacy("known", "HALAL", [
          { ingredient: "rice", status: "HALAL" },
          { ingredient: "salt", status: "HALAL" },
        ]),
      ],
    },
  });
  await migrateLegacyStorage(local);
  let scans = await listScans();
  assert.equal(scans.length, 3);
  assert.equal(
    scans.find((s) => s.id === "uncertain")?.verdict,
    "REQUIRES REVIEW",
  );
  assert.equal(
    scans.find((s) => s.id === "doubtful")?.verdict,
    "REQUIRES REVIEW",
  );
  assert.equal(scans.find((s) => s.id === "known")?.verdict, "HALAL COMPLIANT");
  assert.equal(
    scans.find((s) => s.id === "uncertain")?.originalVerdict,
    "HALAL",
  );
  assert.equal(
    JSON.parse(local.getItem(LEGACY_STORAGE_KEY)!).state.language,
    "Arabic",
  );
  await migrateLegacyStorage(local);
  assert.equal((await listScans()).length, 3);
  const known = scans.find((s) => s.id === "known")!;
  await saveScan(known);
  assert.equal((await listScans()).length, 3);
  await toggleScanFavorite("known");
  await saveScan(known);
  assert.equal(
    (await listScans()).find((s) => s.id === "known")?.favorite,
    true,
  );
  scans = await listScans();
  assert.equal(searchScans(scans, "pantry", "ALL", true).length, 1);
  assert.equal(searchScans(scans, "301762", "REQUIRES REVIEW").length, 2);
  assert.equal(searchScans(scans, "salt").length, 3);
  await removeScan("known");
  await migrateLegacyStorage(local);
  assert.equal((await listScans()).length, 2);
  await clearScanStorage();
  await migrateLegacyStorage(local);
  assert.equal((await listScans()).length, 0);
});
test("failed migration preserves original data", async () => {
  await deleteDB("halalscan-device");
  const local = memoryStorage({ state: { scans: "broken" } });
  const raw = local.getItem(LEGACY_STORAGE_KEY);
  await assert.rejects(migrateLegacyStorage(local));
  assert.equal(local.getItem(LEGACY_STORAGE_KEY), raw);
  assert.deepEqual(await listScans(), []);
});
