"use client";

import { useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-sm rounded-xl bg-maroon-900 px-4 py-2.5 text-center text-sm font-medium text-cream-100 shadow-lg ring-1 ring-gold-500/30"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
