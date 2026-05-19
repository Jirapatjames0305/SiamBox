"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, fetchOrder } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Order } from "@/lib/types";

// Override these in apps/admin/src/lib/sender.ts later if you want
const SENDER = {
  name: "SiamBox",
  addressLine1: "[Sender address line 1]",
  addressLine2: "[Sender address line 2]",
  phone: "[Sender phone]",
};

export default function ShippingLabelPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchOrder(orderNumber);
      setOrder(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    }
  }, [orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <div className="p-10 text-sm text-red-700">{error}</div>;
  }
  if (!order) {
    return <div className="p-10 text-sm text-neutral-500">Loading…</div>;
  }

  const addr = order.shippingAddress;
  const shipment = order.shipments?.[0];
  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalWeightG = shipment?.weightGrams;

  return (
    <>
      <style>{`
        @page { size: A5; margin: 8mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Controls (hidden on print) */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-6 py-3">
        <a href={`/orders/${orderNumber}`} className="text-sm text-neutral-600 underline">
          ← กลับไปที่ออเดอร์
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          พิมพ์
        </button>
      </div>

      {/* Label */}
      <div className="mx-auto my-6 max-w-[148mm] bg-white p-6 text-sm shadow-sm print:my-0 print:shadow-none">
        {/* From */}
        <div className="text-[10px] uppercase tracking-widest text-neutral-500">From / 发件人</div>
        <div className="mt-1 leading-tight">
          <div className="font-semibold">{SENDER.name}</div>
          <div className="text-neutral-600">{SENDER.addressLine1}</div>
          <div className="text-neutral-600">{SENDER.addressLine2}</div>
          <div className="text-neutral-600">Tel: {SENDER.phone}</div>
        </div>

        <hr className="my-4 border-neutral-300" />

        {/* To */}
        <div className="text-[10px] uppercase tracking-widest text-neutral-500">To / 收件人</div>
        {addr ? (
          <div className="mt-1 leading-snug">
            <div className="text-lg font-bold">{addr.recipient}</div>
            <div className="mt-1 text-base">{addr.phone}</div>
            {addr.wechatId && (
              <div className="text-xs text-neutral-500">WeChat: {addr.wechatId}</div>
            )}
            <div className="mt-2 text-base leading-snug">
              {addr.province} {addr.city} {addr.district ?? ""}
              <br />
              {addr.street}
            </div>
            <div className="mt-1 font-mono text-base">邮编 {addr.postalCode}</div>
          </div>
        ) : (
          <div className="mt-1 text-neutral-400">— No address —</div>
        )}

        <hr className="my-4 border-neutral-300" />

        {/* Order info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Order #</div>
            <div className="mt-0.5 font-mono text-sm font-semibold">{order.orderNumber}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Date</div>
            <div className="mt-0.5 text-sm">{formatDate(order.placedAt)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Items</div>
            <div className="mt-0.5 text-sm">{order.items.length} SKU · {totalQty} ชิ้น</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Weight</div>
            <div className="mt-0.5 text-sm">{totalWeightG ? `${totalWeightG} g` : "—"}</div>
          </div>
        </div>

        <hr className="my-4 border-neutral-300" />

        {/* Items list */}
        <div className="text-[10px] uppercase tracking-widest text-neutral-500">Items</div>
        <ul className="mt-1 space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-xs">
              <span className="flex-1 pr-2">
                {item.productNameZh ?? item.productNameTh}
              </span>
              <span className="font-mono">× {item.quantity}</span>
            </li>
          ))}
        </ul>

        {shipment && (
          <>
            <hr className="my-4 border-neutral-300" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase text-neutral-500">Carrier</div>
                <div className="mt-0.5 text-base font-bold">{shipment.carrier}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-neutral-500">Tracking #</div>
                <div className="mt-0.5 break-all font-mono text-base font-bold">{shipment.trackingNumber}</div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-6 border-t border-neutral-200 pt-2 text-center text-[10px] text-neutral-400">
          SiamBox · Cross-Border Shipping · Thailand → China
        </div>
      </div>
    </>
  );
}
