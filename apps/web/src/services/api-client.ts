import type { ApiError } from '@/types';

const BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
    }));

    // Session expired — redirect to login if user was previously authenticated
    if (response.status === 401 && localStorage.getItem('user')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    throw error;
  }

  // No body (204 No Content or empty payload) — return undefined.
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const apiClient = {
  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(
      `${BASE_URL}${path}${buildQueryString(params)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' },
    );
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return handleResponse<T>(response);
  },

  async getBlob(path: string, params: Record<string, unknown> = {}): Promise<Blob> {
    const response = await fetch(`${BASE_URL}${path}${buildQueryString(params)}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
      }));
      throw error;
    }
    return response.blob();
  },

  async delete(path: string): Promise<void> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
      }));
      if (response.status === 401 && localStorage.getItem('user')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw error;
    }
  },
};
