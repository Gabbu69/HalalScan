import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScanRecord {
  id: string;
  date: string;
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  ingredients: string;
  verdict: 'HALAL' | 'HARAM' | 'MASHBOOH';
  confidence: number;
  flagged_ingredients: string[];
  reason: string;
  recommendation: string;
  architectureDetails?: any;
}

interface AppState {
  hasOnboarded: boolean;
  isDarkMode: boolean;
  madhab: string;
  language: string;
  scans: ScanRecord[];
  pendingAnalysisImage: string | null;
  userLocation: { lat: number; lng: number } | null;
  locationPermissionStatus: 'prompt' | 'granted' | 'denied';
  userProfile: { name: string; email: string; avatar: string | null };

  
  setHasOnboarded: (val: boolean) => void;
  toggleDarkMode: () => void;
  setMadhab: (madhab: string) => void;
  setLanguage: (language: string) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setLocationPermissionStatus: (status: 'prompt' | 'granted' | 'denied') => void;
  updateUserProfile: (profile: Partial<{ name: string; email: string; avatar: string | null }>) => void;
  
  addScan: (scan: ScanRecord) => void;
  deleteScan: (id: string) => void;
  clearScans: () => void;
  setPendingAnalysisImage: (base64: string | null) => void;

  getStats: () => { total: number; halal: number; haram: number; mashbooh: number };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      isDarkMode: false,
      madhab: "Shafi'i",
      language: "English",
      scans: [],
      pendingAnalysisImage: null,
      userLocation: null,
      locationPermissionStatus: 'prompt',
      userProfile: { name: 'Guest User', email: 'guest@example.com', avatar: null },
      
      setHasOnboarded: (val: boolean) => set({ hasOnboarded: val }),
      toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.isDarkMode;
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newDarkMode };
      }),
      setMadhab: (madhab: string) => set({ madhab }),
      setLanguage: (language: string) => set({ language }),
      setUserLocation: (userLocation: { lat: number; lng: number } | null) => set({ userLocation }),
      setLocationPermissionStatus: (locationPermissionStatus: 'prompt' | 'granted' | 'denied') => set({ locationPermissionStatus }),
      updateUserProfile: (profile) => set((state) => ({ userProfile: { ...state.userProfile, ...profile } })),
      
      addScan: (scan) => set((state) => ({ 
        scans: [scan, ...state.scans] 
      })),
      deleteScan: (id) => set((state) => ({ 
        scans: state.scans.filter(s => s.id !== id) 
      })),
      clearScans: () => set({ scans: [] }),
      setPendingAnalysisImage: (base64) => set({ pendingAnalysisImage: base64 }),

      getStats: () => {
        const scans = get().scans;
        return {
          total: scans.length,
          halal: scans.filter(s => s.verdict === 'HALAL').length,
          haram: scans.filter(s => s.verdict === 'HARAM').length,
          mashbooh: scans.filter(s => s.verdict === 'MASHBOOH').length,
        };
      }
    }),
    {
      name: 'halalscan-storage',
      partialize: (state) => ({ 
        hasOnboarded: state.hasOnboarded,
        isDarkMode: state.isDarkMode,
        madhab: state.madhab,
        language: state.language,
        scans: state.scans,
        userProfile: state.userProfile
      }), // don't persist pending image
      onRehydrateStorage: () => (state) => {
        if (state?.isDarkMode) {
          document.documentElement.classList.add('dark');
        }
      }
    }
  )
);
