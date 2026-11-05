"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  children: ReactNode;
}

export function Chip({ pressed = false, dismissible = false, onDismiss, className, children, type = "button", ...rest }: ChipProps) {
  return (
    <span className="inline-flex items-center">
      <button
        type={type}
        aria-pressed={pressed}
        className={cn("neu-chip", dismissible && "rounded-r-none pr-3", className)}
        {...rest}
      >
        {children}
      </button>
      {dismissible ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Hapus chip"
          className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-r-full bg-bg text-muted shadow-neu-sm hover:text-danger"
        >
          <Icon name="x" size={14} />
        </button>
      ) : null}
    </span>
  );
}
