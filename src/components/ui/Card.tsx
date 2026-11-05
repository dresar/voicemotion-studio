"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "raised" | "inset" | "flat";
type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  selected?: boolean;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  raised: "neu-card",
  inset: "bg-sunken shadow-neu-in rounded-lg",
  flat: "bg-bg rounded-lg border border-line"
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5 md:p-6"
};

export function Card({
  variant = "raised",
  padding = "md",
  interactive = false,
  selected = false,
  className,
  children,
  onClick,
  onKeyDown,
  ...rest
}: CardProps) {
  const classNames = cn(
    variantClasses[variant],
    paddingClasses[padding],
    interactive && "neu-card--interactive text-left",
    selected && "is-selected",
    className
  );

  if (interactive || onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
          onKeyDown?.(event);
        }}
        aria-pressed={selected}
        className={classNames}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}
