/**
 * ProposalAI API Client
 * Axios instance with auth interceptors and silent token refresh
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Attach JWT to every request ─────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Auto token refresh on 401 ───────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const is401 = error.response?.status === 401;
    const isAuthRoute =
      original?.url?.includes("/auth/login") ||
      original?.url?.includes("/auth/signup") ||
      original?.url?.includes("/auth/refresh");

    // Don't retry auth routes themselves
    if (is401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refresh_token")
            : null;

        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", newRefresh);

        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────

export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const proposalAPI = {
  list: (params?: Record<string, string>) =>
    api.get("/proposals", { params }),
  get: (id: string) => api.get(`/proposals/${id}`),
  getShared: (token: string) => api.get(`/proposals/share/${token}`),
  generate: (data: Record<string, unknown>) =>
    api.post("/proposals/generate", data),
  create: (data: Record<string, unknown>) => api.post("/proposals", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/proposals/${id}`),
  duplicate: (id: string) => api.post(`/proposals/${id}/duplicate`),
  toggleShare: (id: string) => api.post(`/proposals/${id}/share`),
  downloadPDF: (id: string) =>
    api.get(`/proposals/${id}/pdf`, { responseType: "blob" }),
  getStats: () => api.get("/proposals/stats"),
};

export const clientAPI = {
  list: (params?: Record<string, string>) =>
    api.get("/clients", { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: Record<string, unknown>) => api.post("/clients", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const subscriptionAPI = {
  getPlans: () => api.get("/subscriptions/plans"),
  getUsage: () => api.get("/subscriptions/usage"),
  createCheckout: (plan: string) =>
    api.post("/subscriptions/checkout", { plan }),
  getBillingPortal: () => api.post("/subscriptions/portal"),
};
