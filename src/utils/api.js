/* ============================================================
   BHIMA ESPORTS — API Utility
   ============================================================ */

const BASE_URL =
  import.meta.env.MODE === 'development'
    ? '/api'
    : 'https://bhima-esports-api.onrender.com/api';

let authToken = localStorage.getItem('adminToken') || localStorage.getItem('playerToken') || null;

export const setToken = (token) => { authToken = token; };
export const getToken = () => authToken;
export const clearToken = () => { 
  authToken = null; 
  localStorage.removeItem('adminToken');
  localStorage.removeItem('playerToken');
};

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle no-content responses
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && !options._retry && authToken) {
        options._retry = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.token) {
            setToken(refreshData.token);
            localStorage.setItem('adminToken', refreshData.token);
            // Retry original request
            headers['Authorization'] = `Bearer ${refreshData.token}`;
            const retryRes = await fetch(url, { ...options, headers });
            if (retryRes.status === 204) return null;
            const retryData = await retryRes.json().catch(() => null);
            if (!retryRes.ok) throw new ApiError(retryData?.error || 'Request failed', retryRes.status, retryData);
            return retryData;
          } else {
            clearToken();
            window.location.href = '/admin/login';
          }
        } catch (e) {
          clearToken();
          window.location.href = '/admin/login';
        }
      }

      throw new ApiError(
        data?.message || data?.error || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error.message || 'Network error. Please check your connection.',
      0,
      null
    );
  }
}

const api = {
  get: (endpoint, params) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return request(url, { method: 'GET' });
  },

  post: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  put: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  patch: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  },
};

export default api;
export { ApiError };
