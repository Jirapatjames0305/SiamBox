"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ApiError,
  approvePayment,
  createShipment,
  fetchOrder,
  refundPayment,
  rejectPayment,
  updateOrder,
} from "@/lib/api";
import {
  ORDER_STATUSES,
  STATUS_LABEL_TH,
  formatDate,
  formatPrice,
  statusBadgeClass,
} from "@/lib/format";
import type { Order } from "@/lib/types";
import { useDialog } from "@/components/Dialog";

const CARRIERS = ["EMS", "DHL", "FEDEX", "OTHER"] as const;

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const { confirm, prompt } = useDialog();
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchOrder(orderNumber);
      setOrder(data);
      setNote(data.internalNote ?? "");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    }
  }, [orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!order) {
    return <div className="p-10 text-sm text-neutral-500">Loading…</div>;
  }

  async function changeStatus(status: string) {
    setSavingStatus(true);
    try {
      await updateOrder(orderNumber, { status });
      await load();
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveNote() {
    setSavingNote(true);
    try {
      await updateOrder(orderNumber, { internalNote: note });
      await load();
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href="/orders" className="text-xs text-neutral-500 underline">
            ← ออเดอร์
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-neutral-500">สั่งเมื่อ {formatDate(order.placedAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/orders/${order.orderNumber}/label`}
            target="_blank"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-500"
          >
            พิมพ์ใบจัดส่ง
          </Link>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(order.status)}`}>
            {STATUS_LABEL_TH[order.status as keyof typeof STATUS_LABEL_TH] ?? order.status}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="รายการสินค้า">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-neutral-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">
                      <div>{item.productNameZh ?? item.productNameTh}</div>
                      <div className="text-xs text-neutral-500">{item.productNameTh}</div>
                    </td>
                    <td className="py-2 text-right text-neutral-600">× {item.quantity}</td>
                    <td className="py-2 text-right">{formatPrice(item.totalCents, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr className="border-t border-neutral-200">
                  <td className="py-2 text-neutral-500" colSpan={2}>ราคาสินค้ารวม</td>
                  <td className="py-2 text-right">{formatPrice(order.subtotalCents, order.currency)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-neutral-500" colSpan={2}>ค่าจัดส่ง</td>
                  <td className="py-2 text-right">{formatPrice(order.shippingCents, order.currency)}</td>
                </tr>
                <tr className="border-t border-neutral-200 font-semibold">
                  <td className="py-2" colSpan={2}>ยอดรวมทั้งหมด</td>
                  <td className="py-2 text-right">{formatPrice(order.totalCents, order.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {order.shippingAddress && (
            <Card title="ที่อยู่จัดส่ง">
              <div className="text-sm text-neutral-700">
                <div className="font-medium">
                  {order.shippingAddress.recipient} · {order.shippingAddress.phone}
                </div>
                {order.shippingAddress.wechatId && (
                  <div className="text-xs text-neutral-500">WeChat: {order.shippingAddress.wechatId}</div>
                )}
                <div className="mt-1">
                  {order.shippingAddress.province} {order.shippingAddress.city}{" "}
                  {order.shippingAddress.district ?? ""} {order.shippingAddress.street}
                </div>
                <div className="text-neutral-500">รหัสไปรษณีย์ {order.shippingAddress.postalCode}</div>
              </div>
            </Card>
          )}

          <Card title="การชำระเงิน">
            {order.payments.length === 0 ? (
              <p className="text-sm text-neutral-500">ยังไม่มีรายการชำระเงิน</p>
            ) : (
              <ul className="divide-y divide-neutral-100 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {p.method} · {formatPrice(p.amountCents, p.currency)}
                      </div>
                      <div className="text-xs text-neutral-500">{formatDate(p.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                      {p.status === "PENDING" || p.status === "SUBMITTED" ? (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              await approvePayment(p.id);
                              await load();
                            }}
                            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await rejectPayment(p.id);
                              await load();
                            }}
                            className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700 hover:border-neutral-500"
                          >
                            ปฏิเสธ
                          </button>
                        </>
                      ) : p.status === "APPROVED" ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const reason = await prompt({
                              title: "คืนเงิน",
                              message: "เหตุผลคืนเงิน (ไม่บังคับ):",
                              placeholder: "เหตุผล…",
                              confirmText: "ถัดไป",
                            });
                            if (reason === null) return;
                            const alsoOrder = await confirm(
                              "เปลี่ยนสถานะออเดอร์เป็น REFUNDED ด้วยหรือไม่?",
                            );
                            await refundPayment(p.id, {
                              reason: reason || undefined,
                              alsoRefundOrder: alsoOrder,
                            });
                            await load();
                          }}
                          className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                        >
                          คืนเงิน
                        </button>
                      ) : null}
                    </div>
                    </div>
                    {p.slipUrl && (
                      <a href={p.slipUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.slipUrl}
                          alt="สลิปการโอน"
                          className="h-28 w-28 rounded-md border border-neutral-200 object-cover hover:opacity-90"
                        />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="การจัดส่ง">
            {order.shipments && order.shipments.length > 0 ? (
              <ul className="divide-y divide-neutral-100 text-sm">
                {order.shipments.map((s) => (
                  <li key={s.id} className="py-2">
                    <div className="font-medium">
                      {s.carrier} · {s.trackingNumber}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {s.weightGrams ? `${s.weightGrams}g · ` : ""}{formatDate(s.shippedAt ?? s.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">ยังไม่ได้ส่ง</p>
            )}
            <ShipmentForm orderNumber={order.orderNumber} onCreated={load} />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="เปลี่ยนสถานะ">
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={savingStatus || s === order.status}
                  onClick={() => changeStatus(s)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    s === order.status
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                  } disabled:opacity-50`}
                >
                  {STATUS_LABEL_TH[s]}
                </button>
              ))}
            </div>
          </Card>

          <Card title="หมายเหตุจากลูกค้า">
            <p className="whitespace-pre-wrap text-sm text-neutral-700">
              {order.customerNote || <span className="text-neutral-400">—</span>}
            </p>
          </Card>

          <Card title="โน้ตภายใน">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <button
              type="button"
              onClick={saveNote}
              disabled={savingNote}
              className="mt-2 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
            >
              {savingNote ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-700">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ShipmentForm({ orderNumber, onCreated }: { orderNumber: string; onCreated: () => void }) {
  const [carrier, setCarrier] = useState<(typeof CARRIERS)[number]>("EMS");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await createShipment(orderNumber, {
        carrier,
        trackingNumber,
        weightGrams: weight ? Number(weight) : undefined,
      });
      setTrackingNumber("");
      setWeight("");
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-4 text-sm">
      <label className="flex flex-col">
        <span className="text-xs text-neutral-500">ขนส่ง</span>
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value as (typeof CARRIERS)[number])}
          className="h-9 rounded-md border border-neutral-300 px-2 outline-none focus:border-neutral-500"
        >
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col">
        <span className="text-xs text-neutral-500">เลข Tracking</span>
        <input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          required
          className="h-9 rounded-md border border-neutral-300 px-2 outline-none focus:border-neutral-500"
        />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-neutral-500">น้ำหนัก (g)</span>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-9 w-24 rounded-md border border-neutral-300 px-2 outline-none focus:border-neutral-500"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="h-9 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
      >
        {submitting ? "..." : "เพิ่มการจัดส่ง"}
      </button>
      {err && <div className="basis-full text-xs text-red-600">{err}</div>}
    </form>
  );
}
