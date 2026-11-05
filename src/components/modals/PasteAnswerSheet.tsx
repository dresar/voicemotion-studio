"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { id } from "@/lib/i18n/id";
import { buildRepairPrompt } from "@/lib/prompt/buildPrompt";
import { parseIdeaAnswer, parseNarrationAnswer, parseSceneCodeAnswer } from "@/lib/parse/parseAnswer";
import { copyText, readClipboard } from "@/lib/utils";
import type { Idea, Scene } from "@/types";

export type PasteMode = "idea" | "narration" | "code";

export type PasteResult =
  | { mode: "idea"; ideas: Idea[] }
  | { mode: "narration"; title: string; scenes: Scene[]; warnings: string[] }
  | { mode: "code"; scenes: Record<number, string>; warnings: string[] };

export interface PasteAnswerSheetProps {
  open: boolean;
  mode: PasteMode;
  targetDurationSec?: number;
  initialText?: string;
  onClose: () => void;
  onResult: (result: PasteResult) => void;
}

interface SuccessState {
  summary: string;
  warnings: string[];
}

interface ErrorState {
  issues: string[];
}

const repairKind: Record<PasteMode, string> = {
  idea: "ide",
  narration: "narasi",
  code: "kode scene"
};

const repairFormat: Record<PasteMode, string> = {
  idea: "Jawab dengan satu blok JSON { \"ideas\": [ { \"title\", \"hook\", \"angle\", \"visualStyle\" } ] }.",
  narration: "Jawab dengan satu blok JSON { \"scenes\": [ { \"n\", \"narration\", \"visual\", \"theme\", \"durationSec\" } ] }.",
  code: "Jawab dengan satu blok js berisi penanda // ===== SCENE N ===== untuk setiap scene."
};

export function PasteAnswerSheet({ open, mode, targetDurationSec, initialText = "", onClose, onResult }: PasteAnswerSheetProps) {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [failure, setFailure] = useState<ErrorState | null>(null);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setSuccess(null);
      setFailure(null);
      setProcessing(false);
    }
  }, [open, mode, initialText]);

  async function pasteFromClipboard() {
    const clipboardText = await readClipboard();
    if (!clipboardText) {
      showToast(id.paste.clipboardDenied, "warning");
      return;
    }
    setText(clipboardText);
    setFailure(null);
    setSuccess(null);
  }

  function processAnswer() {
    const trimmed = text.trim();
    if (!trimmed) {
      setFailure({ issues: [id.paste.empty] });
      setSuccess(null);
      return;
    }
    if (trimmed.length > 200000) {
      setFailure({ issues: [id.paste.tooLarge] });
      setSuccess(null);
      return;
    }
    setProcessing(true);
    setFailure(null);
    setSuccess(null);

    if (mode === "idea") {
      const result = parseIdeaAnswer(trimmed);
      setProcessing(false);
      if (!result.ok || !result.data) {
        setFailure({ issues: result.issues.map((issue) => issue.message) });
        return;
      }
      setSuccess({
        summary: id.paste.successIdeas.replace("{count}", String(result.data.ideas.length)),
        warnings: result.issues.map((issue) => issue.message)
      });
      onResult({ mode: "idea", ideas: result.data.ideas });
      return;
    }

    if (mode === "narration") {
      const result = parseNarrationAnswer(trimmed, targetDurationSec);
      setProcessing(false);
      if (!result.ok || !result.data) {
        setFailure({ issues: result.issues.map((issue) => issue.message) });
        return;
      }
      const warnings = result.issues.map((issue) => issue.message);
      setSuccess({
        summary: id.paste.successScenes.replace("{count}", String(result.data.scenes.length)),
        warnings
      });
      onResult({ mode: "narration", title: result.data.title, scenes: result.data.scenes, warnings });
      return;
    }

    const result = parseSceneCodeAnswer(trimmed);
    setProcessing(false);
    if (!result.ok) {
      setFailure({ issues: result.issues });
      return;
    }
    setSuccess({
      summary: id.paste.successCode.replace("{count}", String(Object.keys(result.scenes).length)),
      warnings: result.issues
    });
    onResult({ mode: "code", scenes: result.scenes, warnings: result.issues });
  }

  async function copyRepairPrompt() {
    if (!failure) return;
    const prompt = buildRepairPrompt({
      kind: repairKind[mode],
      errors: failure.issues,
      previousAnswer: text,
      formatReminder: repairFormat[mode]
    });
    const copied = await copyText(prompt);
    showToast(copied ? id.paste.repairCopied : id.paste.clipboardDenied, copied ? "success" : "warning");
  }

  const footer = success ? (
    <div className="flex justify-end pb-3">
      <Button variant="primary" onClick={onClose} leftIcon={<Icon name="check" size={18} />}>
        {id.style.done}
      </Button>
    </div>
  ) : (
    <div className="flex flex-col-reverse gap-2 pb-3 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onClose}>
        {id.common.close}
      </Button>
      <Button
        variant="primary"
        onClick={processAnswer}
        loading={processing}
        leftIcon={<Icon name="checkCircle" size={18} />}
      >
        {processing ? id.paste.processing : id.paste.process}
      </Button>
    </div>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={id.paste.title}
      description={id.paste.subtitle}
      tall
      footer={footer}
    >
      <div className="space-y-3">
        <Textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setFailure(null);
            setSuccess(null);
          }}
          placeholder={id.paste.placeholder}
          maxLength={200000}
          showCount
          className="min-h-[40dvh] font-mono text-sm"
          aria-label={id.paste.subtitle}
        />

        <Button
          variant="secondary"
          fullWidth
          onClick={() => void pasteFromClipboard()}
          leftIcon={<Icon name="paste" size={18} />}
        >
          {id.paste.clipboard}
        </Button>

        {success ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-3">
            <p className="flex items-center gap-2 text-sm font-extrabold text-success">
              <Icon name="checkCircle" size={18} />
              {success.summary}
            </p>
            {success.warnings.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs font-semibold leading-relaxed text-warning">
                {success.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {failure ? (
          <div className="rounded-md border border-danger/30 bg-danger/10 p-3" role="alert">
            <p className="flex items-center gap-2 text-sm font-extrabold text-danger">
              <Icon name="alertCircle" size={18} />
              {id.paste.failed}
            </p>
            <ul className="mt-2 space-y-1 text-xs font-semibold leading-relaxed text-danger">
              {failure.issues.map((issue, index) => (
                <li key={`${issue}-${index}`}>{issue}</li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => void copyRepairPrompt()}
              leftIcon={<Icon name="copy" size={15} />}
            >
              {id.paste.repairPrompt}
            </Button>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
