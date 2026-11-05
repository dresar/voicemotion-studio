import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon = "sparkles", title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`neu-dashed flex flex-col items-center justify-center px-4 text-center ${compact ? "py-6" : "py-10"}`}>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-muted shadow-neu-in">
        <Icon name={icon} size={24} />
      </span>
      <p className="text-sm font-extrabold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
