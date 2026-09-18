"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const max = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-md" : "max-w-xl";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${max}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[14px]">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end gap-2 surface-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
