"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        Prev
      </button>
      {visible.map((p, idx) => {
        const showGap = idx > 0 && visible[idx - 1] !== p - 1;
        return (
          <div key={p} className="flex items-center gap-1">
            {showGap && <span className="px-2 text-zinc-400">...</span>}
            <button
              onClick={() => onChange(p)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                p === page
                  ? "border-indigo-600 bg-indigo-600 font-medium text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {p}
            </button>
          </div>
        );
      })}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
