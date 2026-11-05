"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { id } from "@/lib/i18n/id";

export interface TrialStripProps {
  daysLeft: number;
  expired: boolean;
  onDismiss: () => void;
}

export function TrialStrip({ daysLeft, expired, onDismiss }: TrialStripProps) {
  return (
    <div
      className={`flex items-center gap-2 border-b px-4 py-2 text-xs font-bold ${
        expired ? "border-danger/20 bg-danger/10 text-danger" : "border-warning/20 bg-warning/10 text-warning"
      }`}
      role="status"
    >
      <Icon name="clock" size={15} className="shrink-0" />
      <p className="min-w-0 flex-1 truncate">
        {expired ? id.workspace.trialEnded : id.workspace.trialLeft.replace("{days}", String(daysLeft))}
      </p>
      <Link href="/harga/" className="shrink-0 underline underline-offset-2 hover:text-primary-strong">
        {id.common.seePricing}
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={id.common.dismiss}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
