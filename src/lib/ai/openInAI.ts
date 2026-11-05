import { id } from "@/lib/i18n/id";
import { copyText } from "@/lib/utils";
import type { AIProvider } from "@/types";

const urlLengthLimit = 7000;

const providerUrls: Record<AIProvider, string> = {
  claude: "https://claude.ai/new",
  chatgpt: "https://chatgpt.com/",
  gemini: "https://gemini.google.com/app"
};

export interface OpenInAIResult {
  opened: boolean;
  copied: boolean;
  message: string;
}

export async function openInAI(provider: AIProvider, prompt: string): Promise<OpenInAIResult> {
  const encoded = encodeURIComponent(prompt);
  const tooLong = encoded.length > urlLengthLimit;

  if (provider === "gemini" || tooLong) {
    const openedWindow = window.open(providerUrls[provider], "_blank");
    if (openedWindow) openedWindow.opener = null;
    const copied = await copyText(prompt);
    return {
      opened: Boolean(openedWindow),
      copied,
      message: copied ? id.ai.copied : id.ai.longPrompt
    };
  }

  const url =
    provider === "claude"
      ? `https://claude.ai/new?q=${encoded}`
      : `https://chatgpt.com/?q=${encoded}`;
  const openedWindow = window.open(url, "_blank");
  if (openedWindow) {
    openedWindow.opener = null;
    return { opened: true, copied: false, message: id.ai.opened };
  }
  const copied = await copyText(prompt);
  return {
    opened: false,
    copied,
    message: copied ? id.ai.copied : id.ai.popupBlocked
  };
}

export function providerLabel(provider: AIProvider): string {
  return id.ai.providerOptions[provider];
}
