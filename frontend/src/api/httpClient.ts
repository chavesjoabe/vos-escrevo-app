/**
 * Thin fetch wrapper / HTTP Client.
 * Uses Vite's /api proxy in development (forwarding to Quarkus on port 8080)
 * or direct backend host port 8080, attaching the authenticated user's Bearer token.
 */

export const AUTH_SESSION_STORAGE_KEY = 'commented_bible_auth_session_v1';
export const AUTH_UNAUTHORIZED_EVENT = 'commented_bible_auth_unauthorized';

function resolveDirectBackendUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return 'http://localhost:8080';
}

function getStoredAuthToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === 'string' ? parsed.token : null;
  } catch {
    return null;
  }
}

function notifyUnauthorizedIfNeeded(url: string, status: number): void {
  if (status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
    try {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private buildHeaders(includeJsonContentType = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }
    const token = getStoredAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async parseErrorMessage(response: Response): Promise<string> {
    try {
      const payload = await response.json();
      if (payload?.message) {
        return payload.message;
      }
    } catch {
      // Ignore JSON parse errors on error response
    }
    return `HTTP Error ${response.status}: ${response.statusText}`;
  }

  private async requestWithFallback<T>(url: string, requestInit: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, requestInit);
      if (response.ok) {
        return await response.json();
      }
      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 403 ||
        response.status === 409
      ) {
        notifyUnauthorizedIfNeeded(url, response.status);
        const message = await this.parseErrorMessage(response);
        throw new ApiError(response.status, message);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network/proxy error: fall back to direct backend URL below
    }

    const directResponse = await fetch(`${resolveDirectBackendUrl()}${url}`, requestInit);
    if (!directResponse.ok) {
      notifyUnauthorizedIfNeeded(url, directResponse.status);
      const message = await this.parseErrorMessage(directResponse);
      throw new ApiError(directResponse.status, message);
    }
    return await directResponse.json();
  }

  async get<T>(url: string): Promise<T> {
    return await this.requestWithFallback<T>(url, {
      method: 'GET',
      headers: this.buildHeaders(false),
    });
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    return await this.requestWithFallback<T>(url, {
      method: 'POST',
      headers: this.buildHeaders(true),
      body: JSON.stringify(data),
    });
  }

  async put<T>(url: string, data: unknown): Promise<T> {
    return await this.requestWithFallback<T>(url, {
      method: 'PUT',
      headers: this.buildHeaders(true),
      body: JSON.stringify(data),
    });
  }
}

export const httpClient = new HttpClient();
