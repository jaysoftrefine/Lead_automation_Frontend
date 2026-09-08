import React from "react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  perPage?: number;
  onPageChange: (newPage: number) => void;
  itemLabel?: string;
}

export function Pagination({
  page,
  totalPages,
  totalResults,
  perPage = 25,
  onPageChange,
  itemLabel = "items",
}: PaginationProps) {
  if (totalPages <= 1 && totalResults <= 0) return null;

  const start = totalResults > 0 ? (page - 1) * perPage + 1 : 0;
  const end = Math.min(page * perPage, totalResults);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
        padding: "0.75rem 0.25rem",
      }}
    >
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Showing <strong>{start} - {end}</strong> of <strong>{totalResults}</strong> {itemLabel}
      </div>

      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: "0.78rem", padding: "4px 9px" }}
        >
          &lt;
        </button>

        {getPageNumbers().map((pageNum) => {
          const isActive = pageNum === page;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: isActive ? 700 : 500,
                background: isActive ? "#ea580c" : "var(--bg-secondary)",
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                boxShadow: isActive ? "0 2px 8px rgba(234, 88, 12, 0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {totalPages > 5 && page < totalPages - 2 && (
          <span
            style={{
              padding: "0 4px",
              color: "var(--text-dim)",
              fontSize: "0.78rem",
            }}
          >
            ... {totalPages}
          </span>
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: "0.78rem", padding: "4px 9px" }}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export default Pagination;
