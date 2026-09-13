import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisDraft, ScanRecord } from "../types";
import * as storage from "../lib/scanStorage";
export type { ScanRecord } from "../types";

function legacyPreferences() {
  try {
    return (
      JSON.parse(localStorage.getItem(storage.LEGACY_STORAGE_KEY) || "{}")
        .state || {}
    );
  } catch {
    return {};
  }
}
function restoredDraft(): AnalysisDraft | null {
  try {
    return JSON.parse(sessionStorage.getItem("halalscan-draft") || "null");
  } catch {
    return null;
  }
}
const old = legacyPreferences();
let initialization: Promise<void> | null = null;
interface AppState {
  hasOnboarded: boolean;
  isDarkMode: boolean;
  language: string;
  madhab: string;
  scans: ScanRecord[];
  historyReady: boolean;
  storageError: string | null;
  draft: AnalysisDraft | null;
  busy: boolean;
  setHasOnboarded: (value: boolean) => void;
  toggleDarkMode: () => void;
  setLanguage: (value: string) => void;
  initialize: () => Promise<void>;
  reloadScans: () => Promise<void>;
  addScan: (scan: ScanRecord) => Promise<boolean>;
  deleteScan: (id: string) => Promise<boolean>;
  clearScans: () => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  setDraft: (draft: AnalysisDraft | null) => void;
  setBusy: (busy: boolean) => void;
  clearError: () => void;
  resetData: () => Promise<boolean>;
  getStats: () => {
    total: number;
    halal: number;
    haram: number;
    review: number;
  };
}
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const mutate = async (operation: () => Promise<void>) => {
        try {
          await get().initialize();
          if (!get().historyReady) throw new Error("History is unavailable.");
          await operation();
          await get().reloadScans();
          set({ storageError: null });
          return true;
        } catch {
          set({
            storageError:
              "Your change could not be saved on this device. Free up browser storage and try again.",
          });
          return false;
        }
      };
      return {
        hasOnboarded: old.hasOnboarded || false,
        isDarkMode: old.isDarkMode || false,
        language: old.language || "English",
        madhab: "General",
        scans: [],
        historyReady: false,
        storageError: null,
        draft: restoredDraft(),
        busy: false,
        setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
        toggleDarkMode: () =>
          set((state) => ({ isDarkMode: !state.isDarkMode })),
        setLanguage: (language) => set({ language }),
        setBusy: (busy) => set({ busy }),
        clearError: () => set({ storageError: null }),
        setDraft: (draft) => {
          set({ draft });
          try {
            if (draft)
              sessionStorage.setItem(
                "halalscan-draft",
                JSON.stringify({ ...draft, image: null }),
              );
            else sessionStorage.removeItem("halalscan-draft");
          } catch {
            /* the in-memory draft still works when session storage is unavailable */
          }
        },
        initialize: () => {
          if (!initialization)
            initialization = (async () => {
              try {
                await storage.migrateLegacyStorage(localStorage);
                await get().reloadScans();
              } catch {
                set({
                  storageError:
                    "Saved history could not be opened. Existing data has been kept. Enable browser storage and retry.",
                  historyReady: false,
                });
                initialization = null;
              }
            })();
          return initialization;
        },
        reloadScans: async () => {
          set({ scans: await storage.listScans(), historyReady: true });
        },
        addScan: (scan) => mutate(() => storage.saveScan(scan)),
        deleteScan: (id) => mutate(() => storage.removeScan(id)),
        toggleFavorite: (id) => mutate(() => storage.toggleScanFavorite(id)),
        clearScans: () => mutate(() => storage.clearScanStorage()),
        resetData: async () => {
          if (!(await get().clearScans())) return false;
          try {
            localStorage.removeItem(storage.LEGACY_STORAGE_KEY);
            sessionStorage.removeItem("halalscan-draft");
          } catch {
            set({
              storageError:
                "History cleared, but browser preferences could not be reset.",
            });
            return false;
          }
          set({
            hasOnboarded: false,
            isDarkMode: false,
            language: "English",
            draft: null,
          });
          return true;
        },
        getStats: () => {
          const scans = get().scans;
          return {
            total: scans.length,
            halal: scans.filter((s) => s.verdict === "HALAL COMPLIANT").length,
            haram: scans.filter((s) => s.verdict === "NON-COMPLIANT").length,
            review: scans.filter((s) => s.verdict === "REQUIRES REVIEW").length,
          };
        },
      };
    },
    {
      name: storage.PREFERENCES_KEY,
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        isDarkMode: state.isDarkMode,
        language: state.language,
      }),
    },
  ),
);
