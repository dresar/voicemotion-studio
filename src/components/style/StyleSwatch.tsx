import { cn } from "@/lib/utils";
import type { StylePack } from "@/types";

export function StyleSwatch({ style, className }: { style: StylePack | null; className?: string }) {
  const palette = style?.palette ?? ["#E4EBF5", "#3F7BFF", "#2A62E0", "#1F2D4A"];
  return (
    <span
      className={cn("grid grid-cols-2 gap-0.5 overflow-hidden rounded-md bg-sunken p-1 shadow-neu-in", className)}
      aria-hidden="true"
    >
      {palette.slice(0, 4).map((color, index) => (
        <span key={`${color}-${index}`} className="rounded-[3px]" style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}
