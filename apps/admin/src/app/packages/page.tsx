"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  createPackage,
  deletePackage,
  fetchPackages,
  fetchProducts,
  updatePackage,
  uploadImage,
  type PackageInput,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Package, Product } from "@/lib/types";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Package | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [pkgs, prods] = await Promise.all([fetchPackages(), fetchProducts()]);
      setPackages(pkgs);
      setProducts(prods);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(pkg: Package) {
    if (!confirm(`ลบแพ็กเกจ "${pkg.nameTh}"?`)) return;
    try {
      await deletePackage(pkg.id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">แพ็กเกจ</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + เพิ่มแพ็กเกจ
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">ชื่อแพ็กเกจ</th>
              <th className="px-4 py-3">สินค้าในแพ็กเกจ</th>
              <th className="px-4 py-3">ราคา</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  Loading…
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  ยังไม่มีแพ็กเกจ
                </td>
              </tr>
            ) : (
              packages.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.nameZh ?? p.nameTh}</div>
                    <div className="text-xs text-neutral-500">{p.nameTh}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {p.items.map((it) => `${it.product.nameTh} ×${it.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">{formatPrice(p.priceCents, p.currency)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        p.active ? "bg-emerald-100 text-emerald-900" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {p.active ? "แสดงแพ็กเกจ" : "ซ่อนอยู่"}
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
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="ml-3 text-xs text-red-600 underline hover:text-red-800"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PackageForm
          pkg={editing}
          products={products}
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

function PackageForm({
  pkg,
  products,
  onClose,
  onSaved,
}: {
  pkg: Package | null;
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    slug: pkg?.slug ?? "",
    nameTh: pkg?.nameTh ?? "",
    nameZh: pkg?.nameZh ?? "",
    nameEn: pkg?.nameEn ?? "",
    descriptionTh: pkg?.descriptionTh ?? "",
    descriptionZh: pkg?.descriptionZh ?? "",
    currency: pkg?.currency ?? "CNY",
    images: (pkg?.images ?? []) as string[],
    active: pkg?.active ?? true,
    items: (pkg?.items ?? []).map((i) => ({ productId: i.productId, quantity: i.quantity })),
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addItem(productId: string) {
    if (form.items.some((i) => i.productId === productId)) return;
    set("items", [...form.items, { productId, quantity: 1 }] as never);
  }
  function updateItemQty(productId: string, qty: number) {
    set(
      "items",
      form.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)) as never,
    );
  }
  function removeItem(productId: string) {
    set("items", form.items.filter((i) => i.productId !== productId) as never);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.items.length === 0) {
      setErr("ต้องมีสินค้าอย่างน้อย 1 รายการในแพ็กเกจ");
      return;
    }
    setSubmitting(true);
    const payload: PackageInput = {
      slug: form.slug,
      nameTh: form.nameTh,
      nameZh: form.nameZh || undefined,
      nameEn: form.nameEn || undefined,
      descriptionTh: form.descriptionTh || undefined,
      descriptionZh: form.descriptionZh || undefined,
      currency: form.currency,
      images: form.images,
      active: form.active,
      items: form.items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
    };
    try {
      if (pkg) await updatePackage(pkg.id, payload);
      else await createPackage(payload);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
      setSubmitting(false);
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  const calculatedCents = form.items.reduce((sum, it) => {
    const product = productMap.get(it.productId);
    if (!product) return sum;
    return sum + product.priceCents * it.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{pkg ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจใหม่"}</h2>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required disabled={!!pkg} />
          <Field label="ชื่อ (ภาษาไทย)" value={form.nameTh} onChange={(v) => set("nameTh", v)} required />
          <Field label="ชื่อ (ภาษาจีน)" value={form.nameZh} onChange={(v) => set("nameZh", v)} />
          <Field label="ชื่อ (ภาษาอังกฤษ)" value={form.nameEn} onChange={(v) => set("nameEn", v)} />
          <Field label="สกุลเงิน" value={form.currency} onChange={(v) => set("currency", v)} />
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

        <div className="mt-4 rounded-md border border-neutral-200 p-3">
          <div className="text-sm font-medium text-neutral-800">สินค้าในแพ็กเกจ</div>
          <p className="mt-0.5 text-xs text-neutral-500">เลือกสินค้าและกำหนดจำนวนต่อ 1 แพ็กเกจ</p>

          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addItem(e.target.value);
              e.target.value = "";
            }}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          >
            <option value="">+ เพิ่มสินค้า...</option>
            {products
              .filter((p) => !form.items.some((i) => i.productId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameTh} {p.nameZh ? `(${p.nameZh})` : ""} — {formatPrice(p.priceCents, p.currency)}
                </option>
              ))}
          </select>

          {form.items.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 py-6 text-center text-xs text-neutral-500">
              ยังไม่มีสินค้าในแพ็กเกจ
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {form.items.map((it) => {
                const product = productMap.get(it.productId);
                const lineTotal = product ? product.priceCents * it.quantity : 0;
                return (
                  <li
                    key={it.productId}
                    className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
                  >
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{product?.nameTh ?? "(ไม่พบสินค้า)"}</div>
                      <div className="text-xs text-neutral-500">
                        {product ? formatPrice(product.priceCents, product.currency) : "-"}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-600">จำนวน</span>
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => updateItemQty(it.productId, Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
                      />
                    </label>
                    <div className="w-24 text-right text-sm font-medium text-neutral-800">
                      {product ? formatPrice(lineTotal, product.currency) : "-"}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(it.productId)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      ลบ
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
            <span className="text-sm font-medium text-neutral-700">ราคาแพ็กเกจรวม</span>
            <span className="text-lg font-bold text-neutral-900">
              {formatPrice(calculatedCents, form.currency)}
            </span>
          </div>
        </div>

        <div className="mt-3 block text-sm">
          <span className="text-neutral-700">รูปภาพแพ็กเกจ</span>
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
            {submitting ? "กำลังบันทึก…" : pkg ? "บันทึกการเปลี่ยนแปลง" : "สร้างแพ็กเกจ"}
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
        <p className="text-xs text-neutral-600">
          {uploading ? "กำลังอัพโหลด..." : "คลิกหรือลากไฟล์รูปมาวางที่นี่"}
        </p>
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
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute right-1 top-1 rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
              >
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
