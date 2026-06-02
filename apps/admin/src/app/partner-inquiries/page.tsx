"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  deletePartnerInquiry,
  fetchPartnerInquiries,
  setPartnerInquiryStatus,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { PartnerInquiry } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  wholesale: "ขายส่ง",
  oem: "OEM / รับผลิต",
  distributor: "ตัวแทนจำหน่าย",
  crossborder: "ค้าข้ามพรมแดน",
  other: "อื่น ๆ",
};

export default function PartnerInquiriesPage() {
  const [rows, setRows] = useState<PartnerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchPartnerInquiries());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const newCount = rows.filter((r) => r.status === "NEW").length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">พันธมิตร</h1>
        <span className="text-sm text-neutral-500">{newCount} รายการใหม่</span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">คำขอเป็นพันธมิตรจากหน้าเว็บ — ติดต่อกลับได้จากข้อมูลด้านล่าง</p>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 text-sm text-neutral-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
          ยังไม่มีคำขอเป็นพันธมิตร
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className={`rounded-lg border p-4 ${
                r.status === "CONTACTED" ? "border-neutral-200 bg-neutral-50 opacity-70" : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-900">{r.companyName}</span>
                    {r.partnerType && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        {TYPE_LABEL[r.partnerType] ?? r.partnerType}
                      </span>
                    )}
                    {r.status === "NEW" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">ใหม่</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        ติดต่อแล้ว
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">ผู้ติดต่อ: {r.contactName}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                    <a href={`tel:${r.contact}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                      {r.contact}
                    </a>
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true"><path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                        {r.email}
                      </a>
                    )}
                  </div>
                  {r.message && <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">{r.message}</p>}
                  <div className="mt-1.5 text-xs text-neutral-400">{formatDate(r.createdAt)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await setPartnerInquiryStatus(r.id, r.status === "CONTACTED" ? "NEW" : "CONTACTED");
                      await load();
                    }}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700 hover:border-neutral-500"
                  >
                    {r.status === "CONTACTED" ? "ทำเครื่องหมายว่ายังไม่ติดต่อ" : "ติดต่อแล้ว"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("ลบรายการนี้?")) return;
                      await deletePartnerInquiry(r.id);
                      await load();
                    }}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
