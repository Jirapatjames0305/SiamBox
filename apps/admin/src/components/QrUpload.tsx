"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/api";

export function QrUpload({
  value,
  onChange,
  label = "QR Code รับเงิน",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
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
    <div>
      <span className="text-sm font-medium text-neutral-700">{label}</span>
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
