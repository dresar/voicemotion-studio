"use client";

import { cn, clamp } from "@/lib/utils";

export interface ProgressProps {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  height?: "sm" | "md";
}

export function Progress({ value, label, showValue = false, className, height = "md" }: ProgressProps) {
  const clampedValue = clamp(value, 0, 100);
  return (
    <div className={cn("w-full", className)}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold text-muted">
          {label ? <span className="truncate">{label}</span> : <span />}
          {showValue ? <span className="shrink-0">{Math.round(clampedValue)}%</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedValue)}
        aria-label={label ?? "Progres"}
        className={cn("overflow-hidden rounded-full bg-sunken shadow-neu-in", height === "sm" ? "h-2" : "h-3")}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-strong transition-[width] duration-300 ease-neu"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
