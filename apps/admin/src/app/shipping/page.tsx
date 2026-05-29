"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchSettings, updateSettings } from "@/lib/api";
import type { Settings } from "@/lib/types";

type FormState = Omit<Settings, "id" | "updatedAt">;

export default function ShippingPage() {
  // Hold the full settings object so saving preserves the non-shipping fields.
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then(({ id: _id, updatedAt: _u, ...rest }) => setForm(rest))
      .catch((err) => setError(err instanceof ApiError ? err.message : (err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setSavedAt(false);
    try {
      await updateSettings(form);
      setSavedAt(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">ค่าจัดส่ง</h1>
      <p className="mt-1 text-sm text-neutral-500">
        ราคาค่าส่ง 2 แบบที่ลูกค้าเลือกได้ตอนชำระเงิน (หน่วยเป็น CNY)
      </p>

      {loading || !form ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <PriceField
            label="ธรรมดา (7-15 วัน)"
            cents={form.shippingBaseCents}
            onChange={(c) => setForm({ ...form, shippingBaseCents: c })}
          />
          <PriceField
            label="ด่วน (3-5 วัน)"
            cents={form.shippingExpressCents}
            onChange={(c) => setForm({ ...form, shippingExpressCents: c })}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            {savedAt && <span className="text-sm text-emerald-700">บันทึกแล้ว</span>}
          </div>
        </form>
      )}
    </div>
  );
}

function PriceField({
  label,
  cents,
  onChange,
}: {
  label: string;
  cents: number;
  onChange: (cents: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-sm text-neutral-400">¥</span>
        <input
          type="number"
          step="0.01"
          value={(cents / 100).toFixed(2)}
          onChange={(e) => onChange(Math.round((Number(e.target.value) || 0) * 100))}
          placeholder="0.00"
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </div>
    </label>
  );
}
