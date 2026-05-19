"use client";

const STORAGE_KEY = "siambox.admin.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(STORAGE_KEY);
}
