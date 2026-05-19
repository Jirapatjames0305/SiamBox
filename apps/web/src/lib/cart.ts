"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/routing";

const STORAGE_KEY = "siambox.cart.v2";

export type CartLine = {
  productId: string;
  slug: string;
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
  priceCents: number;
  quantity: number;
  image?: string;
};

type Cart = { lines: CartLine[] };

function read(): Cart {
  if (typeof window === "undefined") return { lines: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [] };
    const parsed = JSON.parse(raw) as Cart;
    if (!Array.isArray(parsed.lines)) return { lines: [] };
    return parsed;
  } catch {
    return { lines: [] };
  }
}

function write(cart: Cart) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("siambox:cart"));
}

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("siambox:cart", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("siambox:cart", handler);
    window.removeEventListener("storage", handler);
  };
}

export function useCart() {
  const cart = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(read()),
    () => JSON.stringify({ lines: [] }),
  );
  return JSON.parse(cart) as Cart;
}

export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function addToCart(line: Omit<CartLine, "quantity"> & { quantity?: number }) {
  const cart = read();
  const existing = cart.lines.find((l) => l.productId === line.productId);
  if (existing) {
    existing.quantity += line.quantity ?? 1;
  } else {
    cart.lines.push({ ...line, quantity: line.quantity ?? 1 });
  }
  write(cart);
}

export function updateQuantity(productId: string, quantity: number) {
  const cart = read();
  const line = cart.lines.find((l) => l.productId === productId);
  if (!line) return;
  if (quantity <= 0) {
    cart.lines = cart.lines.filter((l) => l.productId !== productId);
  } else {
    line.quantity = quantity;
  }
  write(cart);
}

export function removeFromCart(productId: string) {
  const cart = read();
  cart.lines = cart.lines.filter((l) => l.productId !== productId);
  write(cart);
}

export function clearCart() {
  write({ lines: [] });
}

export function cartTotalCents(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
}

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartLineName(line: CartLine, locale: Locale): string {
  if (locale === "zh") return line.nameZh ?? line.nameTh;
  if (locale === "en") return line.nameEn ?? line.nameZh ?? line.nameTh;
  return line.nameTh;
}
