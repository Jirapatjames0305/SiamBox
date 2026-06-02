"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, fetchSettings, updateSettings, uploadImage } from "@/lib/api";
import type { Settings } from "@/lib/types";

type FormState = Omit<Settings, "id" | "updatedAt">;

const SECTIONS = [
  { key: "heroBgUrl" as const, label: "Hero (แบนเนอร์หลัก)", hint: "ภาพพื้นหลังด้านบนสุดของหน้าแรก" },
  { key: "storiesBgUrl" as const, label: "Thailand Stories (ซ้าย)", hint: "ภาพพื้นหลังช่องซ้าย — Thailand Stories" },
  { key: "brandsBgUrl" as const, label: "Thai Brands (กลาง)", hint: "ภาพพื้นหลังช่องกลาง — 500+ Thai Brands" },
  { key: "partnerBgUrl" as const, label: "Become Our Partner (ขวา)", hint: "ภาพพื้นหลังช่องขวา — Become Our Partner" },
];

const FAVICON_KEY = "faviconUrl" as const;
const LOGO_KEY = "logoUrl" as const;

export default function UiEditorPage() {
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

  const onSave = async () => {
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">แก้ไข UI หน้าเว็บ</h1>
      <p className="mt-1 text-sm text-neutral-500">
        เพิ่มภาพพื้นหลังให้แต่ละเซกชันของหน้าแรก (ระบบแปลงเป็น WebP อัตโนมัติ)
      </p>

      {loading || !form ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : (
        <div className="mt-8 space-y-5">
          <SquareImage
            title="Favicon (icon เว็บ)"
            hint="icon ที่แสดงใน browser tab — แนะนำให้ใช้ภาพสี่เหลี่ยมจัตุรัส ขนาดอย่างน้อย 64×64 px"
            noun="icon"
            value={form[FAVICON_KEY]}
            onChange={(v) => setForm({ ...form, [FAVICON_KEY]: v })}
          />

          <SquareImage
            title="โลโก้ (Navbar / Footer)"
            hint="โลโก้ข้างชื่อ SIAMBOX บนหัวและท้ายเว็บ — แนะนำภาพสี่เหลี่ยมจัตุรัส พื้นหลังโปร่งใส (PNG)"
            noun="โลโก้"
            value={form[LOGO_KEY]}
            onChange={(v) => setForm({ ...form, [LOGO_KEY]: v })}
          />

          {SECTIONS.map((s) => (
            <SectionImage
              key={s.key}
              label={s.label}
              hint={s.hint}
              value={form[s.key]}
              onChange={(v) => setForm({ ...form, [s.key]: v })}
            />
          ))}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            {savedAt && <span className="text-sm text-emerald-700">บันทึกแล้ว</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function SquareImage({
  title,
  hint,
  noun,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  noun: string;
  value: string;
  onChange: (v: string) => void;
}) {
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
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
        <span className="text-xs text-neutral-400">{value ? `มี${noun}แล้ว` : `ยังไม่มี${noun}`}</span>
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${title} preview`} className="h-full w-full object-contain" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-neutral-300">
              <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-500 disabled:opacity-50"
          >
            {uploading ? "กำลังอัพโหลด…" : value ? `เปลี่ยน${noun}` : `อัพโหลด${noun}`}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-xs text-red-600 hover:underline">
              ลบ{noun}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SectionImage({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
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
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-800">{label}</h2>
        <span className="text-xs text-neutral-400">{value ? "มีภาพแล้ว" : "ยังไม่มีภาพ"}</span>
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>

      {/* Preview */}
      <div className="mt-3 flex aspect-[16/6] items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-neutral-400">— ไม่มีภาพพื้นหลัง —</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-500 disabled:opacity-50"
        >
          {uploading ? "กำลังอัพโหลด…" : value ? "เปลี่ยนภาพ" : "เพิ่มภาพพื้นหลัง"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-600 hover:underline"
          >
            ลบภาพ
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
