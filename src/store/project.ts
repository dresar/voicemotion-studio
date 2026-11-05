"use client";

import { create } from "zustand";
import { APP_CONFIG } from "@/config/app";
import { api } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import { makeId } from "@/lib/utils";
import type {
  Idea,
  Project,
  ProjectConfig,
  ProjectConfigExtras,
  Scene,
  StartFrom,
  TabId
} from "@/types";

const ACTIVE_PROJECT_KEY = "voicemotion.activeProject";

type ConfigPatch = Partial<Omit<ProjectConfig, "extras">> & {
  extras?: Partial<ProjectConfigExtras>;
};

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  activeTab: TabId;
  title: string;
  config: ProjectConfig;
  scenes: Scene[];
  ideas: Idea[];
  selectedIdea: Idea | null;
  isLoading: boolean;
  pendingSaves: number;
  lastSavedAt: string | null;
  projectRevision: number;
  scenesRevision: number;
  lastSavedProjectRevision: number;
  lastSavedScenesRevision: number;
  projectSaveFailureRevision: number | null;
  scenesSaveFailureRevision: number | null;
  error: string;
  bootstrap: (startFrom?: StartFrom) => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  createProject: () => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  setTitle: (title: string) => void;
  updateConfig: (patch: ConfigPatch) => void;
  setIdeas: (ideas: Idea[]) => void;
  selectIdea: (idea: Idea) => void;
  setScenes: (scenes: Scene[]) => void;
  updateScene: (index: number, patch: Partial<Scene>) => void;
  addScene: () => void;
  removeScene: (index: number) => void;
  moveScene: (from: number, to: number) => void;
  saveProject: () => Promise<void>;
  saveScenes: () => Promise<void>;
  setError: (message: string) => void;
  clearError: () => void;
  reset: () => void;
}

export function mergeConfig(config?: Partial<ProjectConfig> | null): ProjectConfig {
  const base = APP_CONFIG.defaultConfig;
  return {
    startFrom: config?.startFrom ?? base.startFrom,
    language: config?.language ?? base.language,
    contentType: config?.contentType ?? base.contentType,
    topic: config?.topic ?? base.topic,
    durationSec: typeof config?.durationSec === "number" ? config.durationSec : base.durationSec,
    styleSlug: config?.styleSlug ?? base.styleSlug,
    character: config?.character ?? base.character,
    brandColor: config?.brandColor ?? base.brandColor,
    tempo: config?.tempo ?? base.tempo,
    transition: config?.transition ?? base.transition,
    aspect: config?.aspect ?? base.aspect,
    extras: { ...base.extras, ...(config?.extras ?? {}) },
    ownNarration: config?.ownNarration ?? "",
    productName: config?.productName ?? "",
    productBenefits: config?.productBenefits ?? "",
    writerNotes: config?.writerNotes ?? "",
    voiceId: config?.voiceId ?? "ibu_sari",
    voiceSpeed: typeof config?.voiceSpeed === "number" ? config.voiceSpeed : 1,
    scenePause: typeof config?.scenePause === "number" ? config.scenePause : 0.3,
    sceneFont: config?.sceneFont ?? "plus-jakarta-sans",
    decorationStyle: config?.decorationStyle ?? "editorial",
    decorationIntensity:
      typeof config?.decorationIntensity === "number" ? config.decorationIntensity : 45,
    texture: config?.texture ?? "paper",
    subtitleStyle: config?.subtitleStyle ?? "box",
    preferredAssets: config?.preferredAssets ?? ["spark", "underline"],
    ideaSet: config?.ideaSet ?? []
  };
}

function normalizeScene(scene: Scene, index: number): Scene {
  const theme = scene.theme === "dusk" || scene.theme === "night" ? scene.theme : "paper";
  const codeStatus = scene.codeStatus === "ok" || scene.codeStatus === "error" ? scene.codeStatus : "empty";
  return {
    id: scene.id || makeId(),
    projectId: scene.projectId,
    idx: index,
    narration: scene.narration ?? "",
    visual: scene.visual ?? "",
    theme,
    durationSec:
      Number.isFinite(scene.durationSec) && scene.durationSec >= APP_CONFIG.minSceneDuration
        ? scene.durationSec
        : APP_CONFIG.sceneSeconds,
    audioPath: scene.audioPath ?? null,
    audioMs: scene.audioMs ?? null,
    wordTimings: scene.wordTimings ?? null,
    code: scene.code ?? "",
    codeStatus,
    codeError: scene.codeError ?? null
  };
}

function normalizeScenes(scenes: Scene[]): Scene[] {
  return scenes.map((scene, index) => normalizeScene(scene, index));
}

export function createEmptyScene(index: number): Scene {
  return normalizeScene(
    {
      id: makeId(),
      idx: index,
      narration: "",
      visual: "",
      theme: "paper",
      durationSec: APP_CONFIG.sceneSeconds,
      audioPath: null,
      audioMs: null,
      wordTimings: null,
      code: "",
      codeStatus: "empty",
      codeError: null
    },
    index
  );
}

