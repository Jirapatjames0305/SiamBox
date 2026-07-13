"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchSettings, setPurchaseLimitEnabled, updateSettings } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { QrUpload } from "@/components/QrUpload";

type FormState = Omit<Settings, "id" | "updatedAt">;

const EMPTY: FormState = {
  senderName: "",
  senderAddressLine1: "",
  senderAddressLine2: "",
  senderPhone: "",
  shippingBaseCents: 0,
  shippingExpressCents: 0,
  customPackageMinCents: 0,
  purchaseLimitEnabled: true,
  bankQrUrl: "",
  bankAccountName: "",
  bankAccountNumber: "",
  storeWechatId: "",
  alipayQrUrl: "",
  wechatQrUrl: "",
  alipayMode: "QR",
  wechatMode: "QR",
  heroBgUrl: "",
  storiesBgUrl: "",
  brandsBgUrl: "",
  partnerBgUrl: "",
  faviconUrl: "",
  logoUrl: "",
  contactLineUrl: "",
  contactWechatId: "",
  contactWechatQrUrl: "",
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
          shippingExpressCents: s.shippingExpressCents,
          customPackageMinCents: s.customPackageMinCents,
          purchaseLimitEnabled: s.purchaseLimitEnabled,
          bankQrUrl: s.bankQrUrl,
          bankAccountName: s.bankAccountName,
          bankAccountNumber: s.bankAccountNumber,
          storeWechatId: s.storeWechatId,
          alipayQrUrl: s.alipayQrUrl,
          wechatQrUrl: s.wechatQrUrl,
          alipayMode: s.alipayMode,
          wechatMode: s.wechatMode,
          heroBgUrl: s.heroBgUrl,
          storiesBgUrl: s.storiesBgUrl,
          brandsBgUrl: s.brandsBgUrl,
          partnerBgUrl: s.partnerBgUrl,
          faviconUrl: s.faviconUrl,
          logoUrl: s.logoUrl,
          contactLineUrl: s.contactLineUrl,
          contactWechatId: s.contactWechatId,
          contactWechatQrUrl: s.contactWechatQrUrl,
        });
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : (err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // ---- purchase-limit toggle (แยกจากฟอร์มหลัก มีผลทันที) ----
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmToken, setConfirmToken] = useState("");
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  async function toggleLimit() {
    if (form.purchaseLimitEnabled) {
      // ปิดต้องยืนยันรหัสแอดมินก่อน
      setConfirmToken("");
      setConfirmErr(null);
      setConfirmOpen(true);
      return;
    }
    setToggling(true);
    try {
      const s = await setPurchaseLimitEnabled(true);
      setForm((f) => ({ ...f, purchaseLimitEnabled: s.purchaseLimitEnabled }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setToggling(false);
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setToggling(true);
    setConfirmErr(null);
    try {
      const s = await setPurchaseLimitEnabled(false, confirmToken);
      setForm((f) => ({ ...f, purchaseLimitEnabled: s.purchaseLimitEnabled }));
      setConfirmOpen(false);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setConfirmErr(status === 403 ? "รหัสแอดมินไม่ถูกต้อง" : (err as Error).message);
    } finally {
      setToggling(false);
    }
  }

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
            <h2 className="text-sm font-semibold text-neutral-800">จำกัดจำนวนซื้อ (สินค้าเสี่ยงภาษีนำเข้าจีน)</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              บังคับเพดาน &quot;จำกัดซื้อ/ออร์เดอร์&quot; ที่ตั้งไว้รายสินค้า — มีผลทันที ไม่ต้องกดบันทึก
              และการปิดต้องยืนยันรหัสแอดมิน
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleLimit}
                disabled={toggling}
                aria-pressed={form.purchaseLimitEnabled}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  form.purchaseLimitEnabled ? "bg-emerald-500" : "bg-neutral-300"
                } ${toggling ? "opacity-60" : ""}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    form.purchaseLimitEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${form.purchaseLimitEnabled ? "text-emerald-700" : "text-neutral-500"}`}>
                {form.purchaseLimitEnabled ? "เปิดใช้งานอยู่" : "ปิดอยู่ — ลูกค้าซื้อได้ไม่จำกัด"}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-semibold text-neutral-800">ติดต่อแอดมิน</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              ช่องทางติดต่อที่แสดงในปุ่ม &quot;ติดต่อแอดมิน&quot; และ footer บนหน้าเว็บลูกค้า
            </p>
            <div className="mt-3 space-y-3">
              <Field
                label="ลิงก์ LINE (URL)"
                value={form.contactLineUrl}
                onChange={(v) => setForm({ ...form, contactLineUrl: v })}
                placeholder="https://lin.ee/xxxxxxx"
              />
              <Field
                label="WeChat ID"
                value={form.contactWechatId}
                onChange={(v) => setForm({ ...form, contactWechatId: v })}
                placeholder="admin_Siambox"
              />
              <QrUpload
                label="QR Code WeChat"
                value={form.contactWechatQrUrl}
                onChange={(v) => setForm({ ...form, contactWechatQrUrl: v })}
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

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
          <form onSubmit={confirmDisable} className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-red-700">ยืนยันการปิดเงื่อนไขจำกัดซื้อ</h2>
            <p className="mt-2 text-sm text-neutral-600">
              เมื่อปิด ลูกค้าจะสั่งสินค้ากลุ่มเสี่ยงภาษีนำเข้าจีนได้ไม่จำกัดจำนวน
              พัสดุมีโอกาสโดนเก็บภาษีหรือถูกตีกลับสูงขึ้น
            </p>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-neutral-700">กรอกรหัสแอดมินเพื่อยืนยัน</span>
              <input
                type="password"
                value={confirmToken}
                onChange={(e) => setConfirmToken(e.target.value)}
                autoFocus
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </label>
            {confirmErr && (
              <p className="mt-2 text-sm text-red-600">{confirmErr}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={toggling || !confirmToken}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {toggling ? "กำลังปิด…" : "ยืนยันปิดการจำกัดซื้อ"}
              </button>
            </div>
          </form>
        </div>
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
