"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchSettings, updateSettings } from "@/lib/api";
import type { Settings } from "@/lib/types";

type FormState = Omit<Settings, "id" | "updatedAt">;

const EMPTY: FormState = {
  senderName: "",
  senderAddressLine1: "",
  senderAddressLine2: "",
  senderPhone: "",
  shippingBaseCents: 0,
  customPackageMinCents: 0,
};

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setForm({
          senderName: s.senderName,
          senderAddressLine1: s.senderAddressLine1,
          senderAddressLine2: s.senderAddressLine2,
          senderPhone: s.senderPhone,
          shippingBaseCents: s.shippingBaseCents,
          customPackageMinCents: s.customPackageMinCents,
        });
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : (err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      const saved = await updateSettings(form);
      setSavedAt(saved.updatedAt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่า</h1>
      <p className="mt-1 text-sm text-neutral-500">
        ที่อยู่ผู้ส่งที่จะแสดงบนใบจ่าหน้าซองตอนพิมพ์ออเดอร์
      </p>

      {loading ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field
            label="ชื่อผู้ส่ง"
            value={form.senderName}
            onChange={(v) => setForm({ ...form, senderName: v })}
            placeholder="SiamBox"
          />
          <Field
            label="ที่อยู่บรรทัด 1"
            value={form.senderAddressLine1}
            onChange={(v) => setForm({ ...form, senderAddressLine1: v })}
            placeholder="เลขที่ ซอย ถนน"
          />
          <Field
            label="ที่อยู่บรรทัด 2"
            value={form.senderAddressLine2}
            onChange={(v) => setForm({ ...form, senderAddressLine2: v })}
            placeholder="แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
          />
          <Field
            label="เบอร์โทร"
            value={form.senderPhone}
            onChange={(v) => setForm({ ...form, senderPhone: v })}
            placeholder="+66 81-234-5678"
          />

          <div className="mt-6 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-semibold text-neutral-800">ค่าจัดส่ง</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              ค่าส่งเหมา (cent — เช่น 2500 = 25 CNY) จะถูกบวกเข้าทุกออเดอร์ใหม่
            </p>
            <div className="mt-3">
              <Field
                label="ราคาส่ง (สตางค์ / cents)"
                type="number"
                value={String(form.shippingBaseCents)}
                onChange={(v) => setForm({ ...form, shippingBaseCents: Number(v) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-semibold text-neutral-800">แพ็กเกจกำหนดเอง</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              ขั้นต่ำที่ลูกค้าต้องจัดในแพ็กเกจของตัวเอง (CNY) — ตั้ง 0 หากไม่จำกัด
            </p>
            <div className="mt-3">
              <Field
                label="ขั้นต่ำต่อแพ็กเกจกำหนดเอง (CNY)"
                type="number"
                step="0.01"
                value={(form.customPackageMinCents / 100).toFixed(2)}
                onChange={(v) =>
                  setForm({ ...form, customPackageMinCents: Math.round((Number(v) || 0) * 100) })
                }
                placeholder="0.00"
              />
            </div>
          </div>

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
            {savedAt && (
              <span className="text-sm text-emerald-700">บันทึกแล้ว</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
      />
    </label>
  );
}
