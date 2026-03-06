import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DetectionStore {
    enabled: boolean;
    softHarassmentEnabled: boolean;
    todayCount: number;
    toxicityScore: number;
    toggleEnabled: () => void;
    toggleSoftHarassment: () => void;
    incrementCount: () => void;
    updateToxicityScore: (score: number) => void;
    resetDailyCount: () => void;
}

// Custom storage adapter for Chrome extension storage API
const chromeStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            const result = await chrome.storage.local.get(name);
            return result[name] ?? null;
        } catch {
            // Fallback for non-extension context (e.g., testing)
            return localStorage.getItem(name);
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await chrome.storage.local.set({ [name]: value });
        } catch {
            localStorage.setItem(name, value);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            await chrome.storage.local.remove(name);
        } catch {
            localStorage.removeItem(name);
        }
    },
};

export const useDetectionStore = create<DetectionStore>()(
    persist(
        (set) => ({
            enabled: true,
            softHarassmentEnabled: false,
            todayCount: 0,
            toxicityScore: 0,

            toggleEnabled: () => set((state) => ({ enabled: !state.enabled })),

            toggleSoftHarassment: () => set((state) => ({ softHarassmentEnabled: !state.softHarassmentEnabled })),

            incrementCount: () => set((state) => ({
                todayCount: state.todayCount + 1
            })),

            updateToxicityScore: (score: number) => set({ toxicityScore: score }),

            resetDailyCount: () => set({ todayCount: 0 }),
        }),
        {
            name: 'creator-shield-detection-store',
            storage: createJSONStorage(() => chromeStorage),
        }
    )
);
