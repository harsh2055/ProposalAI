"use client";

import { create } from "zustand";
import { authAPI } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  subscription?: {
    plan: "FREE" | "PRO" | "AGENCY";
    status: string;
  };
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user, accessToken, refreshToken } = res.data;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  signup: async (name, email, password) => {
    const res = await authAPI.signup({ name, email, password });
    const { user, accessToken, refreshToken } = res.data;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = "/login";
  },

  fetchMe: async () => {
    try {
      // Only run in browser
      if (typeof window === "undefined") {
        set({ isLoading: false });
        return;
      }
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const res = await authAPI.getMe();
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token invalid or expired — clear and let redirect happen
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
