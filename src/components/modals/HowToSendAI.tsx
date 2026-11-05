"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { id } from "@/lib/i18n/id";
import type { AIProvider } from "@/types";

export interface HowToSendAIProps {
  open: boolean;
  defaultProvider?: AIProvider;
  onClose: () => void;
  onContinue: (provider: AIProvider, dontShowAgain: boolean) => void;
}

const steps: Array<{ title: string; description: string; icon: IconName }> = [
  { title: id.ai.step1Title, description: id.ai.step1Description, icon: "external" },
  { title: id.ai.step2Title, description: id.ai.step2Description, icon: "send" },
  { title: id.ai.step3Title, description: id.ai.step3Description, icon: "copy" },
  { title: id.ai.step4Title, description: id.ai.step4Description, icon: "paste" }
];

export function HowToSendAI({ open, defaultProvider = "gemini", onClose, onContinue }: HowToSendAIProps) {
  const [provider, setProvider] = useState<AIProvider>(defaultProvider);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) {
      setProvider(defaultProvider);
      setDontShowAgain(false);
    }
  }, [open, defaultProvider]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={id.ai.howToTitle}
      description={id.ai.howToSubtitle}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            {id.ai.dontShow}
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="secondary" onClick={onClose}>
              {id.ai.cancel}
            </Button>
            <Button variant="primary" onClick={() => onContinue(provider, dontShowAgain)} rightIcon={<Icon name="external" size={17} />}>
              {id.ai.openAI}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="neu-label">{id.ai.provider}</p>
          <Segmented
            ariaLabel={id.ai.provider}
            value={provider}
            onChange={setProvider}
            options={[
              { value: "claude", label: id.ai.providerOptions.claude },
              { value: "chatgpt", label: id.ai.providerOptions.chatgpt },
              { value: "gemini", label: id.ai.providerOptions.gemini }
            ]}
          />
          {provider === "gemini" ? <p className="neu-help">{id.ai.geminiNote}</p> : null}
        </div>

        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white shadow-neu-sm">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 rounded-md border border-line bg-bg p-2.5">
                <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                  <Icon name={step.icon} size={15} className="text-primary-strong" />
                  {step.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{step.description}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}
