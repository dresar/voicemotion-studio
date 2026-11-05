"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  done?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
  panelIdPrefix?: string;
}

export function Tabs({ items, value, onChange, ariaLabel, className, panelIdPrefix = "tab" }: TabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("no-scrollbar flex w-full gap-1 overflow-x-auto", className)}>
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            id={`${panelIdPrefix}-${item.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`${panelIdPrefix}-panel-${item.id}`}
            aria-disabled={item.disabled || undefined}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "neu-tab relative flex min-h-[34px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
              isActive ? "text-primary-strong" : "text-muted",
              item.disabled && "cursor-not-allowed",
              !item.disabled && "hover:bg-bg-sunken"
            )}
          >
            <span className="flex items-center gap-1">
              {item.disabled ? <Icon name="lock" size={11} /> : item.done ? <Icon name="checkCircle" size={12} className="text-success" /> : null}
              {item.icon}
              <span className="truncate">{item.label}</span>
              {item.badge !== undefined ? (
                <span className="rounded-full bg-primary-soft px-1 py-0.2 text-[9px] font-extrabold text-primary-strong">
                  {item.badge}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "absolute inset-x-2 bottom-0 h-[2px] rounded-t-full transition-opacity",
                isActive ? "bg-primary opacity-100" : "opacity-0"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
