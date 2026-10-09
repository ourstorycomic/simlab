// ─── Glassware System ───
// Định nghĩa các loại dụng cụ thủy tinh và logic gợi ý

import { Chemical, isLiquidState } from "./chemicals";
import { ReactionResult } from "./reactions";

export type GlasswareType = "test-tube" | "beaker" | "erlenmeyer";

export interface GlasswareGeometry {
  viewBox: string;
  width: number;
  height: number;
  // SVG paths for glass container
  outerPath: string;
  innerPath: string;
  // Clip path shape for liquid (defaults to innerPath if not set)
  liquidClipPath?: string;
  rimRect: { x: number; y: number; width: number; height: number };
  rimLipPath?: string;
  rimLipPath2?: string;
  // Where content (liquid/solid) is rendered
  contentArea: { x: number; y: number; width: number; height: number };
  // Liquid dimensions
  liquid: { defaultHeight: number; maxHeight: number };
  // Flame position
  flame: { x: number; y: number };
  // Reflections
  leftReflection: string;
  leftReflection2?: string;
  rightReflection?: string;
  bottomCurve: string;
  // Measurement marks
  marks: { y: number; label?: string }[];
  // Spout (beaker)
  spoutPath?: string;
}

export const glasswareGeometries: Record<GlasswareType, GlasswareGeometry> = {
  "test-tube": {
    viewBox: "0 0 120 200",
    width: 120,
    height: 200,
    outerPath: "M22 22 L22 155 Q22 180 60 185 Q98 180 98 155 L98 22",
    innerPath: "M24 24 L24 154 Q24 178 60 182 Q96 178 96 154 L96 24",
    rimRect: { x: 18, y: 14, width: 84, height: 12 },
    rimLipPath: "M18 18 L16 26 L22 24",
    rimLipPath2: "M102 18 L104 26 L98 24",
    contentArea: { x: 22, y: 35, width: 76, height: 145 },
    liquid: { defaultHeight: 55, maxHeight: 130 },
    flame: { x: 60, y: 30 },
    leftReflection: "M26 28 L26 150 Q26 172 40 176",
    rightReflection: "M92 30 L92 140",
    bottomCurve: "M35 172 Q60 182 85 172",
    marks: [
      { y: 40 },
      { y: 55 },
      { y: 70 },
      { y: 85 },
      { y: 100 },
      { y: 115 },
      { y: 130 },
    ],
  },

  "beaker": {
    viewBox: "0 0 140 110",
    width: 140,
    height: 110,
    outerPath: "M50 8 L50 18 Q50 22 44 24 L18 24 Q12 24 12 30 L12 76 Q12 96 70 100 Q128 96 128 76 L128 32 Q128 24 122 24 L90 24 Q82 24 82 18 L82 8",
    innerPath: "M53 10 L53 18 Q53 24 46 26 L20 26 Q15 26 15 31 L15 75 Q15 93 70 97 Q125 93 125 75 L125 33 Q125 26 120 26 L88 26 Q80 26 80 18 L80 10",
    rimRect: { x: 12, y: 20, width: 116, height: 7 },
    spoutPath: "M50 8 Q46 6 42 10 L40 14 L50 16",
    contentArea: { x: 15, y: 32, width: 110, height: 62 },
    liquid: { defaultHeight: 32, maxHeight: 58 },
    flame: { x: 70, y: 18 },
    leftReflection: "M18 36 L18 68 Q18 82 35 88",
    rightReflection: "M122 38 L122 70",
    bottomCurve: "M22 92 Q70 100 118 92",
    marks: [
      { y: 38, label: "80" },
      { y: 50, label: "60" },
      { y: 62, label: "40" },
      { y: 74, label: "20" },
    ],
  },

  "erlenmeyer": {
    viewBox: "0 0 100 140",
    width: 100,
    height: 140,
    outerPath: "M32 2 L32 30 Q32 50 24 64 L10 100 Q4 118 50 126 Q96 118 90 100 L76 64 Q68 50 68 30 L68 2",
    innerPath: "M35 4 L35 30 Q35 50 27 63 L13 99 Q8 115 50 122 Q92 115 87 99 L73 63 Q65 50 65 30 L65 4",
    // Liquid clip follows the inner body shape of the flask
    liquidClipPath: "M35 30 Q35 50 27 63 L13 99 Q8 115 50 122 Q92 115 87 99 L73 63 Q65 50 65 30 Z",
    rimRect: { x: 29, y: 0, width: 42, height: 6 },
    rimLipPath: "M29 2 L27 8 L33 6",
    rimLipPath2: "M71 2 L73 8 L67 6",
    contentArea: { x: 14, y: 30, width: 72, height: 90 },
    liquid: { defaultHeight: 26, maxHeight: 48 },
    flame: { x: 50, y: 10 },
    leftReflection: "M38 36 L38 56 L22 90",
    rightReflection: "M62 36 L62 56 L78 90",
    bottomCurve: "M22 116 Q50 124 78 116",
    marks: [],
  },
};

export const glasswareNames: Record<GlasswareType, string> = {
  "test-tube": "Ống nghiệm",
  "beaker": "Cốc thủy tinh",
  "erlenmeyer": "Bình tam giác",
};

export const glasswareDescriptions: Record<GlasswareType, string> = {
  "test-tube": "Phản ứng nhỏ, quan sát màu sắc",
  "beaker": "Hòa tan, pha trộn đa dụng",
  "erlenmeyer": "Phản ứng sinh khí, chuẩn độ",
};

// ─── Auto-suggest glassware based on chemicals & reaction ───
export function suggestGlassware(
  chem1: Chemical | null,
  chem2: Chemical | null,
  reaction?: ReactionResult | null
): GlasswareType {
  if (!chem1 || !chem2) return "test-tube";

  const effects = reaction?.effects || [];
  const hasGas = effects.some((e) => e.type === "bubbles" || e.type === "smoke");
  const hasFlame = effects.some((e) => e.type === "flame");

  if (hasGas) return "erlenmeyer";
  if (hasFlame) return "test-tube";

  const s1l = isLiquidState(chem1.state);
  const s2l = isLiquidState(chem2.state);
  const s1s = chem1.state === "solid";
  const s2s = chem2.state === "solid";

  if ((s1s && s2l) || (s2s && s1l)) return "beaker";
  if (s1l && s2l) return "test-tube";
  if (s1s && s2s) return "beaker";

  return "test-tube";
}

// ─── Transaction Types ───
export type TransactionType = "pour" | "drop" | "none";

export function getTransactionType(chemical: Chemical | null): TransactionType {
  if (!chemical) return "none";
  if (chemical.state === "solid") return "drop";
  if (isLiquidState(chemical.state)) return "pour";
  return "pour";
}
