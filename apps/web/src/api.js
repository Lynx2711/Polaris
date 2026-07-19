// Small fetch helper — attaches auth headers, handles JSON parsing/errors consistently.

const API_BASE = "http://localhost:4000";

export async function apiCall(path, { method = "GET", token, orgId, body } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (orgId) headers["x-org-id"] = orgId;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  }

  return data;
}