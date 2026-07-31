"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchPaymentProviders, updatePaymentProviders } from "@/lib/api";
import type { PaymentProviderId, PaymentProviderSetting } from "@/lib/types";

// One line each on why a merchant would pick this gateway — see
// docs/payment-gateway-china.md for the full comparison.
const NOTES: Record<PaymentProviderId, string> = {
  ksher: "เจ้าไทยที่โฟกัส cross-border จีนโดยตรง — Alipay + WeChat Pay",
  opn: "เดิมคือ Omise — API ดีที่สุดในกลุ่มเจ้าไทย, Alipay + WeChat Pay",
  "2c2p": "เจ้าใหญ่ บริษัทลูกของ Ant Group — Alipay (WeChat ต้องยืนยันกับ 2C2P)",
};

const ENV_KEYS: Record<PaymentProviderId, string> = {
  ksher: "KSHER_APPID + KSHER_API_TOKEN",
  opn: "OPN_SECRET_KEY",
  "2c2p": "TWOCTWOP_MERCHANT_ID + TWOCTWOP_SECRET_KEY",
};

export default function PaymentProvidersPage() {
  const [rows, setRows] = useState<PaymentProviderSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPaymentProviders()
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : (err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const update = (provider: PaymentProviderId, patch: Partial<PaymentProviderSetting>) => {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.provider === provider ? { ...r, ...patch } : r)));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePaymentProviders(rows);
      setRows(await fetchPaymentProviders());
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const usable = rows.filter((r) => r.configured && !r.hidden && !r.disabled).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Payment Gateway</h1>
      <p className="mt-1 text-sm text-neutral-500">
        เลือกว่าจะให้ลูกค้าเลือกจ่ายผ่าน gateway เจ้าไหนได้บ้าง ตอนที่ Alipay / WeChat Pay
        ตั้งเป็นโหมด <strong>Gateway</strong> (ตั้งโหมดได้ที่หน้า &ldquo;บัญชีรับโอน&rdquo;)
      </p>

      {loading ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : (
        <div className="mt-8 space-y-3">
          {usable === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              ยังไม่มี gateway ที่ลูกค้าเลือกได้ — หน้าชำระเงินจะใช้ QR + แนบสลิปแทน
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-4 text-xs font-medium text-neutral-500">
            <span>ผู้ให้บริการ</span>
            <span className="w-20 text-center">ปิดใช้งาน</span>
            <span className="w-20 text-center">ซ่อน</span>
          </div>

          {rows.map((r) => (
            <div
              key={r.provider}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 rounded-md border border-neutral-200 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-neutral-800">{r.label}</span>
                  {r.configured ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">
                      ตั้งค่าแล้ว
                    </span>
                  ) : (
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
                      ยังไม่มี credentials
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{NOTES[r.provider]}</p>
                {!r.configured && (
                  <p className="mt-0.5 text-xs text-neutral-400">
                    ใส่ <code className="font-mono">{ENV_KEYS[r.provider]}</code> ใน .env
                    แล้วรีสตาร์ท API
                  </p>
                )}
              </div>
              <label className="flex w-20 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={r.disabled}
                  onChange={(e) => update(r.provider, { disabled: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 accent-amber-600"
                />
              </label>
              <label className="flex w-20 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={r.hidden}
                  onChange={(e) => update(r.provider, { hidden: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
                />
              </label>
            </div>
          ))}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            {saved && <span className="text-sm text-emerald-700">บันทึกแล้ว</span>}
          </div>
        </div>
      )}
    </div>
  );
}
