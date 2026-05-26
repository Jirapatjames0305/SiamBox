"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const LINE_URL = "https://lin.ee/REJN6N4";
const WECHAT_ID = "Siambox";

export function ContactWidget() {
  const t = useTranslations("Contact");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function handleCopyWechat() {
    try {
      await navigator.clipboard.writeText(WECHAT_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-200 ${
          open ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
        }`}
      >
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("lineAria")}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#05b34d] transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          <span>{t("lineLabel")}</span>
        </a>

        <button
          type="button"
          onClick={handleCopyWechat}
          aria-label={t("wechatAria")}
          title={t("wechatCopyHint")}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#07C160] px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#06ad55] transition-colors"
        >
          <WeChatIcon />
          <span>{copied ? t("wechatCopied") : `${t("wechatLabel")}: ${WECHAT_ID}`}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("close") : t("openMenu")}
        aria-expanded={open}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/30 hover:bg-slate-800 transition-colors"
      >
        {open ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function WeChatIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 2.181-6.466 2.038-1.503 4.62-1.875 6.768-1.094-.731-3.708-4.347-6.31-8.765-6.31zM5.785 5.991c.642 0 1.162.529 1.162 1.18 0 .65-.52 1.178-1.162 1.178-.642 0-1.162-.529-1.162-1.179 0-.65.52-1.179 1.162-1.179zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .65-.52 1.178-1.162 1.178-.642 0-1.162-.529-1.162-1.179 0-.65.52-1.179 1.162-1.179zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 5.971.942 2.34 3.503 3.85 6.140 3.85.557 0 1.117-.056 1.659-.197.236-.06.476-.04.668.063l1.604.935a.222.222 0 00.137.04.196.196 0 00.197-.197c0-.057-.022-.114-.038-.17-.005-.026-.226-.86-.346-1.255a.45.45 0 01.196-.566c1.512-1.108 2.5-2.704 2.5-4.524 0-3.348-3.227-5.794-6.677-5.825zm-2.358 2.952c.43 0 .777.346.777.776 0 .43-.346.777-.777.777a.776.776 0 01-.776-.777c0-.43.346-.776.776-.776zm4.658 0c.43 0 .777.346.777.776 0 .43-.346.777-.777.777a.776.776 0 01-.776-.777c0-.43.346-.776.776-.776z"/>
    </svg>
  );
}
