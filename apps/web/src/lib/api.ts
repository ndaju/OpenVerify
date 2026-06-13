const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const stored = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="));

  if (stored) {
    return decodeURIComponent(stored.split("=")[1]);
  }

  try {
    const raw = localStorage.getItem("openverify_access_token");
    return raw;
  } catch {
    return null;
  }
}

function setAccessTokenCookie(token: string): void {
  document.cookie = `accessToken=${encodeURIComponent(token)}; path=/; max-age=900; samesite=strict`;
}

export async function apiRequest<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { skipAuth = false, ...fetchConfig } = config;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchConfig.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchConfig,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipAuth) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...fetchConfig,
        headers,
        credentials: "include",
      });
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ error: "Request failed" }));
        throw new ApiError(retryResponse.status, error.error || "Request failed");
      }
      return retryResponse.json();
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function attemptRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.accessToken) {
      setAccessTokenCookie(data.accessToken);
      try {
        localStorage.setItem("openverify_access_token", data.accessToken);
      } catch {}
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function storeAccessToken(token: string): void {
  setAccessTokenCookie(token);
  try {
    localStorage.setItem("openverify_access_token", token);
  } catch {}
}

export function clearAccessToken(): void {
  document.cookie = "accessToken=; path=/; max-age=0";
  try {
    localStorage.removeItem("openverify_access_token");
  } catch {}
}
