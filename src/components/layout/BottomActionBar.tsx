"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export interface BottomActionBarProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  primaryIcon?: ReactNode;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
  secondaryLoading?: boolean;
  secondaryIcon?: ReactNode;
}

export function BottomActionBar({
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  primaryDisabled = false,
  primaryIcon,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
  secondaryLoading = false,
  secondaryIcon
}: BottomActionBarProps) {
  return (
    <div className="neu-actionbar z-30 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0">
      <div className="mx-auto flex w-full max-w-3xl gap-2">
        {secondaryLabel && onSecondary ? (
          <Button
            variant="secondary"
            onClick={onSecondary}
            disabled={secondaryDisabled}
            loading={secondaryLoading}
            leftIcon={secondaryIcon ?? <Icon name="copy" size={18} />}
            className="shrink-0 px-3 sm:px-4"
            aria-label={secondaryLabel}
          >
            <span className="hidden sm:inline">{secondaryLabel}</span>
            <span className="sm:hidden">{secondaryLabel.split(" ")[0]}</span>
          </Button>
        ) : null}
        <Button
          variant="primary"
          onClick={onPrimary}
          loading={primaryLoading}
          disabled={primaryDisabled}
          rightIcon={primaryIcon ?? <Icon name="send" size={18} />}
          className="min-w-0 flex-1"
        >
          <span className="truncate">{primaryLabel}</span>
        </Button>
      </div>
    </div>
  );
}
