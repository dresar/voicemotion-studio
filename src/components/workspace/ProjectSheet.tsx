"use client";

import { Sheet } from "@/components/ui/Sheet";
import { ProjectList } from "@/components/workspace/ProjectList";
import { id } from "@/lib/i18n/id";

export interface ProjectSheetProps {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export function ProjectSheet({ open, onClose, onUpgrade }: ProjectSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={id.workspace.projects} tall>
      <ProjectList onUpgrade={onUpgrade} onClose={onClose} />
    </Sheet>
  );
}
