"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { Stepper } from "@/components/layout/Stepper";
import type { StepperStatus } from "@/components/layout/Stepper";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { HowToSendAI } from "@/components/modals/HowToSendAI";
import { PasteAnswerSheet } from "@/components/modals/PasteAnswerSheet";
import type { PasteMode, PasteResult } from "@/components/modals/PasteAnswerSheet";
import { PromptPreviewSheet } from "@/components/modals/PromptPreviewSheet";
import { StylePicker } from "@/components/modals/StylePicker";
import { VideoQuestionnaireModal } from "@/components/modals/VideoQuestionnaireModal";
import type { VideoQuestionnaireAnswers } from "@/components/modals/VideoQuestionnaireModal";
import { AnimationPanel } from "@/components/workspace/AnimationPanel";
import { CoachMarks } from "@/components/workspace/CoachMarks";
import { ConfigPanel } from "@/components/workspace/ConfigPanel";
import { IdeaGrid } from "@/components/workspace/IdeaGrid";
import { NarrationEditor } from "@/components/workspace/NarrationEditor";
import { ProjectList } from "@/components/workspace/ProjectList";
import { ProjectSheet } from "@/components/workspace/ProjectSheet";
import { VoicePanel } from "@/components/workspace/VoicePanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { validateConfig } from "@/lib/configValidation";
import { id } from "@/lib/i18n/id";
import { openInAI } from "@/lib/ai/openInAI";
import { buildIdeaPrompt, buildNarrationPrompt, buildScenePrompt } from "@/lib/prompt/buildPrompt";
import { cn, copyText, formatDuration, readClipboard } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useProjectStore } from "@/store/project";
import { useStyleStore } from "@/store/styles";
import { getCustomTemplates, customTemplateToStylePack } from "@/lib/customTemplates";
import type { AIProvider, StartFrom, TabId } from "@/types";

function SettingsSummary({ onEdit }: { onEdit: () => void }) {
  const config = useProjectStore((state) => state.config);
  const selectedIdea = useProjectStore((state) => state.selectedIdea);
  const styles = useStyleStore((state) => state.styles);
  const styleName =
    styles.find((style) => style.slug === config.styleSlug)?.name ??
    (typeof window !== "undefined"
      ? getCustomTemplates()
          .map(customTemplateToStylePack)
          .find((style) => style.slug === config.styleSlug)?.name
      : null) ??
    "Neu-Soft";

  return (
    <Card variant="raised" padding="md" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted">{id.config.settingsTitle}</p>
        <Button variant="ghost" size="sm" onClick={onEdit} leftIcon={<Icon name="edit" size={14} />}>
          {id.common.edit}
        </Button>
      </div>
      <p className="rounded-md bg-bg-sunken px-3 py-2 text-xs font-semibold text-muted">
        {styleName} · {id.config.tempoOptions[config.tempo]} · {config.aspect} · {formatDuration(config.durationSec)}
      </p>
      {selectedIdea ? (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">{id.narration.selectedIdea}</p>
          <p className="mt-0.5 text-sm font-extrabold leading-snug text-ink">{selectedIdea.title}</p>
          <div className="neu-quote mt-2 text-base">{selectedIdea.hook}</div>
        </div>
      ) : null}
    </Card>
  );
}

