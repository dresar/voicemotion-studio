"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { APP_CONFIG } from "@/config/app";
import { id } from "@/lib/i18n/id";
import { formatRupiah } from "@/lib/utils";

export type UpgradeReason = "quota" | "trial" | "credits";

export interface UpgradeModalProps {
  open: boolean;
  reason: UpgradeReason;
  onClose: () => void;
}

export function UpgradeModal({ open, reason, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const title = reason === "trial" ? id.workspace.trialEnded : id.common.upgrade;
  const description =
    reason === "quota"
      ? id.start.quotaFullDescription
      : reason === "trial"
        ? id.workspace.trialEndedDescription
        : id.animation.exportNoCredits;

  function goToPricing() {
    onClose();
    router.push("/harga/");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 pb-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            {id.common.later}
          </Button>
          <Button variant="primary" onClick={goToPricing} leftIcon={<Icon name="creditCard" size={18} />}>
            {id.common.seePricing}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-bg p-4 shadow-neu-sm">
          <p className="text-sm font-extrabold text-ink">{APP_CONFIG.plans.starter.label}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-primary-strong">
            {formatRupiah(APP_CONFIG.plans.starter.price)}
            <span className="text-xs font-semibold text-muted">{id.pricing.perMonth}</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-xs font-semibold text-muted">
            <li className="flex items-center gap-2">
              <Icon name="check" size={14} className="text-success" />
              {id.pricing.featureQuota.replace("{count}", String(APP_CONFIG.plans.starter.projectQuota))}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={14} className="text-success" />
              {id.pricing.featureCredits.replace("{count}", String(APP_CONFIG.plans.starter.credits))}
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary-soft/40 p-4 shadow-neu-sm">
          <p className="text-sm font-extrabold text-ink">{APP_CONFIG.plans.pro.label}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-primary-strong">
            {formatRupiah(APP_CONFIG.plans.pro.price)}
            <span className="text-xs font-semibold text-muted">{id.pricing.perMonth}</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-xs font-semibold text-muted">
            <li className="flex items-center gap-2">
              <Icon name="check" size={14} className="text-success" />
              {id.pricing.featureQuota.replace("{count}", "Unlimited")}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={14} className="text-success" />
              {id.pricing.featureCredits.replace("{count}", String(APP_CONFIG.plans.pro.credits))}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={14} className="text-success" />
              {id.pricing.featurePriority}
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
