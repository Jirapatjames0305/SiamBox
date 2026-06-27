"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ConfirmOpts = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};
type AlertOpts = { title?: string; message: string; confirmText?: string };
type PromptOpts = {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
};

type Active =
  | { kind: "confirm"; opts: ConfirmOpts; resolve: (v: boolean) => void }
  | { kind: "alert"; opts: AlertOpts; resolve: () => void }
  | { kind: "prompt"; opts: PromptOpts; resolve: (v: string | null) => void };

type DialogApi = {
  confirm: (opts: ConfirmOpts | string) => Promise<boolean>;
  alert: (opts: AlertOpts | string) => Promise<void>;
  prompt: (opts: PromptOpts | string) => Promise<string | null>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within <DialogProvider>");
  return ctx;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);
  const [value, setValue] = useState("");

  const confirm = useCallback((o: ConfirmOpts | string) => {
    const opts = typeof o === "string" ? { message: o } : o;
    return new Promise<boolean>((resolve) => setActive({ kind: "confirm", opts, resolve }));
  }, []);
  const alert = useCallback((o: AlertOpts | string) => {
    const opts = typeof o === "string" ? { message: o } : o;
    return new Promise<void>((resolve) => setActive({ kind: "alert", opts, resolve }));
  }, []);
  const prompt = useCallback((o: PromptOpts | string) => {
    const opts = typeof o === "string" ? { message: o } : o;
    setValue(opts.defaultValue ?? "");
    return new Promise<string | null>((resolve) => setActive({ kind: "prompt", opts, resolve }));
  }, []);

  function cancel() {
    if (!active) return;
    if (active.kind === "confirm") active.resolve(false);
    else if (active.kind === "prompt") active.resolve(null);
    else active.resolve();
    setActive(null);
  }
  function accept() {
    if (!active) return;
    if (active.kind === "confirm") active.resolve(true);
    else if (active.kind === "prompt") active.resolve(value);
    else active.resolve();
    setActive(null);
  }

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={cancel}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {active.opts.title && (
              <h2 className="text-base font-semibold text-neutral-900">{active.opts.title}</h2>
            )}
            <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{active.opts.message}</p>

            {active.kind === "prompt" && (
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={active.opts.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") accept();
                }}
                className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              {active.kind !== "alert" && (
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  {(active.opts as ConfirmOpts | PromptOpts).cancelText ?? "ยกเลิก"}
                </button>
              )}
              <button
                type="button"
                autoFocus={active.kind !== "prompt"}
                onClick={accept}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                  active.kind === "confirm" && active.opts.danger
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-neutral-900 hover:bg-neutral-800"
                }`}
              >
                {(active.opts as ConfirmOpts).confirmText ?? "ตกลง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
