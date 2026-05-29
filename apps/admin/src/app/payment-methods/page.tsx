"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchPaymentMethods, updatePaymentMethods } from "@/lib/api";
import type { PaymentMethodId, PaymentMethodSetting } from "@/lib/types";

const LABELS: Record<PaymentMethodId, string> = {
  MANUAL: "โอนเงินด้วยตนเอง",
  ALIPAY: "Alipay",
  WECHAT_PAY: "WeChat Pay",
  TEST: "ทดสอบ (บัตรเครดิต)",
};

export default function PaymentMethodsPage() {
  const [rows, setRows] = useState<PaymentMethodSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(false);

  useEffect(() => {
    fetchPaymentMethods()
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : (err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const update = (method: PaymentMethodId, patch: Partial<PaymentMethodSetting>) => {
    setSavedAt(false);
    setRows((rs) => rs.map((r) => (r.method === method ? { ...r, ...patch } : r)));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSavedAt(false);
    try {
      const saved = await updatePaymentMethods(rows);
      setRows(saved);
      setSavedAt(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">ช่องทางชำระเงิน</h1>
      <p className="mt-1 text-sm text-neutral-500">
        คุมว่าช่องไหนแสดงในหน้าชำระเงิน — <strong>ปิดใช้งาน</strong> = ยังเห็นแต่กดไม่ได้ (เทา) ·{" "}
        <strong>ซ่อน</strong> = ไม่แสดงให้ลูกค้าเห็นเลย
      </p>

      {loading ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : (
        <div className="mt-8 space-y-3">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-4 text-xs font-medium text-neutral-500">
            <span>ช่องทาง</span>
            <span className="w-20 text-center">ปิดใช้งาน</span>
            <span className="w-20 text-center">ซ่อน</span>
          </div>

          {rows.map((r) => (
            <div
              key={r.method}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 rounded-md border border-neutral-200 px-4 py-3"
            >
              <span className="text-sm font-medium text-neutral-800">
                {LABELS[r.method] ?? r.method}
              </span>
              <label className="flex w-20 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={r.disabled}
                  onChange={(e) => update(r.method, { disabled: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 accent-amber-600"
                />
              </label>
              <label className="flex w-20 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={r.hidden}
                  onChange={(e) => update(r.method, { hidden: e.target.checked })}
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
            {savedAt && <span className="text-sm text-emerald-700">บันทึกแล้ว</span>}
          </div>
        </div>
      )}
    </div>
  );
}
