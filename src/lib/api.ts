// Thin fetch wrapper for the campaign backend. In dev, Vite proxies /api to the
// server process; in production both sit behind the same origin. All calls are
// best-effort: the game itself never depends on the network.

const TOKEN_KEY = "campaign_token";
const USER_KEY = "campaign_user";
const GUEST_KEY = "campaign_guest_id";

export interface ApiUser {
  id: string;
  username: string;
  email: string;
}

export interface Unlocked {
  scenarioIds: string[];
  packIds: string[];
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch { return null; }
}

export function storeSession(token: string, user: ApiUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10).toUpperCase();
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch { return "LOCAL"; }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  register: (username: string, email: string, password: string) =>
    call<{ token: string; user: ApiUser }>("/api/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }),

  login: (email: string, password: string) =>
    call<{ token: string; user: ApiUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: () => call<{ user: ApiUser; unlocked: Unlocked }>("/api/auth/me"),

  activate: (code: string) =>
    call<{ scenarioId?: string; packId?: string; packName?: string; unlocked: Unlocked }>(
      "/api/auth/activate", { method: "POST", body: JSON.stringify({ code }) }),

  activations: () => call<{ unlocked: Unlocked }>("/api/auth/activations"),

  leaderboard: (scenarioId: string, difficulty?: string, limit = 20) =>
    call<{ entries: LeaderboardEntry[] }>(
      `/api/leaderboard?scenario=${encodeURIComponent(scenarioId)}${difficulty ? `&difficulty=${difficulty}` : ""}&limit=${limit}`),

  postScore: (submission: unknown) =>
    call<{ posted: boolean; personalBest: number; rank: number }>(
      "/api/leaderboard", { method: "POST", body: JSON.stringify(submission) }),

  myRankings: () => call<{ rankings: MyRanking[] }>("/api/leaderboard/me"),

  syncAchievements: (scenarioId: string, achievementIds: string[]) =>
    call<{ added: number }>("/api/achievements", { method: "POST", body: JSON.stringify({ scenarioId, achievementIds }) }),

  // ── Daily Challenge ──
  daily: () => call<DailyInfo>("/api/daily"),

  postDaily: (submission: unknown) =>
    call<{ posted: boolean; personalBest: number; rank: number; date: string }>(
      "/api/daily", { method: "POST", body: JSON.stringify(submission) }),

  dailyBoard: (date: string) =>
    call<DailyBoard>(`/api/daily/board?date=${encodeURIComponent(date)}`),
};

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  evMargin: number | null;
  popularVoteMargin: number | null;
  turnsPlayed: number | null;
  difficulty: string;
  finishedAt: number;
}

export interface DailyBoardEntry {
  rank: number;
  username: string;
  score: number;
  evMargin: number | null;
  popularVoteMargin: number | null;
  difficulty: string;
  finishedAt: number;
}

// GET /api/daily — the assignment (date/scenarioId/seed/role) plus display
// metadata and today's top 10.
export interface DailyInfo {
  date: string;
  scenarioId: string;
  seed: string;
  role: string;
  label: string;
  flag: string;
  board: DailyBoardEntry[];
}

export interface DailyBoard {
  date: string;
  scenarioId: string;
  entries: DailyBoardEntry[];
  me: { rank: number; score: number } | null;
}

export interface MyRanking {
  scenarioId: string;
  rank: number;
  score: number;
  difficulty: string;
  finishedAt: number;
}
