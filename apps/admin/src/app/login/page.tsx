"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, pingAuth } from "@/lib/api";
import { setToken, clearToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [token, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setToken(token);
    try {
      await pingAuth();
      router.replace("/");
    } catch (err) {
      clearToken();
      if (err instanceof ApiError && err.status === 401) {
        setError("Token ไม่ถูกต้อง");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">SiamBox Admin</h1>
        <p className="mt-1 text-sm text-neutral-500">ใส่ admin token เพื่อเข้าใช้งาน</p>

        <label className="mt-6 block text-sm">
          <span className="text-neutral-700">Admin Token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
            autoFocus
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-500"
          />
        </label>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !token}
          className="mt-6 w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p className="mt-4 text-xs text-neutral-500">
          Token ตั้งจาก <code>ADMIN_TOKEN</code> ใน <code>.env</code> ของ apps/api
        </p>
      </form>
    </main>
  );
}
