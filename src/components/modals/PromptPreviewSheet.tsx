"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { id } from "@/lib/i18n/id";
import { copyText } from "@/lib/utils";
import type { AIProvider } from "@/types";
import type { PasteMode } from "@/components/modals/PasteAnswerSheet";

export interface PromptPreviewSheetProps {
  open: boolean;
  title: string;
  prompt: string;
  mode: PasteMode;
  onClose: () => void;
  onOpenAI: (provider: AIProvider, prompt: string, mode: PasteMode) => Promise<void>;
}

export function PromptPreviewSheet({ open, title, prompt, mode, onClose, onOpenAI }: PromptPreviewSheetProps) {
  const { showToast } = useToast();
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [draft, setDraft] = useState(prompt);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(prompt);
      setProvider(mode === "code" ? "claude" : "gemini");
      setOpening(false);
    }
  }, [open, prompt, mode]);

  async function copyPrompt() {
    const copied = await copyText(draft);
    showToast(copied ? id.preview.copied : id.paste.clipboardDenied, copied ? "success" : "warning");
  }

  async function openAI() {
    setOpening(true);
    await onOpenAI(provider, draft, mode);
    setOpening(false);
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={id.preview.subtitle}
      tall
      footer={
        <div className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDraft(prompt)}
            disabled={draft === prompt}
            leftIcon={<Icon name="refresh" size={15} />}
            className="justify-start"
          >
            {id.preview.reset}
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => void copyPrompt()} leftIcon={<Icon name="copy" size={17} />}>
              {id.preview.copy}
            </Button>
            <Button
              variant="primary"
              onClick={() => void openAI()}
              loading={opening}
              rightIcon={<Icon name="external" size={17} />}
            >
              {id.preview.open}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <p className="neu-label">{id.preview.provider}</p>
          <Segmented
            ariaLabel={id.preview.provider}
            value={provider}
            onChange={setProvider}
            options={[
              { value: "claude", label: id.ai.providerOptions.claude },
              { value: "chatgpt", label: id.ai.providerOptions.chatgpt },
              { value: "gemini", label: id.ai.providerOptions.gemini }
            ]}
          />
          <p className="neu-help">{id.preview.note}</p>
        </div>

        <Textarea
          label={id.preview.promptLabel}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-[46dvh] font-mono text-xs leading-relaxed"
          spellCheck={false}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-muted">
          <span>{id.preview.characters.replace("{count}", String(draft.length))}</span>
          <span>{id.preview.tokens.replace("{count}", String(Math.ceil(draft.length / 4)))}</span>
        </div>
      </div>
    </Sheet>
  );
}