export function WorkspaceView() {
  const router = useRouter();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const bootstrap = useProjectStore((state) => state.bootstrap);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeTab = useProjectStore((state) => state.activeTab);
  const config = useProjectStore((state) => state.config);
  const scenes = useProjectStore((state) => state.scenes);
  const selectedIdea = useProjectStore((state) => state.selectedIdea);
  const title = useProjectStore((state) => state.title);
  const isLoading = useProjectStore((state) => state.isLoading);
  const pendingSaves = useProjectStore((state) => state.pendingSaves);
  const lastSavedAt = useProjectStore((state) => state.lastSavedAt);
  const projectRevision = useProjectStore((state) => state.projectRevision);
  const scenesRevision = useProjectStore((state) => state.scenesRevision);
  const lastSavedProjectRevision = useProjectStore((state) => state.lastSavedProjectRevision);
  const lastSavedScenesRevision = useProjectStore((state) => state.lastSavedScenesRevision);
  const projectSaveFailureRevision = useProjectStore((state) => state.projectSaveFailureRevision);
  const scenesSaveFailureRevision = useProjectStore((state) => state.scenesSaveFailureRevision);
  const error = useProjectStore((state) => state.error);
  const setActiveTab = useProjectStore((state) => state.setActiveTab);
  const setTitle = useProjectStore((state) => state.setTitle);
  const setIdeas = useProjectStore((state) => state.setIdeas);
  const setScenes = useProjectStore((state) => state.setScenes);
  const updateScene = useProjectStore((state) => state.updateScene);
  const saveProject = useProjectStore((state) => state.saveProject);
  const saveScenes = useProjectStore((state) => state.saveScenes);
  const clearError = useProjectStore((state) => state.clearError);

  const styles = useStyleStore((state) => state.styles);
  const selectedStyle =
    styles.find((style) => style.slug === config.styleSlug) ??
    (typeof window !== "undefined"
      ? getCustomTemplates()
          .map(customTemplateToStylePack)
          .find((style) => style.slug === config.styleSlug)
      : null) ??
    null;

  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<{ prompt: string; mode: PasteMode } | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteMode, setPasteMode] = useState<PasteMode>("idea");
  const [pasteInitialText, setPasteInitialText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState("");
  const [previewMode, setPreviewMode] = useState<PasteMode>("idea");
  const [previewTitle, setPreviewTitle] = useState<string>(id.preview.modeIdea);
  const [voiceSignal, setVoiceSignal] = useState(0);
  const [exportSignal, setExportSignal] = useState(0);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [videoQuestionnaireOpen, setVideoQuestionnaireOpen] = useState(false);
  const [pendingSceneIndex, setPendingSceneIndex] = useState<number | undefined>(undefined);
  const awaitingPasteMode = useRef<PasteMode | null>(null);

  const validation = validateConfig(config);
  const hasIdea = Boolean(selectedIdea);
  const narratedScenes = scenes.filter((scene) => scene.narration.trim().length > 0);
  const hasScenes = narratedScenes.length > 0;
  const hasAudio = scenes.length > 0 && scenes.every((scene) => Boolean(scene.audioPath));
  const hasCode = scenes.length > 0 && scenes.every((scene) => scene.codeStatus === "ok");
  const statuses: Record<TabId, StepperStatus> = {
    idea: { locked: false, done: hasIdea },
    narration: { locked: !hasIdea, done: hasScenes },
    voice: { locked: !hasScenes, done: hasAudio },
    animation: { locked: !hasAudio, done: hasCode }
  };
  const saveFailed =
    (projectSaveFailureRevision !== null && projectSaveFailureRevision === projectRevision) ||
    (scenesSaveFailureRevision !== null && scenesSaveFailureRevision === scenesRevision);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("voicemotion.startFrom");
    window.sessionStorage.removeItem("voicemotion.startFrom");
    const startFrom: StartFrom | undefined =
      stored === "topic" || stored === "own_narration" || stored === "promo" ? stored : undefined;
    void bootstrap(startFrom);
  }, [bootstrap]);

  useEffect(() => {
    void useStyleStore.getState().loadStyles();
  }, []);

  useEffect(() => {
    if (!error) return;
    showToast(error, "error");
    clearError();
  }, [error, showToast, clearError]);

  useEffect(() => {
    if (!activeProjectId || projectRevision <= lastSavedProjectRevision || pendingSaves > 0) return;
    if (projectSaveFailureRevision === projectRevision) return;
    const timer = window.setTimeout(() => void saveProject(), 600);
    return () => window.clearTimeout(timer);
  }, [
    activeProjectId,
    projectRevision,
    lastSavedProjectRevision,
    pendingSaves,
    projectSaveFailureRevision,
    saveProject
  ]);

  useEffect(() => {
    if (!activeProjectId || scenesRevision <= lastSavedScenesRevision || pendingSaves > 0) return;
    if (scenesSaveFailureRevision === scenesRevision) return;
    const timer = window.setTimeout(() => void saveScenes(), 600);
    return () => window.clearTimeout(timer);
  }, [
    activeProjectId,
    scenesRevision,
    lastSavedScenesRevision,
    pendingSaves,
    scenesSaveFailureRevision,
    saveScenes
  ]);

  useEffect(() => {
    if (activeTab === "narration" && !hasIdea) {
      setActiveTab("idea");
      return;
    }
    if (activeTab === "voice" && !hasScenes) {
      setActiveTab("narration");
      return;
    }
    if (activeTab === "animation" && !hasAudio) {
      setActiveTab("voice");
    }
  }, [activeTab, hasIdea, hasScenes, hasAudio, setActiveTab]);

  useEffect(() => {
    async function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      const mode = awaitingPasteMode.current;
      if (!mode) return;
      awaitingPasteMode.current = null;
      const clipboardText = await readClipboard();
      if (clipboardText.trim().length >= 20) {
        setPasteMode(mode);
        setPasteInitialText(clipboardText);
        setPasteOpen(true);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  function handleTabChange(tab: TabId) {
    if (statuses[tab].locked) {
      showToast(id.workspace.tabLocked, "warning");
      return;
    }
    setActiveTab(tab);
  }

  function buildPromptFor(stage: "idea" | "narration" | "scene", sceneIndex?: number): string {
    if (stage === "narration") {
      return buildNarrationPrompt({
        config,
        style: selectedStyle,
        idea: selectedIdea,
        writerNotes: config.writerNotes
      });
    }
    if (stage === "scene") {
      const targetScenes = typeof sceneIndex === "number" && scenes[sceneIndex] ? [scenes[sceneIndex]] : scenes;
      return buildScenePrompt({ config, style: selectedStyle, scenes: targetScenes });
    }
    return buildIdeaPrompt({ config, style: selectedStyle });
  }

  async function handleCopyPrompt(stage: "idea" | "narration" | "scene", sceneIndex?: number) {
    const prompt = buildPromptFor(stage, sceneIndex);
    const copied = await copyText(prompt);
    showToast(copied ? id.ai.copied : id.paste.clipboardDenied, copied ? "success" : "warning");
  }

  async function handleSendPrompt(stage: "idea" | "narration" | "scene", sceneIndex?: number) {
    if (stage === "scene") {
      setPendingSceneIndex(sceneIndex);
      setVideoQuestionnaireOpen(true);
      return;
    }

    const prompt = buildPromptFor(stage, sceneIndex);
    const mode: PasteMode = stage === "idea" ? "idea" : "narration";
    const hidden = window.localStorage.getItem("voicemotion.hideHowToSend") === "1";
    if (hidden) {
      const result = await openInAI("gemini", prompt);
      showToast(result.message, result.opened || result.copied ? "info" : "warning");
      if (result.opened) awaitingPasteMode.current = mode;
      return;
    }
    setPendingPrompt({ prompt, mode });
    setHowToOpen(true);
  }

  async function handleVideoQuestionnaireConfirm(answers: VideoQuestionnaireAnswers) {
    const basePrompt = buildPromptFor("scene", pendingSceneIndex);
    const preferences = `
[PREFERENSI VIDEO CLAUDE]:
- Rasio Aspek: ${answers.aspectRatio}
- Tempo & Transisi Animasi: ${answers.animationPacing}
- Nuansa Visual: ${answers.visualVibe}
- Gaya Tipografi: ${answers.typographyEmphasis}
- Sinkronisasi Audio: ${answers.includeSoundCue ? "Sinkronkan ketukan teks & SFX dengan audio" : "Fokus visual murni"}
`;
    const finalPrompt = `${preferences}\n${basePrompt}`;
    const result = await openInAI("claude", finalPrompt);
    showToast(result.message, result.opened || result.copied ? "info" : "warning");
    if (result.opened) awaitingPasteMode.current = "code";
    setPendingSceneIndex(undefined);
  }

  async function handleHowToContinue(provider: AIProvider, dontShowAgain: boolean) {
    if (dontShowAgain) {
      window.localStorage.setItem("voicemotion.hideHowToSend", "1");
    }
    setHowToOpen(false);
    if (!pendingPrompt) return;
    const result = await openInAI(provider, pendingPrompt.prompt);
    showToast(result.message, result.opened || result.copied ? "info" : "warning");
    if (result.opened) awaitingPasteMode.current = pendingPrompt.mode;
    setPendingPrompt(null);
  }

  function openPaste(mode: PasteMode, initialText = "") {
    setPasteMode(mode);
    setPasteInitialText(initialText);
    setPasteOpen(true);
  }

  function openPreview(stage: "idea" | "narration" | "scene", sceneIndex?: number) {
    const prompt = buildPromptFor(stage, sceneIndex);
    const mode: PasteMode = stage === "idea" ? "idea" : stage === "narration" ? "narration" : "code";
    setPreviewPrompt(prompt);
    setPreviewMode(mode);
    setPreviewTitle(
      mode === "idea" ? id.preview.modeIdea : mode === "narration" ? id.preview.modeNarration : id.preview.modeCode
    );
    setPreviewOpen(true);
  }

  async function handlePreviewOpenAI(provider: AIProvider, prompt: string, mode: PasteMode) {
    const result = await openInAI(provider, prompt);
    showToast(result.message, result.opened || result.copied ? "info" : "warning");
    if (result.opened) {
      awaitingPasteMode.current = mode;
    }
    setPreviewOpen(false);
  }

  function handlePasteResult(result: PasteResult) {
    if (result.mode === "idea") {
      setIdeas(result.ideas);
      showToast(id.ideas.parseSuccess.replace("{count}", String(result.ideas.length)), "success");
      return;
    }
    if (result.mode === "narration") {
      setScenes(result.scenes);
      showToast(id.narration.parseSuccess.replace("{count}", String(result.scenes.length)), "success");
      return;
    }
    const currentScenes = useProjectStore.getState().scenes;
    Object.entries(result.scenes).forEach(([sceneNumber, code]) => {
      const index = Number(sceneNumber) - 1;
      if (index >= 0 && index < currentScenes.length) {
        updateScene(index, { code, codeStatus: "ok", codeError: null });
      }
    });
    showToast(id.paste.successCode.replace("{count}", String(Object.keys(result.scenes).length)), "success");
  }

  async function handleLogout() {
    await logout();
    useProjectStore.getState().reset();
    router.replace("/masuk/");
  }

  if (!user || (isLoading && !activeProjectId)) {
    return <LoadingScreen message={id.workspace.loadingProject} />;
  }

  if (!activeProjectId) {
    return (
      <main className="min-h-dvh bg-bg">
        <WorkspaceHeader
          user={user}
          title={title}
          onTitleChange={setTitle}
          onMenu={() => setProjectSheetOpen(true)}
          onLogout={() => void handleLogout()}
          pendingSaves={pendingSaves}
          lastSavedAt={lastSavedAt}
          saveFailed={saveFailed}
        />
        <div className="page-pad mx-auto w-full max-w-lg py-10">
          <Card variant="raised" padding="lg">
            <EmptyState
              icon="folder"
              title={id.workspace.noActiveProject}
              description={id.workspace.noProjects}
              action={
                <Button variant="primary" onClick={() => void bootstrap()} leftIcon={<Icon name="refresh" size={18} />}>
                  {id.common.retry}
                </Button>
              }
            />
          </Card>
        </div>
        <ProjectSheet open={projectSheetOpen} onClose={() => setProjectSheetOpen(false)} />
      </main>
    );
  }

  let bottomPrimaryLabel: string = id.config.sendButton;
  let bottomPrimaryAction: () => void = () => void handleSendPrompt("idea");
  let bottomPrimaryDisabled: boolean = !validation.valid;
  let bottomPrimaryIcon: ReactNode = <Icon name="send" size={18} />;
  let bottomSecondaryLabel: string | undefined = id.config.copyButton;
  let bottomSecondaryAction: (() => void) | undefined = () => void handleCopyPrompt("idea");
  let bottomSecondaryIcon: ReactNode = <Icon name="copy" size={18} />;

  if (activeTab === "narration") {
    bottomPrimaryLabel = id.narration.sendButton;
    bottomPrimaryAction = () => void handleSendPrompt("narration");
    bottomPrimaryDisabled = !selectedIdea;
    bottomSecondaryLabel = id.narration.copyButton;
    bottomSecondaryAction = () => void handleCopyPrompt("narration");
  }

  if (activeTab === "voice") {
    bottomPrimaryLabel = id.voice.generateAll;
    bottomPrimaryAction = () => setVoiceSignal((current) => current + 1);
    bottomPrimaryDisabled = narratedScenes.length === 0;
    bottomPrimaryIcon = <Icon name="volume" size={18} />;
    bottomSecondaryLabel = undefined;
    bottomSecondaryAction = undefined;
  }

  if (activeTab === "animation") {
    bottomPrimaryLabel = id.animation.export;
    bottomPrimaryAction = () => setExportSignal((current) => current + 1);
    bottomPrimaryDisabled = scenes.length === 0;
    bottomPrimaryIcon = <Icon name="download" size={18} />;
    bottomSecondaryLabel = id.animation.pasteCode;
    bottomSecondaryAction = () => openPaste("code");
    bottomSecondaryIcon = <Icon name="paste" size={18} />;
  }

  return (
    <div className="min-h-dvh bg-bg">
      <WorkspaceHeader
        user={user}
        title={title}
        onTitleChange={setTitle}
        onMenu={() => setProjectSheetOpen(true)}
        onLogout={() => void handleLogout()}
        pendingSaves={pendingSaves}
        lastSavedAt={lastSavedAt}
        saveFailed={saveFailed}
        showLeftSidebar={showLeftSidebar}
        onToggleLeftSidebar={() => setShowLeftSidebar((prev) => !prev)}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={() => setShowRightSidebar((prev) => !prev)}
      />

      <div className="page-pad mx-auto w-full max-w-[1440px] lg:px-4 lg:py-3">
        {(!showLeftSidebar || !showRightSidebar) && (
          <div className="hidden lg:flex items-center gap-2 mb-2.5">
            {!showLeftSidebar && (
              <button
                type="button"
                onClick={() => setShowLeftSidebar(true)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-bold rounded-md bg-sunken border border-line text-muted hover:text-ink hover:border-primary/40 shadow-neu-xs transition-all"
              >
                <Icon name="sliders" size={12} />
                <span>Buka Panel Konfigurasi</span>
              </button>
            )}
            {!showRightSidebar && (
              <button
                type="button"
                onClick={() => setShowRightSidebar(true)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-bold rounded-md bg-sunken border border-line text-muted hover:text-ink hover:border-primary/40 shadow-neu-xs transition-all"
              >
                <Icon name="folder" size={12} />
                <span>Buka Daftar Proyek</span>
              </button>
            )}
          </div>
        )}

        <div
          className={cn(
            "lg:grid lg:gap-3 transition-all duration-200",
            showLeftSidebar && showRightSidebar
              ? "lg:grid-cols-[290px_minmax(0,1fr)_250px]"
              : showLeftSidebar
              ? "lg:grid-cols-[300px_minmax(0,1fr)]"
              : showRightSidebar
              ? "lg:grid-cols-[minmax(0,1fr)_270px]"
              : "lg:grid-cols-1"
          )}
        >
          {showLeftSidebar ? (
            <aside className="hidden min-w-0 lg:block">
              <div className="sticky top-16 space-y-2.5">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[11px] font-bold text-ink">Alur Studio</span>
                  <button
                    type="button"
                    onClick={() => setShowLeftSidebar(false)}
                    className="inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-semibold text-muted hover:text-ink hover:bg-sunken transition"
                    title="Sembunyikan Panel Alur"
                  >
                    <Icon name="chevronLeft" size={11} />
                    <span>Tutup</span>
                  </button>
                </div>
                <Stepper activeTab={activeTab} statuses={statuses} onChange={handleTabChange} />
                <div className="neu-scrollbar max-h-[calc(100dvh-200px)] overflow-y-auto pr-1">
                  {activeTab === "idea" ? (
                    <ConfigPanel
                      onOpenStyle={() => setStyleOpen(true)}
                      onCopyPrompt={() => void handleCopyPrompt("idea")}
                      onSendPrompt={() => void handleSendPrompt("idea")}
                      onOpenPaste={() => openPaste("idea")}
                      onPreviewPrompt={() => openPreview("idea")}
                    />
                  ) : (
                    <SettingsSummary onEdit={() => setActiveTab("idea")} />
                  )}
                </div>
              </div>
            </aside>
          ) : null}

          <main className="flex min-h-[calc(100dvh-64px)] min-w-0 flex-col pb-28 lg:pb-0">
            <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur lg:hidden">
              <Stepper activeTab={activeTab} statuses={statuses} onChange={handleTabChange} />
            </div>

            <div className="flex-1 py-3 lg:py-0">
              {activeTab === "idea" ? (
                <>
                  <div className="mb-4 lg:hidden">
                    <ConfigPanel
                      onOpenStyle={() => setStyleOpen(true)}
                      onCopyPrompt={() => void handleCopyPrompt("idea")}
                      onSendPrompt={() => void handleSendPrompt("idea")}
                      onOpenPaste={() => openPaste("idea")}
                      onPreviewPrompt={() => openPreview("idea")}
                    />
                  </div>
                  <IdeaGrid
                    onCopyPrompt={() => void handleCopyPrompt("idea")}
                    onSendPrompt={() => void handleSendPrompt("idea")}
                    onOpenPaste={() => openPaste("idea")}
                  />
                </>
              ) : null}

              {activeTab === "narration" ? (
                <NarrationEditor
                  onCopyPrompt={() => void handleCopyPrompt("narration")}
                  onSendPrompt={() => void handleSendPrompt("narration")}
                  onOpenPaste={() => openPaste("narration")}
                  onPreviewPrompt={() => openPreview("narration")}
                />
              ) : null}

              {activeTab === "voice" ? <VoicePanel generateSignal={voiceSignal} /> : null}

              {activeTab === "animation" ? (
                <AnimationPanel
                  exportSignal={exportSignal}
                  onOpenPaste={() => openPaste("code")}
                  onSendAllScenes={() => void handleSendPrompt("scene")}
                  onSendScene={(sceneIndex) => void handleSendPrompt("scene", sceneIndex)}
                  onCopyCodePrompt={(sceneIndex) => void handleCopyPrompt("scene", sceneIndex)}
                  onPreviewCodePrompt={(sceneIndex) => openPreview("scene", sceneIndex)}
                />
              ) : null}
            </div>

            <BottomActionBar
              primaryLabel={bottomPrimaryLabel}
              onPrimary={bottomPrimaryAction}
              primaryDisabled={bottomPrimaryDisabled}
              primaryIcon={bottomPrimaryIcon}
              secondaryLabel={bottomSecondaryLabel}
              onSecondary={bottomSecondaryAction}
              secondaryIcon={bottomSecondaryIcon}
            />
          </main>

          {showRightSidebar ? (
            <aside className="hidden min-w-0 lg:block">
              <Card variant="raised" padding="sm" className="sticky top-16 flex max-h-[calc(100dvh-90px)] flex-col">
                <div className="flex items-center justify-between pb-1.5 border-b border-line mb-1.5 px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Daftar Proyek</span>
                  <button
                    type="button"
                    onClick={() => setShowRightSidebar(false)}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-ink hover:bg-sunken text-[11px]"
                    title="Sembunyikan Proyek"
                  >
                    ✕
                  </button>
                </div>
                <ProjectList className="min-h-0 flex-1" />
              </Card>
            </aside>
          ) : null}
        </div>
      </div>

      <ProjectSheet open={projectSheetOpen} onClose={() => setProjectSheetOpen(false)} />
      <StylePicker open={styleOpen} onClose={() => setStyleOpen(false)} />
      <HowToSendAI
        open={howToOpen}
        onClose={() => {
          setHowToOpen(false);
          setPendingPrompt(null);
        }}
        onContinue={handleHowToContinue}
      />
      <PasteAnswerSheet
        open={pasteOpen}
        mode={pasteMode}
        targetDurationSec={config.durationSec}
        initialText={pasteInitialText}
        onClose={() => setPasteOpen(false)}
        onResult={handlePasteResult}
      />
      <PromptPreviewSheet
        open={previewOpen}
        title={previewTitle}
        prompt={previewPrompt}
        mode={previewMode}
        onClose={() => setPreviewOpen(false)}
        onOpenAI={handlePreviewOpenAI}
      />
      <VideoQuestionnaireModal
        open={videoQuestionnaireOpen}
        onClose={() => setVideoQuestionnaireOpen(false)}
        onConfirm={handleVideoQuestionnaireConfirm}
      />
      <CoachMarks active={activeTab === "idea"} />
    </div>
  );
}
