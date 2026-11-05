import { APP_CONFIG } from "@/config/app";
import { clearToken, readToken } from "@/lib/authToken";
import { parseErrorBody } from "@/lib/utils";
import type {
  AdminAssetItem,
  AdminLedgerItem,
  AdminOverviewStats,
  AdminProjectItem,
  AdminUser,
  AITestRequest,
  AITestResponse,
  AuthResponse,
  ExportLog,
  Project,
  ProjectConfig,
  Scene,
  Stage,
  StylePack,
  SystemSettingsPayload,
  User,
  Voice
} from "@/types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildUrl(path: string): string {
  const base = APP_CONFIG.apiBaseUrl.replace(/\/$/, "");
  return `${base}${path}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = readToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
      cache: "no-store"
    });
  } catch {
    throw new ApiError("Koneksi ke server gagal. Periksa jaringan lalu coba lagi.", 0);
  }
  const contentType = response.headers.get("Content-Type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    if (response.status === 401 && !path.includes("/api/auth/login")) {
      clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/masuk")) {
        window.location.assign("/masuk/");
      }
    }
    const message = parseErrorBody(body) || `Permintaan gagal (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export const api = {
  health: () => apiFetch<{ status: string }>("/api/health"),

  loginEmail: (email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  me: () => apiFetch<User>("/api/auth/me"),

  logout: () =>
    apiFetch<{ ok: boolean }>("/api/auth/logout", {
      method: "POST"
    }),

  googleLoginUrl: () => buildUrl("/api/auth/google"),

  listProjects: () => apiFetch<Project[]>("/api/projects"),

  createProject: (payload: { title?: string; config?: Partial<ProjectConfig> }) =>
    apiFetch<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  getProject: (projectId: string) => apiFetch<Project>(`/api/projects/${projectId}`),

  updateProject: (
    projectId: string,
    payload: {
      title?: string;
      stage?: Stage;
      config?: ProjectConfig;
      selectedIdeaId?: string | null;
      selectedIdea?: Project["selectedIdea"];
    }
  ) =>
    apiFetch<Project>(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  deleteProject: (projectId: string) =>
    apiFetch<{ ok: boolean }>(`/api/projects/${projectId}`, {
      method: "DELETE"
    }),

  duplicateProject: (projectId: string) =>
    apiFetch<Project>(`/api/projects/${projectId}/duplicate`, {
      method: "POST"
    }),

  listScenes: (projectId: string) => apiFetch<Scene[]>(`/api/projects/${projectId}/scenes`),

  saveScenes: (projectId: string, scenes: Scene[]) =>
    apiFetch<Scene[]>(`/api/projects/${projectId}/scenes`, {
      method: "PUT",
      body: JSON.stringify({ scenes })
    }),

  listStyles: () => apiFetch<StylePack[]>("/api/styles"),

  getStyle: (slug: string) => apiFetch<StylePack>(`/api/styles/${slug}`),

  listVoices: () => apiFetch<Voice[]>("/api/tts/voices"),

  synthesize: (payload: { text: string; voiceId: string; speed: number }) =>
    apiFetch<{ url: string; filename: string; cached: boolean }>("/api/tts/synthesize", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  creditBalance: () => apiFetch<{ credits: number }>("/api/credits/balance"),

  spendCredit: (payload: { amount: number; reason: string; ref: string }) =>
    apiFetch<{ credits: number }>("/api/credits/spend", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  createExport: (payload: { projectId: string; status: string; format: string; sizeBytes: number }) =>
    apiFetch<ExportLog>("/api/exports", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  adminGetOverview: () => apiFetch<AdminOverviewStats>("/api/admin/overview"),

  adminListAssets: () => apiFetch<AdminAssetItem[]>("/api/admin/assets"),

  adminDeleteAsset: (filename: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/assets/${filename}`, {
      method: "DELETE"
    }),

  adminCleanupAssets: () =>
    apiFetch<{ deletedCount: number; freedBytes: number }>("/api/admin/assets/cleanup", {
      method: "POST"
    }),

  adminListProjects: () => apiFetch<AdminProjectItem[]>("/api/admin/projects"),

  adminDeleteProject: (projectId: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/projects/${projectId}`, {
      method: "DELETE"
    }),

  adminListLedger: () => apiFetch<AdminLedgerItem[]>("/api/admin/ledger"),

  adminListUsers: () => apiFetch<AdminUser[]>("/api/admin/users"),

  adminCreateUser: (payload: {
    email: string;
    name: string;
    password: string;
    plan: string;
    credits: number;
    projectQuota: number;
    role: string;
  }) =>
    apiFetch<AdminUser>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  adminUpdateUser: (
    userId: string,
    payload: Partial<{
      plan: string;
      credits: number;
      projectQuota: number;
      role: string;
      disabled: boolean;
      name: string;
    }>
  ) =>
    apiFetch<AdminUser>(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  adminAddCredits: (userId: string, amount: number, reason: string) =>
    apiFetch<AdminUser>(`/api/admin/users/${userId}/credits`, {
      method: "POST",
      body: JSON.stringify({ amount, reason })
    }),

  adminGetSettings: () => apiFetch<SystemSettingsPayload>("/api/admin/settings"),

  adminSaveSettings: (payload: SystemSettingsPayload) =>
    apiFetch<SystemSettingsPayload>("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  adminTestAI: (payload: AITestRequest) =>
    apiFetch<AITestResponse>("/api/admin/ai/test", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  suggestTopics: (payload: { category?: string; language?: string; hint?: string }) =>
    apiFetch<{ topics: string[] }>("/api/gemini/suggest-topics", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export function audioUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return buildUrl(path);
}
