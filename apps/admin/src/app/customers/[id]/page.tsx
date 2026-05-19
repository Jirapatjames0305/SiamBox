"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ApiError,
  addCustomerNote,
  deleteCustomerNote,
  fetchCustomer,
  updateCustomer,
} from "@/lib/api";
import { STATUS_LABEL_TH, formatDate, formatPrice, statusBadgeClass } from "@/lib/format";
import type { Customer } from "@/lib/types";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchCustomer(id);
      setCustomer(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    }
  }, [id]);

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

  if (!customer) {
    return <div className="p-10 text-sm text-neutral-500">Loading…</div>;
  }

  async function toggleStatus() {
    if (!customer) return;
    setStatusBusy(true);
    try {
      const next = customer.status === "BLACKLISTED" ? "ACTIVE" : "BLACKLISTED";
      await updateCustomer(customer.id, { status: next });
      await load();
    } finally {
      setStatusBusy(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setSubmitting(true);
    try {
      await addCustomerNote(id, noteBody.trim());
      setNoteBody("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeNote(noteId: string) {
    if (!confirm("ลบโน้ตนี้?")) return;
    await deleteCustomerNote(id, noteId);
    await load();
  }

  const totalSpent = customer.orders?.reduce((sum, o) => sum + o.totalCents, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/customers" className="text-xs text-neutral-500 underline">
        ← ลูกค้า
      </Link>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name ?? "—"}</h1>
          <p className="mt-1 text-sm text-neutral-500">{customer.phone ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={statusBusy}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            customer.status === "BLACKLISTED"
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-red-600 text-white hover:bg-red-700"
          } disabled:opacity-50`}
        >
          {statusBusy
            ? "..."
            : customer.status === "BLACKLISTED"
              ? "เอาออกจาก Blacklist"
              : "เพิ่มเข้า Blacklist"}
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="ข้อมูลลูกค้า">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info label="เบอร์โทร" value={customer.phone} />
              <Info label="WeChat" value={customer.wechatId} />
              <Info label="Email" value={customer.email} />
              <Info label="สถานะ" value={
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                  customer.status === "BLACKLISTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-900"
                }`}>
                  {customer.status === "BLACKLISTED" ? "Blacklist" : "ปกติ"}
                </span>
              } />
              <Info label="สมัครเมื่อ" value={formatDate(customer.createdAt)} />
              <Info label="ออเดอร์ทั้งหมด" value={`${customer.orders?.length ?? 0} ออเดอร์`} />
              <Info label="ยอดซื้อรวม" value={formatPrice(totalSpent)} />
            </dl>
          </Card>

          <Card title={`ประวัติออเดอร์ (${customer.orders?.length ?? 0})`}>
            {!customer.orders || customer.orders.length === 0 ? (
              <p className="text-sm text-neutral-500">ยังไม่มีออเดอร์</p>
            ) : (
              <ul className="divide-y divide-neutral-100 text-sm">
                {customer.orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <Link href={`/orders/${o.orderNumber}`} className="font-medium underline">
                        {o.orderNumber}
                      </Link>
                      <div className="text-xs text-neutral-500">
                        {formatDate(o.placedAt)} · {o.items.length} รายการ
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatPrice(o.totalCents, o.currency)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(o.status)}`}>
                        {STATUS_LABEL_TH[o.status as keyof typeof STATUS_LABEL_TH] ?? o.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="โน้ตเกี่ยวกับลูกค้า">
            <form onSubmit={addNote} className="space-y-2">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                placeholder="เพิ่มโน้ต..."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
              <button
                type="submit"
                disabled={submitting || !noteBody.trim()}
                className="w-full rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
              >
                {submitting ? "กำลังบันทึก..." : "เพิ่มโน้ต"}
              </button>
            </form>

            {customer.notes && customer.notes.length > 0 && (
              <ul className="mt-4 space-y-3 border-t border-neutral-100 pt-4 text-sm">
                {customer.notes.map((n) => (
                  <li key={n.id} className="group">
                    <p className="whitespace-pre-wrap text-neutral-700">{n.body}</p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">{formatDate(n.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => removeNote(n.id)}
                        className="text-red-500 opacity-0 transition group-hover:opacity-100 hover:underline"
                      >
                        ลบ
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-0.5">{value ?? "—"}</dd>
    </div>
  );
}
