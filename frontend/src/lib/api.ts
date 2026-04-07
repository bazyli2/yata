/**
 * Tiny fetch wrapper that prepends NEXT_PUBLIC_API_URL.
 *
 * Set NEXT_PUBLIC_API_URL in frontend/.env.local
 * (defaults to http://localhost:8000 in dev).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Item = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type HealthResponse = {
  status: string;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${url} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => apiFetch<HealthResponse>("/api/health"),
  listItems: () => apiFetch<Item[]>("/api/items"),
  createItem: (data: { name: string; description?: string }) =>
    apiFetch<Item>("/api/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteItem: (id: number) =>
    apiFetch<void>(`/api/items/${id}`, {
      method: "DELETE",
    }),
};
