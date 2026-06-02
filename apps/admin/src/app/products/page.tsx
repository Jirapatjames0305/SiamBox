"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, createProduct, fetchProducts, updateProduct, uploadImage, type ProductInput } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => !!c)),
  ).sort();
  const q = search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (!q) return true;
    return [p.sku, p.nameTh, p.nameZh, p.nameEn].some((v) => v?.toLowerCase().includes(q));
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">สินค้า</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + เพิ่มสินค้า
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อสินค้า / SKU…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 sm:max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        >
          <option value="">ทุกประเภท</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-sm text-neutral-500 sm:ml-auto">{filtered.length} รายการ</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">รูป</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">ชื่อสินค้า</th>
              <th className="px-4 py-3">ราคา</th>
              <th className="px-4 py-3">สต็อก</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-500">
                  {products.length === 0 ? "ยังไม่มีสินค้า" : "ไม่พบสินค้าที่ค้นหา"}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    {p.images && p.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt=""
                        className="h-11 w-11 rounded-md border border-neutral-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.nameZh ?? p.nameTh}</div>
                    <div className="text-xs text-neutral-500">{p.nameTh}</div>
                  </td>
                  <td className="px-4 py-3">{formatPrice(p.priceCents, p.currency)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        p.active ? "bg-emerald-100 text-emerald-900" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {p.active ? "แสดงสินค้า" : "ซ่อนอยู่"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                      }}
                      className="text-xs text-neutral-700 underline hover:text-neutral-900"
                    >
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ProductForm
          product={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    slug: product?.slug ?? "",
    nameTh: product?.nameTh ?? "",
    nameZh: product?.nameZh ?? "",
    nameEn: product?.nameEn ?? "",
    descriptionTh: product?.descriptionTh ?? "",
    descriptionZh: product?.descriptionZh ?? "",
    priceCents: product?.priceCents ?? 0,
    currency: product?.currency ?? "CNY",
    stock: product?.stock ?? 0,
    weightGrams: product?.weightGrams ?? 0,
    category: product?.category ?? "",
    tags: (product?.tags ?? []).join(", "),
    images: (product?.images ?? []) as string[],
    active: product?.active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    const payload: ProductInput = {
      sku: form.sku,
      slug: form.slug,
      nameTh: form.nameTh,
      nameZh: form.nameZh || undefined,
      nameEn: form.nameEn || undefined,
      descriptionTh: form.descriptionTh || undefined,
      descriptionZh: form.descriptionZh || undefined,
      priceCents: Number(form.priceCents),
      currency: form.currency,
      stock: Number(form.stock),
      weightGrams: form.weightGrams ? Number(form.weightGrams) : undefined,
      category: form.category || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      images: form.images,
      active: form.active,
    };
    try {
      if (product) await updateProduct(product.id, payload);
      else await createProduct(payload);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="SKU" value={form.sku} onChange={(v) => set("sku", v)} required disabled={!!product} />
          <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required disabled={!!product} />
          <Field label="ชื่อ (ภาษาไทย)" value={form.nameTh} onChange={(v) => set("nameTh", v)} required />
          <Field label="ชื่อ (ภาษาจีน)" value={form.nameZh} onChange={(v) => set("nameZh", v)} />
          <Field label="ชื่อ (ภาษาอังกฤษ)" value={form.nameEn} onChange={(v) => set("nameEn", v)} />
          <Field label="หมวดหมู่" value={form.category} onChange={(v) => set("category", v)} />
          <Field
            label="ราคา (¥)"
            type="number"
            step="0.01"
            value={(form.priceCents / 100).toFixed(2)}
            onChange={(v) => set("priceCents", Math.round((Number(v) || 0) * 100) as never)}
            required
          />
          <Field
            label="สต็อก"
            type="number"
            value={String(form.stock)}
            onChange={(v) => set("stock", Number(v) as never)}
          />
          <Field
            label="น้ำหนัก (กรัม)"
            type="number"
            value={String(form.weightGrams)}
            onChange={(v) => set("weightGrams", Number(v) as never)}
          />
          <Field label="สกุลเงิน" value={form.currency} onChange={(v) => set("currency", v)} />
          <Field label="แท็ก (คั่นด้วยจุลภาค)" value={form.tags} onChange={(v) => set("tags", v)} className="sm:col-span-2" />
        </div>

        <label className="mt-3 block text-sm">
          <span className="text-neutral-700">คำอธิบาย (ภาษาไทย)</span>
          <textarea
            value={form.descriptionTh}
            onChange={(e) => set("descriptionTh", e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className="text-neutral-700">คำอธิบาย (ภาษาจีน)</span>
          <textarea
            value={form.descriptionZh}
            onChange={(e) => set("descriptionZh", e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        <div className="mt-3 block text-sm">
          <span className="text-neutral-700">รูปภาพสินค้า</span>
          <ImagePicker
            images={form.images}
            onChange={(next) => set("images", next as never)}
          />
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          <span>เปิดใช้งาน (แสดงบนหน้าเว็บ)</span>
        </label>

        {err && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:border-neutral-500"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
          >
            {submitting ? "กำลังบันทึก…" : product ? "บันทึกการเปลี่ยนแปลง" : "สร้างสินค้า"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  required,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="text-neutral-700">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-500 disabled:bg-neutral-100"
      />
    </label>
  );
}

function ImagePicker({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        const { url } = await uploadImage(file);
        uploaded.push(url);
      }
      onChange([...images, ...uploaded]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "อัพโหลดล้มเหลว");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const item = next.splice(from, 1)[0];
    if (item === undefined) return;
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="mt-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-center transition ${
          dragging ? "border-orange-400 bg-orange-50" : "border-neutral-300 bg-neutral-50 hover:border-neutral-400"
        }`}
      >
        <svg className="h-7 w-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="mt-2 text-xs text-neutral-600">
          {uploading ? "กำลังอัพโหลด..." : "คลิกหรือลากไฟล์รูปมาวางที่นี่"}
        </p>
        <p className="mt-0.5 text-[10px] text-neutral-400">JPG / PNG / WebP / GIF, ไม่เกิน 5MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url, idx) => (
            <li
              key={`${url}-${idx}`}
              className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  หลัก
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/40 p-1 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-neutral-800 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === images.length - 1}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-neutral-800 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] text-white hover:bg-red-600"
                >
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
