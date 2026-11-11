import { ApiResponse } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

function getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const status = response.status;
  try {
    const data = await response.json();
    if (!response.ok) {
      return {
        data: null,
        error: data.error || response.statusText || 'An error occurred',
        status,
      };
    }
    return { data, error: null, status };
  } catch (err) {
    if (!response.ok) {
      return {
        data: null,
        error: response.statusText || 'Request failed',
        status,
      };
    }
    return { data: null, error: null, status };
  }
}

export const api = {
  async get<T>(path: string, options?: { token?: string; params?: Record<string, string> }): Promise<ApiResponse<T>> {
    let url = `${API_BASE}${path}`;

    if (options?.params) {
      const query = new URLSearchParams(options.params).toString();
      url += `?${query}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(options?.token),
      });
      return handleResponse<T>(response);
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Network error occurred',
        status: 500,
      };
    }
  },

  async post<T>(path: string, body: any, options?: { token?: string }): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: getHeaders(options?.token),
        body: JSON.stringify(body),
      });
      return handleResponse<T>(response);
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Network error occurred',
        status: 500,
      };
    }
  },

  async put<T>(path: string, body: any, options?: { token?: string }): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: getHeaders(options?.token),
        body: JSON.stringify(body),
      });
      return handleResponse<T>(response);
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Network error occurred',
        status: 500,
      };
    }
  },

  async delete<T>(path: string, options?: { token?: string }): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: getHeaders(options?.token),
      });
      return handleResponse<T>(response);
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Network error occurred',
        status: 500,
      };
    }
  },
};
