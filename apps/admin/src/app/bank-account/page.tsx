"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, fetchSettings, updateSettings, uploadImage } from "@/lib/api";
import type { Settings } from "@/lib/types";

type FormState = Omit<Settings, "id" | "updatedAt">;

export default function BankAccountPage() {
  // We hold the full settings object so saving preserves the non-bank fields.
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
      <h1 className="text-2xl font-semibold tracking-tight">บัญชีรับโอน</h1>
      <p className="mt-1 text-sm text-neutral-500">
        QR และชื่อบัญชีที่จะแสดงให้ลูกค้าตอนเลือก &quot;โอนเงินด้วยตนเอง&quot; ในหน้าชำระเงิน
      </p>

      {loading || !form ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <Field
            label="ชื่อบัญชี"
            value={form.bankAccountName}
            onChange={(v) => setForm({ ...form, bankAccountName: v })}
            placeholder="บจก. สยามบ็อกซ์ / ธนาคาร..."
          />
          <Field
            label="เลขที่บัญชี / PromptPay"
            value={form.bankAccountNumber}
            onChange={(v) => setForm({ ...form, bankAccountNumber: v })}
            placeholder="xxx-x-xxxxx-x"
          />
          <QrUpload
            value={form.bankQrUrl}
            onChange={(v) => setForm({ ...form, bankQrUrl: v })}
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

function QrUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัพโหลดล้มเหลว");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="text-sm font-medium text-neutral-700">QR Code รับเงิน</span>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="QR" className="h-24 w-24 rounded-md border border-neutral-200 object-contain" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-neutral-300 text-xs text-neutral-400">
            ไม่มี QR
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-500 disabled:opacity-50"
          >
            {uploading ? "กำลังอัพโหลด…" : value ? "เปลี่ยนรูป" : "อัพโหลด QR"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-left text-xs text-red-600 hover:underline"
            >
              ลบ QR
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
      />
    </label>
  );
}
