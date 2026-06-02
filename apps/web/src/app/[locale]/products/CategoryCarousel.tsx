"use client";

import { useRef } from "react";
import type { Product } from "@/lib/api";
import { ProductCard } from "./ProductCard";

export function CategoryCarousel({ products, minCents = 0 }: { products: Product[]; minCents?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div className="group/carousel relative">
      <div
        ref={ref}
        className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ProductCard product={p} minCents={minCents} />
          </div>
        ))}
      </div>

      {products.length > 2 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous"
            className="absolute left-0 top-[40%] hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 sm:flex"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next"
            className="absolute right-0 top-[40%] hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 sm:flex"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
