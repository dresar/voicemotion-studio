import { describe, expect, it } from "vitest";
import { assetCatalog, findSceneAsset, sceneAssets } from "@/lib/engine/assets";

describe("scene assets", () => {
  it("memiliki katalog aset yang unik dan lengkap", () => {
    expect(sceneAssets.length).toBeGreaterThanOrEqual(20);
    const ids = sceneAssets.map((asset) => asset.id);
    expect(new Set(ids).size).toBe(ids.length);
    sceneAssets.forEach((asset) => {
      expect(asset.path.length).toBeGreaterThan(5);
      expect(asset.description.length).toBeGreaterThan(10);
      expect(["fill", "stroke"]).toContain(asset.mode);
    });
  });

  it("menghasilkan katalog prompt dan lookup yang konsisten", () => {
    const spark = findSceneAsset("spark");
    expect(spark?.mode).toBe("fill");
    expect(findSceneAsset("tidak-ada")).toBeUndefined();
    const catalog = assetCatalog();
    expect(catalog).toContain("- spark (Spark)");
    expect(catalog).toContain("- squiggle (Squiggle)");
  });
});
