"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDialog } from "@/lib/useDialog";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "full";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeLabel?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "md:max-w-md",
  md: "md:max-w-xl",
  lg: "md:max-w-4xl",
  full: "md:max-w-6xl"
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  className,
  closeLabel = "Tutup"
}: ModalProps) {
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
      <div className="relative flex min-h-full items-end justify-center p-0 md:items-center md:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          aria-label={title ? undefined : "Dialog"}
          tabIndex={-1}
          className={cn(
            "neu-modal neu-fade-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[32px] md:rounded-[32px]",
            sizeClasses[size],
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 md:px-6 md:pt-6">
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
