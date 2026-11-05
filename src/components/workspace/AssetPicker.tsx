"use client";

import { sceneAssets } from "@/lib/engine/assets";
import { id } from "@/lib/i18n/id";
import { cn } from "@/lib/utils";

export interface AssetPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}

export function AssetPicker({ value, onChange, max = 4 }: AssetPickerProps) {
  function toggle(assetId: string) {
    if (value.includes(assetId)) {
      onChange(value.filter((item) => item !== assetId));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, assetId]);
  }

  return (
    <div>
      <div className="neu-scroll-x pb-1">
        {sceneAssets.map((asset) => {
          const selected = value.includes(asset.id);
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => toggle(asset.id)}
              aria-pressed={selected}
              aria-label={`${asset.label}: ${asset.description}`}
              className={cn(
                "flex h-[62px] w-[62px] flex-col items-center justify-center gap-0.5 rounded-md border text-[9px] font-bold transition",
                selected
                  ? "border-primary bg-primary-soft text-primary-strong shadow-neu-press"
                  : "border-line bg-bg text-muted shadow-neu-sm hover:border-primary/40"
              )}
            >
              <svg viewBox="0 0 100 100" className="h-6 w-6" aria-hidden="true">
                <path
                  d={asset.path}
                  fill={asset.mode === "fill" ? "currentColor" : "none"}
                  stroke={asset.mode === "stroke" ? "currentColor" : "none"}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="max-w-full truncate px-0.5">{asset.label}</span>
            </button>
          );
        })}
      </div>
      <p className="neu-help">{id.config.assetsHelper.replace("{max}", String(max))} ({value.length}/{max})</p>
    </div>
  );
}
