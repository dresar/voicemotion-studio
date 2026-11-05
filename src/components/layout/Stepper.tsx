"use client";

import { Tabs } from "@/components/ui/Tabs";
import { id } from "@/lib/i18n/id";
import type { TabId } from "@/types";
import { cn } from "@/lib/utils";

export interface StepperStatus {
  locked: boolean;
  done: boolean;
}

export interface StepperProps {
  activeTab: TabId;
  statuses: Record<TabId, StepperStatus>;
  onChange: (tab: TabId) => void;
  className?: string;
}

export function Stepper({ activeTab, statuses, onChange, className }: StepperProps) {
  return (
    <Tabs
      ariaLabel="Tahap pembuatan video"
      value={activeTab}
      onChange={(value) => onChange(value as TabId)}
      className={cn("w-full rounded-md bg-bg p-1 shadow-neu-sm", className)}
      items={[
        { id: "idea", label: `1. ${id.workspace.tabs.idea}`, disabled: statuses.idea.locked, done: statuses.idea.done },
        {
          id: "narration",
          label: `2. ${id.workspace.tabs.narration}`,
          disabled: statuses.narration.locked,
          done: statuses.narration.done
        },
        { id: "voice", label: `3. ${id.workspace.tabs.voice}`, disabled: statuses.voice.locked, done: statuses.voice.done },
        {
          id: "animation",
          label: `4. ${id.workspace.tabs.animation}`,
          disabled: statuses.animation.locked,
          done: statuses.animation.done
        }
      ]}
    />
  );
}
