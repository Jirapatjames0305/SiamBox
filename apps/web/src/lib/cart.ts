"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/routing";

const STORAGE_KEY = "siambox.cart.v4";

export type PackageAddon = {
  productId: string;
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
  priceCents: number;
  quantity: number;
  image?: string;
};

export type PackageCartLine = {
  kind: "package";
  lineId: string; // packageId or packageId + addon fingerprint
  packageId: string;
  slug: string;
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
  basePriceCents: number; // package base price (excluding addons)
  priceCents: number; // unit price = basePriceCents + sum(addon.price × addon.qty)
  quantity: number;
  image?: string;
  addons?: PackageAddon[];
};

export type CustomCartLine = {
  kind: "custom";
  lineId: string; // generated unique
  products: {
    productId: string;
    quantity: number;
    nameTh: string;
    nameZh: string | null;
    nameEn: string | null;
    priceCents: number;
    image?: string;
  }[];
  priceCents: number; // unit price (sum of items)
  quantity: number;
};

export type CartLine = PackageCartLine | CustomCartLine;

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

function addonsFingerprint(addons?: PackageAddon[]): string {
  if (!addons || addons.length === 0) return "";
  return addons
    .map((a) => `${a.productId}:${a.quantity}`)
    .sort()
    .join("|");
}

export function addPackageToCart(
  line: Omit<PackageCartLine, "kind" | "lineId" | "quantity" | "priceCents"> & {
    quantity?: number;
  },
) {
  const cart = read();
  const fp = addonsFingerprint(line.addons);
  const lineId = fp ? `${line.packageId}#${fp}` : line.packageId;
  const addonsTotal = (line.addons ?? []).reduce((s, a) => s + a.priceCents * a.quantity, 0);
  const priceCents = line.basePriceCents + addonsTotal;
  const existing = cart.lines.find((l): l is PackageCartLine => l.kind === "package" && l.lineId === lineId);
  if (existing) {
    existing.quantity += line.quantity ?? 1;
  } else {
    cart.lines.push({
      ...line,
      kind: "package",
      lineId,
      priceCents,
      quantity: line.quantity ?? 1,
    });
  }
  write(cart);
}

export function addCustomToCart(line: Omit<CustomCartLine, "kind" | "lineId" | "quantity"> & { quantity?: number }) {
  const cart = read();
  const lineId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  cart.lines.push({ ...line, kind: "custom", lineId, quantity: line.quantity ?? 1 });
  write(cart);
}

// Quick-add a single product into an in-progress custom package (the first custom line, or a
// new one). Returns the custom package's new subtotal (cents) so the caller can show how much
// more is needed to reach the minimum order.
export function addToCustomDraft(product: {
  productId: string;
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
  priceCents: number;
  image?: string;
}): number {
  const cart = read();
  let line = cart.lines.find((l): l is CustomCartLine => l.kind === "custom");
  if (!line) {
    line = {
      kind: "custom",
      lineId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      products: [],
      priceCents: 0,
      quantity: 1,
    };
    cart.lines.push(line);
  }
  const existing = line.products.find((x) => x.productId === product.productId);
  if (existing) existing.quantity += 1;
  else line.products.push({ ...product, quantity: 1 });
  line.priceCents = line.products.reduce((sum, x) => sum + x.priceCents * x.quantity, 0);
  write(cart);
  return line.priceCents;
}

// Set the quantity of a single product inside a custom package line. Removing the last product
// (or setting qty <= 0) drops the product; an empty custom line is removed entirely.
export function setCustomProductQty(lineId: string, productId: string, quantity: number) {
  const cart = read();
  const line = cart.lines.find((l): l is CustomCartLine => l.kind === "custom" && l.lineId === lineId);
  if (!line) return;
  if (quantity <= 0) {
    line.products = line.products.filter((p) => p.productId !== productId);
  } else {
    const product = line.products.find((p) => p.productId === productId);
    if (product) product.quantity = quantity;
  }
  if (line.products.length === 0) {
    cart.lines = cart.lines.filter((l) => l.lineId !== lineId);
  } else {
    line.priceCents = line.products.reduce((sum, x) => sum + x.priceCents * x.quantity, 0);
  }
  write(cart);
}

export function removeCustomProduct(lineId: string, productId: string) {
  setCustomProductQty(lineId, productId, 0);
}

export function updateQuantity(lineId: string, quantity: number) {
  const cart = read();
  const line = cart.lines.find((l) => l.lineId === lineId);
  if (!line) return;
  if (quantity <= 0) {
    cart.lines = cart.lines.filter((l) => l.lineId !== lineId);
  } else {
    line.quantity = quantity;
  }
  write(cart);
}

export function removeFromCart(lineId: string) {
  const cart = read();
  cart.lines = cart.lines.filter((l) => l.lineId !== lineId);
  write(cart);
}

export function clearCart() {
  write({ lines: [] });
}

export function cartTotalCents(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);
}

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => {
    if (l.kind === "custom") {
      return sum + l.products.reduce((s, p) => s + p.quantity, 0);
    }
    return sum + l.quantity;
  }, 0);
}

export function cartLineName(line: CartLine, locale: Locale): string {
  if (line.kind === "custom") {
    if (locale === "zh") return "自定义套餐";
    if (locale === "en") return "Custom Package";
    return "แพ็กเกจกำหนดเอง";
  }
  if (locale === "zh") return line.nameZh ?? line.nameTh;
  if (locale === "en") return line.nameEn ?? line.nameZh ?? line.nameTh;
  return line.nameTh;
}

export function cartLineImage(line: CartLine): string | undefined {
  if (line.kind === "custom") return line.products[0]?.image;
  return line.image;
}
