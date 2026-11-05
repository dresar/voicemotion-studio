import { z } from "zod";

export const ideaSchema = z.object({
  id: z.string().optional(),
  title: z.string({ error: "judul wajib diisi" }).min(3, "judul minimal 3 karakter").max(80, "judul maksimal 80 karakter"),
  hook: z.string({ error: "hook wajib diisi" }).min(5, "hook minimal 5 karakter").max(200, "hook maksimal 200 karakter"),
  angle: z.string({ error: "pesan inti wajib diisi" }).min(10, "pesan inti minimal 10 karakter").max(600, "pesan inti maksimal 600 karakter"),
  visualStyle: z
    .string({ error: "visualStyle wajib diisi" })
    .min(10, "visualStyle minimal 10 karakter")
    .max(400, "visualStyle maksimal 400 karakter")
});

export const ideaSetSchema = z.object({
  ideas: z.array(ideaSchema, { error: "kunci ideas wajib ada" }).min(1, "minimal 1 ide").max(8, "maksimal 8 ide")
});

export const narrationSceneSchema = z.object({
  n: z.coerce.number({ error: "nomor scene wajib diisi" }).int().min(1),
  narration: z
    .string({ error: "narasi wajib diisi" })
    .min(3, "narasi minimal 3 karakter")
    .max(5000, "narasi maksimal 5000 karakter"),
  visual: z.string({ error: "visual wajib diisi" }).min(5, "visual minimal 5 karakter").max(2000, "visual maksimal 2000 karakter"),
  theme: z.enum(["paper", "dusk", "night"], { error: "tema wajib diisi" }),
  durationSec: z.coerce.number({ error: "durasi wajib diisi" }).min(2, "durasi minimal 2 detik").max(20, "durasi maksimal 20 detik")
});

export const sceneListSchema = z.object({
  title: z.string().optional(),
  scenes: z.array(narrationSceneSchema, { error: "kunci scenes wajib ada" }).min(1, "minimal 1 scene").max(30, "maksimal 30 scene")
});

export type ParsedIdeaSet = z.infer<typeof ideaSetSchema>;
export type ParsedSceneList = z.infer<typeof sceneListSchema>;
