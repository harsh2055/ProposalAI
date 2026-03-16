"use client";

// Self-contained toast hook — no external dependencies
import { useCallback } from "react";

type ToastVariant = "default" | "destructive";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

// Simple event emitter for toasts
const listeners: Array<(toast: ToastOptions & { id: string }) => void> = [];

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    const payload = { ...options, id };
    listeners.forEach((fn) => fn(payload));
  }, []);

  return { toast };
}

export function subscribeToToasts(
  fn: (toast: ToastOptions & { id: string }) => void
): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx > -1) listeners.splice(idx, 1);
  };
}
