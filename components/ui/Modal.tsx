"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "drawer" desliza da direita (padrão); "center" abre centralizado. */
  variant?: "drawer" | "center";
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = "drawer",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-colonial/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute bg-neutro shadow-2xl flex flex-col",
          variant === "drawer"
            ? "right-0 top-0 h-full w-full max-w-lg animate-[slideIn_0.2s_ease-out]"
            : "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/5 bg-branco px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-colonial">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-colonial/60">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-colonial/50 transition-colors hover:bg-colonial-50 hover:text-colonial"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer && (
          <div className="border-t border-black/5 bg-branco px-6 py-4">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
