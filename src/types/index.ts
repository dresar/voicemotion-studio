export type PlanId = "trial" | "starter" | "pro";
export type Role = "user" | "admin";
export type StartFrom = "topic" | "own_narration" | "promo";
export type LanguageCode = "id" | "en";
export type ContentType = "motivation" | "education" | "humor" | "business" | "story" | "promo";
export type Tempo = "energetic" | "calm";
export type AspectRatio = "9:16" | "16:9" | "1:1" | "3:4";
export type SceneTheme = "paper" | "dusk" | "night";
export type CodeStatus = "empty" | "ok" | "error";
export type Stage = "idea" | "narration" | "voice" | "animation";
export type TabId = "idea" | "narration" | "voice" | "animation";
export type TabStatus = "locked" | "active" | "done" | "stale";
export type AIProvider = "claude" | "chatgpt" | "gemini";
export type DecorationStyle = "minimal" | "editorial" | "scrapbook" | "geometric" | "organic";
export type TextureStyle = "none" | "paper" | "grain" | "grid" | "dots";
export type SubtitleStyle = "box" | "minimal" | "highlight";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
  plan: PlanId;
  trialEndsAt: string | null;
  credits: number;
  projectQuota: number;
  role: Role;
  referralCode: string;
  createdAt: string;
  disabled?: boolean;
}

export interface ProjectConfigExtras {
  tone: string;
  avoid: string;
  cta: string;
  contact: string;
}

export interface ProjectConfig {
  startFrom: StartFrom;
  language: LanguageCode;
  contentType: ContentType;
  topic: string;
  durationSec: number;
  styleSlug: string;
  character: string;
  brandColor: string;
  tempo: Tempo;
  transition: string;
  aspect: AspectRatio;
  extras: ProjectConfigExtras;
  ownNarration?: string;
  productName?: string;
  productBenefits?: string;
  writerNotes?: string;
  voiceId: string;
  voiceSpeed: number;
  scenePause: number;
  sceneFont: string;
  decorationStyle: DecorationStyle;
  decorationIntensity: number;
  texture: TextureStyle;
  subtitleStyle: SubtitleStyle;
  preferredAssets: string[];
  ideaSet?: Idea[];
  bgmTrack?: string;
  bgmVolume?: number;
  narrationVolume?: number;
  autoDucking?: boolean;
}

export interface BgmTrack {
  id: string;
  name: string;
  category: string;
  bpm: number;
  mood: string;
  recommendedVolume: number;
  duckingRatio: number;
  synthPreset: string;
  description: string;
}

export interface Idea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  visualStyle: string;
}

export interface IdeaSet {
  ideas: Idea[];
}

export interface Scene {
  id: string;
  projectId?: string;
  idx: number;
  narration: string;
  visual: string;
  theme: SceneTheme;
  durationSec: number;
  audioPath: string | null;
  audioMs: number | null;
  wordTimings: string | null;
  code: string;
  codeStatus: CodeStatus;
  codeError: string | null;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  stage: Stage;
  config: ProjectConfig;
  selectedIdeaId: string | null;
  selectedIdea: Idea | null;
  sceneCount: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface StylePack {
  slug: string;
  name: string;
  category: string;
  theme: SceneTheme;
  palette: string[];
  finishing: "flat" | "sketch";
  descriptionForPrompt: string;
  sampleCode: string;
  heavy: boolean;
  transitions: string[];
}

export interface Voice {
  id: string;
  name: string;
  gender: "female" | "male";
  edgeVoice: string;
  description: string;
}

export interface SceneIssue {
  path: string;
  message: string;
}

export interface ParseResult<T> {
  ok: boolean;
  data?: T;
  issues: SceneIssue[];
}

export interface SceneCodeResult {
  ok: boolean;
  scenes: Record<number, string>;
  issues: string[];
}

export interface CreditBalance {
  credits: number;
}

export interface AdminUser extends User {
  projectCount: number;
}

export interface ExportLog {
  id: string;
  projectId: string;
  userId: string;
  status: string;
  format: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AdminOverviewStats {
  usersCount: number;
  projectsCount: number;
  scenesCount: number;
  exportsCount: number;
  audioFilesCount: number;
  storageBytes: number;
}

export interface AdminAssetItem {
  filename: string;
  sizeBytes: number;
  updatedAt: string;
  isReferenced: boolean;
  url: string;
}

export interface AdminProjectItem {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  stage: Stage;
  sceneCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLedgerItem {
  id: string;
  userId: string;
  userEmail: string;
  delta: number;
  reason: string;
  ref: string;
  createdAt: string;
}

export interface ByNaraConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  secondaryKey: string;
  defaultModel: string;
  models: string[];
}

export interface SumopodConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export interface GeminiConfig {
  enabled: boolean;
  apiKeys: string[];
  defaultModel: string;
}

export interface CustomAIConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export interface TaskRoutingConfig {
  topicsModel: string;
  scriptModel: string;
  animationModel: string;
  voiceModel: string;
}

export interface AIRouterSettings {
  activeProvider: "bynara" | "sumopod" | "gemini" | "custom";
  fallbackAuto: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  bynara: ByNaraConfig;
  sumopod: SumopodConfig;
  gemini: GeminiConfig;
  custom: CustomAIConfig;
  taskRouting: TaskRoutingConfig;
}

export interface PlatformSettings {
  ttsEngine: string;
  defaultVoice: string;
  ttsTimeoutSeconds: number;
  trialDays: number;
  trialCredits: number;
  trialQuota: number;
  starterCredits: number;
  proCredits: number;
  autoCleanupOrphan: boolean;
  jwtExpiryHours: number;
  maintenanceMode: boolean;
  googleClientId: string;
  googleClientSecret: string;
}

export interface SystemSettingsPayload {
  aiRouter: AIRouterSettings;
  platform: PlatformSettings;
}

export interface AITestRequest {
  provider: string;
  model?: string;
  prompt?: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface AITestResponse {
  ok: boolean;
  reply?: string;
  latencyMs: number;
  provider: string;
  model: string;
  error?: string;
}
