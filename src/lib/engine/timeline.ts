export interface TimelineScene {
  index: number;
  start: number;
  end: number;
  duration: number;
}

export interface SceneTimeline {
  scenes: TimelineScene[];
  total: number;
}

export function buildTimeline(scenes: Array<{ durationSec: number }>, gap = 0): SceneTimeline {
  let cursor = 0;
  const timelineScenes = scenes.map((scene, index) => {
    const start = cursor;
    const duration = Math.max(0.1, scene.durationSec);
    const end = start + duration;
    cursor = end + gap;
    return { index, start, end, duration };
  });
  return {
    scenes: timelineScenes,
    total: timelineScenes.length > 0 ? timelineScenes[timelineScenes.length - 1].end : 0
  };
}

export function findSceneAt(timeline: SceneTimeline, globalTime: number): { sceneIndex: number; localTime: number } | null {
  if (timeline.scenes.length === 0) return null;
  for (const scene of timeline.scenes) {
    if (globalTime >= scene.start && globalTime < scene.end) {
      return { sceneIndex: scene.index, localTime: globalTime - scene.start };
    }
  }
  return null;
}

export function sceneAtOrBefore(timeline: SceneTimeline, globalTime: number): { sceneIndex: number; localTime: number } | null {
  if (timeline.scenes.length === 0) return null;
  let selected = timeline.scenes[0];
  for (const scene of timeline.scenes) {
    if (globalTime >= scene.start) selected = scene;
  }
  return {
    sceneIndex: selected.index,
    localTime: Math.min(Math.max(globalTime - selected.start, 0), selected.duration)
  };
}
