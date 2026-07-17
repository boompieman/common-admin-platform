import type {
  Account,
  ApiService,
  AuthSession,
  AuthUser,
  Permission,
  UsageResource,
} from "./types";

const API_BASE = String(import.meta.env.VITE_ADMIN_API_BASE_URL ?? "").replace(/\/$/, "");
const STORAGE_KEY = "common-admin-platform-session-v1";

export function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail || `${response.status} ${response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  const session = await request<AuthSession>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveSession(session);
  return session;
}

export function fetchMe(token: string) {
  return request<{ user: AuthUser }>("/api/auth/me/", {}, token);
}

export async function logout(token: string) {
  await request<void>("/api/auth/logout/", { method: "POST" }, token);
  saveSession(null);
}

export function listAccounts(token: string) {
  return request<{ accounts: Account[] }>("/api/admin/accounts/", {}, token);
}

export function createAccount(token: string, payload: Omit<Account, "id" | "username" | "last_login" | "created_at" | "updated_by">) {
  return request<{ account: Account }>("/api/admin/accounts/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export function updateAccount(token: string, id: number, payload: Partial<Account>) {
  return request<{ account: Account }>(`/api/admin/accounts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export function listPermissions(token: string) {
  return request<Permission[]>("/api/admin/permissions/", {}, token);
}

export function createPermission(token: string, payload: Partial<Permission>) {
  return request<Permission>("/api/admin/permissions/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export function updatePermission(token: string, id: number, payload: Partial<Permission>) {
  return request<Permission>(`/api/admin/permissions/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export function listUsage(token: string) {
  return request<UsageResource[]>("/api/admin/usage/", {}, token);
}

export function createUsage(token: string, payload: Partial<UsageResource>) {
  return request<UsageResource>("/api/admin/usage/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export function updateUsage(token: string, id: number, payload: Partial<UsageResource>) {
  return request<UsageResource>(`/api/admin/usage/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}

export function listApis(token: string) {
  return request<ApiService[]>("/api/admin/apis/", {}, token);
}

export function createApi(token: string, payload: Partial<ApiService>) {
  return request<ApiService>("/api/admin/apis/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export function updateApi(token: string, id: number, payload: Partial<ApiService>) {
  return request<ApiService>(`/api/admin/apis/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);
}
