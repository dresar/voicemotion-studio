import { APP_CONFIG } from "@/config/app";
import { id } from "@/lib/i18n/id";
import type { ProjectConfig } from "@/types";

export interface ConfigValidation {
  valid: boolean;
  message: string;
}

export function validateConfig(config: ProjectConfig): ConfigValidation {
  if (config.durationSec < APP_CONFIG.minVideoDuration || config.durationSec > APP_CONFIG.maxVideoDuration) {
    return { valid: false, message: id.config.invalidDuration };
  }
  if (config.startFrom === "own_narration" && (config.ownNarration ?? "").trim().length < 20) {
    return { valid: false, message: id.config.invalidNarration };
  }
  if (config.startFrom === "promo" && (config.productName ?? "").trim().length < 2) {
    return { valid: false, message: id.config.invalidProduct };
  }
  return { valid: true, message: "" };
}
