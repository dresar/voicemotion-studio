"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Progress } from "@/components/ui/Progress";
import { id } from "@/lib/i18n/id";

export interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exporting: boolean;
  progress: number;
  onCancel: () => void;
  cost: number;
  remaining: number;
  formatLabel: string;
}

export function ExportModal({
  open,
  onClose,
  onConfirm,
  exporting,
  progress,
  onCancel,
  cost,
  remaining,
  formatLabel
}: ExportModalProps) {
  return (
    <Modal
      open={open}
      onClose={exporting ? onCancel : onClose}
      title={id.animation.exportConfirmTitle}
      description={id.animation.exportConfirmDescription
        .replace("{cost}", String(cost))
        .replace("{remaining}", String(Math.max(0, remaining - cost)))}
      size="sm"
      footer={
        exporting ? (
          <div className="flex flex-col gap-2 pb-3">
            <Progress value={progress} label={id.animation.exporting} showValue />
            <Button variant="secondary" onClick={onCancel} leftIcon={<Icon name="x" size={17} />}>
              {id.common.cancel}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-2 pb-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              {id.export.cancel}
            </Button>
            <Button variant="primary" onClick={onConfirm} leftIcon={<Icon name="download" size={18} />}>
              {id.export.start}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-3">
        <div className="rounded-md border border-line bg-bg p-3 text-sm font-semibold text-ink">
          <p>{id.export.format.replace("{format}", formatLabel)}</p>
          <p className="mt-1 text-xs font-normal text-muted">{id.animation.exportFormat}</p>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Edisi Open Source: Render video lokal resolusi penuh tanpa batasan kuota.
        </p>
      </div>
    </Modal>
  );
}
