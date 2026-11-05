import { describe, expect, it, vi } from "vitest";
import { compileSceneBody, prescanCode } from "@/lib/engine/sandbox";
import type { SceneApi } from "@/lib/engine/runtime";

describe("prescanCode", () => {
  it("menolak loop while", () => {
    const result = prescanCode("while (true) { s.circle(0,0,1,{}); }");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("while");
  });

  it("menolak fetch", () => {
    const result = prescanCode("fetch('https://example.com');");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("fetch");
  });

  it("menolak Math.random", () => {
    const result = prescanCode("const value = Math.random(); s.circle(0,0,value,{});");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Math.random");
  });

  it("menolak for tanpa batas", () => {
    const result = prescanCode("for (;;) { s.circle(0,0,1,{}); }");
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("for");
  });

  it("mengizinkan kode scene normal", () => {
    const result = prescanCode("const k = s.spring(0); s.circle(0,0,100,{fill:s.c.blue});");
    expect(result.ok).toBe(true);
  });

  it("mengabaikan kata terlarang di dalam string", () => {
    const result = prescanCode("const label = 'window dan fetch'; s.words(label,0,0,{});");
    expect(result.ok).toBe(true);
  });
});

describe("compileSceneBody", () => {
  it("menjalankan body dengan API s dan ctx", () => {
    const circle = vi.fn();
    const runtime = { circle, c: { blue: "#3F7BFF" } } as unknown as SceneApi;
    const context = {} as OffscreenCanvasRenderingContext2D;
    const compiled = compileSceneBody("s.circle(0,0,10,{fill:s.c.blue});");
    compiled(runtime, context);
    expect(circle).toHaveBeenCalledWith(0, 0, 10, { fill: "#3F7BFF" });
  });
});
