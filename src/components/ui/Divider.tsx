import { cn } from "@/lib/utils";

export interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={cn("neu-divider", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