function tabFromStage(stage: string): TabId {
  if (stage === "narration" || stage === "voice" || stage === "animation") return stage;
  return "idea";
}

function normalizeIdeas(ideas: Idea[] | undefined): Idea[] {
  return (ideas ?? []).map((idea) => ({ ...idea, id: idea.id || makeId() }));
}

const initialState = {
  projects: [] as Project[],
  activeProjectId: null as string | null,
  activeTab: "idea" as TabId,
  title: "Proyek Baru",
  config: mergeConfig(),
  scenes: [] as Scene[],
  ideas: [] as Idea[],
  selectedIdea: null as Idea | null,
  isLoading: false,
  pendingSaves: 0,
  lastSavedAt: null as string | null,
  projectRevision: 0,
  scenesRevision: 0,
  lastSavedProjectRevision: 0,
  lastSavedScenesRevision: 0,
  projectSaveFailureRevision: null as number | null,
  scenesSaveFailureRevision: null as number | null,
  error: ""
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  bootstrap: async (startFrom) => {
    if (get().isLoading) return;
    set({ isLoading: true, error: "" });
    try {
      const projects = await api.listProjects();
      set({ projects });
      const storedActive = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_PROJECT_KEY) : null;
      const storedExists = projects.some((project) => project.id === storedActive);
      const activeId = storedExists ? storedActive : projects[0]?.id;
      if (activeId) {
        await get().openProject(activeId);
        if (startFrom && get().config.startFrom !== startFrom) {
          get().updateConfig({ startFrom });
        }
      } else {
        const project = await api.createProject({ config: mergeConfig({ startFrom: startFrom ?? "topic" }) });
        set({ projects: [project] });
        await get().openProject(project.id);
      }
    } catch (error) {
      set({ error: messageFromError(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  openProject: async (projectId) => {
    set({ isLoading: true, error: "" });
    try {
      const [project, scenes] = await Promise.all([api.getProject(projectId), api.listScenes(projectId)]);
      const config = mergeConfig(project.config);
      const ideas = normalizeIdeas(config.ideaSet);
      const selectedIdea =
        project.selectedIdea ??
        ideas.find((idea) => idea.id === project.selectedIdeaId) ??
        null;
      const normalizedScenes = normalizeScenes(scenes);
      let tab = tabFromStage(project.stage);
      if (tab !== "idea" && !selectedIdea) tab = "idea";
      if ((tab === "voice" || tab === "animation") && normalizedScenes.length === 0) tab = "narration";
      if (tab === "animation" && !normalizedScenes.every((scene) => scene.audioPath)) tab = "voice";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
      }
      set({
        activeProjectId: projectId,
        activeTab: tab,
        title: project.title,
        config: { ...config, ideaSet: ideas },
        ideas,
        selectedIdea,
        scenes: normalizedScenes,
        projectRevision: 0,
        scenesRevision: 0,
        lastSavedProjectRevision: 0,
        lastSavedScenesRevision: 0,
        projectSaveFailureRevision: null,
        scenesSaveFailureRevision: null,
        pendingSaves: 0,
        lastSavedAt: null,
        error: ""
      });
    } catch (error) {
      set({ error: messageFromError(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async () => {
    try {
      const project = await api.createProject({ config: mergeConfig({ startFrom: get().config.startFrom }) });
      set((state) => ({ projects: [project, ...state.projects] }));
      await get().openProject(project.id);
      return project;
    } catch (error) {
      set({ error: messageFromError(error) });
      return null;
    }
  },

  deleteProject: async (projectId) => {
    try {
      await api.deleteProject(projectId);
      const remaining = get().projects.filter((project) => project.id !== projectId);
      set({ projects: remaining });
      if (get().activeProjectId === projectId) {
        if (remaining[0]) {
          await get().openProject(remaining[0].id);
        } else {
          set({ ...initialState, projects: [] });
        }
      }
    } catch (error) {
      set({ error: messageFromError(error) });
    }
  },

  duplicateProject: async (projectId) => {
    try {
      const project = await api.duplicateProject(projectId);
      set((state) => ({ projects: [project, ...state.projects] }));
      await get().openProject(project.id);
    } catch (error) {
      set({ error: messageFromError(error) });
    }
  },

  refreshProjects: async () => {
    try {
      const projects = await api.listProjects();
      set({ projects });
      const activeId = get().activeProjectId;
      if (activeId && !projects.some((project) => project.id === activeId)) {
        if (projects[0]) {
          await get().openProject(projects[0].id);
        } else {
          set({ ...initialState, projects: [] });
        }
      }
    } catch (error) {
      set({ error: messageFromError(error) });
    }
  },

  setActiveTab: (tab) => {
    set((state) => ({ activeTab: tab, projectRevision: state.projectRevision + 1 }));
  },

  setTitle: (title) => {
    set((state) => ({ title, projectRevision: state.projectRevision + 1 }));
  },

  updateConfig: (patch) => {
    set((state) => ({
      config: {
        ...state.config,
        ...patch,
        extras: patch.extras ? { ...state.config.extras, ...patch.extras } : state.config.extras
      },
      projectRevision: state.projectRevision + 1
    }));
  },

  setIdeas: (ideas) => {
    const normalizedIdeas = normalizeIdeas(ideas);
    set((state) => ({
      ideas: normalizedIdeas,
      config: { ...state.config, ideaSet: normalizedIdeas },
      projectRevision: state.projectRevision + 1
    }));
  },

  selectIdea: (idea) => {
    set((state) => {
      const ideas = state.ideas.some((item) => item.id === idea.id) ? state.ideas : [...state.ideas, idea];
      return {
        selectedIdea: idea,
        ideas,
        config: { ...state.config, ideaSet: ideas },
        activeTab: "narration" as TabId,
        projectRevision: state.projectRevision + 1
      };
    });
  },

  setScenes: (scenes) => {
    set((state) => ({
      scenes: normalizeScenes(scenes),
      scenesRevision: state.scenesRevision + 1
    }));
  },

  updateScene: (index, patch) => {
    set((state) => ({
      scenes: state.scenes.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, ...patch, idx: sceneIndex } : scene
      ),
      scenesRevision: state.scenesRevision + 1
    }));
  },

  addScene: () => {
    set((state) => ({
      scenes: [...state.scenes, createEmptyScene(state.scenes.length)],
      scenesRevision: state.scenesRevision + 1
    }));
  },

  removeScene: (index) => {
    set((state) => ({
      scenes: state.scenes.filter((_, sceneIndex) => sceneIndex !== index).map((scene, sceneIndex) => ({ ...scene, idx: sceneIndex })),
      scenesRevision: state.scenesRevision + 1
    }));
  },

  moveScene: (from, to) => {
    set((state) => {
      if (from === to || from < 0 || to < 0 || from >= state.scenes.length || to >= state.scenes.length) {
        return state;
      }
      const nextScenes = [...state.scenes];
      const [movedScene] = nextScenes.splice(from, 1);
      nextScenes.splice(to, 0, movedScene);
      return {
        scenes: nextScenes.map((scene, sceneIndex) => ({ ...scene, idx: sceneIndex })),
        scenesRevision: state.scenesRevision + 1
      };
    });
  },

  saveProject: async () => {
    const { activeProjectId, title, config, selectedIdea, activeTab, projectRevision } = get();
    if (!activeProjectId) return;
    const revision = projectRevision;
    set((state) => ({ pendingSaves: state.pendingSaves + 1 }));
    try {
      const updated = await api.updateProject(activeProjectId, {
        title: title.trim() || "Proyek Baru",
        config,
        stage: activeTab,
        selectedIdeaId: selectedIdea?.id ?? null,
        selectedIdea
      });
      set((state) => ({
        lastSavedProjectRevision: revision,
        lastSavedAt: new Date().toISOString(),
        projectSaveFailureRevision: null,
        projects: state.projects.map((project) =>
          project.id === updated.id
            ? {
                ...project,
                title: updated.title,
                stage: updated.stage,
                config: updated.config,
                selectedIdeaId: updated.selectedIdeaId,
                selectedIdea: updated.selectedIdea,
                updatedAt: updated.updatedAt
              }
            : project
        ),
        error: ""
      }));
    } catch (error) {
      set({ error: messageFromError(error), projectSaveFailureRevision: revision });
    } finally {
      set((state) => {
        const pendingSaves = Math.max(0, state.pendingSaves - 1);
        return { pendingSaves };
      });
    }
  },

  saveScenes: async () => {
    const { activeProjectId, scenes, scenesRevision } = get();
    if (!activeProjectId) return;
    const revision = scenesRevision;
    set((state) => ({ pendingSaves: state.pendingSaves + 1 }));
    try {
      const savedScenes = normalizeScenes(await api.saveScenes(activeProjectId, scenes));
      const totalDuration = savedScenes.reduce((total, scene) => total + scene.durationSec, 0);
      set((state) => ({
        scenes: state.scenesRevision === revision ? savedScenes : state.scenes,
        lastSavedScenesRevision: revision,
        lastSavedAt: new Date().toISOString(),
        scenesSaveFailureRevision: null,
        projects: state.projects.map((project) =>
          project.id === activeProjectId
            ? { ...project, sceneCount: savedScenes.length, totalDuration }
            : project
        ),
        error: ""
      }));
    } catch (error) {
      set({ error: messageFromError(error), scenesSaveFailureRevision: revision });
    } finally {
      set((state) => {
        const pendingSaves = Math.max(0, state.pendingSaves - 1);
        return { pendingSaves };
      });
    }
  },

  setError: (message) => set({ error: message }),
  clearError: () => set({ error: "" }),
  reset: () => set({ ...initialState })
}));
