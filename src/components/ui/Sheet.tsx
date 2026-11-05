"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDialog } from "@/lib/useDialog";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tall?: boolean;
  closeLabel?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  tall = false,
  closeLabel = "Tutup"
}: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useDialog(open, onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="neu-overlay absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          aria-label={title ? undefined : "Panel"}
          tabIndex={-1}
          className={cn(
            "neu-modal neu-fade-in relative flex w-full flex-col overflow-hidden rounded-t-[32px] md:max-w-2xl md:rounded-[32px]",
            tall ? "h-[94dvh] md:h-[86dvh]" : "max-h-[92dvh] md:max-h-[84dvh]",
            className
          )}
        >
          <div className="flex justify-center pb-1 pt-3 md:hidden">
            <span className="h-1.5 w-12 rounded-full bg-line" aria-hidden="true" />
          </div>
          <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-2 md:px-6 md:pt-5">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="text-xl font-extrabold tracking-tight text-ink">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg text-muted shadow-neu-sm hover:text-ink active:shadow-neu-press"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
          <div className="neu-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-3 md:px-6">{children}</div>
          {footer ? <div className="safe-bottom border-t border-line bg-raised px-5 pt-3 md:px-6">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
