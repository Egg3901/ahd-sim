import { create } from "zustand";
import { api, ApiError, clearSession, getStoredUser, getToken, storeSession, type ApiUser, type Unlocked } from "@lib/api";
import { isFreeScenario } from "@content/scenarioRegistry";

interface AuthStore {
  user: ApiUser | null;
  unlocked: Unlocked;
  // Which auth modal is open, if any. `paywallScenarioId` remembers the locked
  // scenario the user clicked so we can resume after login/activation.
  modal: "login" | "register" | "activate" | null;
  paywallScenarioId: string | null;
  serverDown: boolean;

  openModal: (m: AuthStore["modal"], paywallScenarioId?: string | null) => void;
  closeModal: () => void;

  login: (email: string, password: string) => Promise<string | null>;
  register: (username: string, email: string, password: string) => Promise<string | null>;
  activate: (code: string) => Promise<{ error?: string; packName?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;

  canPlay: (scenarioId: string) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: getStoredUser(),
  unlocked: { scenarioIds: [], packIds: [] },
  modal: null,
  paywallScenarioId: null,
  serverDown: false,

  openModal: (m, paywallScenarioId = null) => set({ modal: m, paywallScenarioId }),
  closeModal: () => set({ modal: null, paywallScenarioId: null }),

  login: async (email, password) => {
    try {
      const { token, user } = await api.login(email, password);
      storeSession(token, user);
      set({ user });
      await get().refresh();
      return null;
    } catch (e) {
      return e instanceof ApiError ? e.message : "Could not reach the server";
    }
  },

  register: async (username, email, password) => {
    try {
      const { token, user } = await api.register(username, email, password);
      storeSession(token, user);
      set({ user });
      return null;
    } catch (e) {
      return e instanceof ApiError ? e.message : "Could not reach the server";
    }
  },

  activate: async (code) => {
    try {
      const out = await api.activate(code);
      set({ unlocked: out.unlocked });
      return { packName: out.packName };
    } catch (e) {
      return { error: e instanceof ApiError ? e.message : "Could not reach the server" };
    }
  },

  logout: () => {
    clearSession();
    set({ user: null, unlocked: { scenarioIds: [], packIds: [] } });
  },

  refresh: async () => {
    if (!getToken()) return;
    try {
      const { user, unlocked } = await api.me();
      set({ user, unlocked, serverDown: false });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
        set({ user: null, unlocked: { scenarioIds: [], packIds: [] } });
      } else {
        set({ serverDown: true });
      }
    }
  },

  canPlay: (scenarioId) => {
    if (isFreeScenario(scenarioId)) return true;
    return get().unlocked.scenarioIds.includes(scenarioId);
  },
}));

// Restore entitlements once on module load (fire-and-forget).
void useAuthStore.getState().refresh();
