
// ─── Validate ma trận phản ứng hóa học ───
// Chạy: npm run validate
// Kiểm tra: mọi product ID phải tồn tại trong kho hóa chất; mọi reaction có effects hợp lệ;
// getHeatingReaction trả về products hợp lệ; mọi thí nghiệm mẫu dùng hóa chất tồn tại.

import { chemicals, Chemical } from "../src/lib/chemicals";
import { getReaction, getHeatingReaction, ReactionResult } from "../src/lib/reactions";
import { experiments } from "../src/lib/experiments";

const knownIds = new Set(chemicals.map((c) => c.id));
const errors: string[] = [];
let reactionsChecked = 0;

function checkProducts(products: string[], context: string) {
  for (const p of products) {
    if (!knownIds.has(p)) {
      errors.push(`[${context}] Sản phẩm "${p}" KHÔNG tồn tại trong kho hóa chất.`);
    }
  }
}

function checkEffects(result: ReactionResult, context: string) {
  if (!Array.isArray(result.effects) || result.effects.length === 0) {
    errors.push(`[${context}] Phản ứng không có effects.`);
    return;
  }
  const validTypes = ["bubbles", "color_change", "precipitate", "smoke", "flame", "flash", "dissolve", "sparkle"];
  for (const e of result.effects) {
    if (!validTypes.includes(e.type)) {
      errors.push(`[${context}] Effect type không hợp lệ: "${e.type}".`);
    }
    if (typeof e.duration !== "number" || e.duration <= 0) {
      errors.push(`[${context}] Effect duration không hợp lệ: ${e.duration}.`);
    }
  }
}

// ─── Ma trận phản ứng: mọi cặp hóa chất ───
for (const a of chemicals) {
  for (const b of chemicals) {
    if (a.id === b.id) continue;
    const result = getReaction(a, b);
    reactionsChecked++;
    if (result) {
      checkProducts(result.products, `${a.id} + ${b.id}`);
      checkEffects(result, `${a.id} + ${b.id}`);
    }
  }
}

// ─── Phản ứng khi đốt nóng ───
for (const c of chemicals) {
  const result = getHeatingReaction(c);
  if (result) {
    checkProducts(result.products, `đốt nóng ${c.id}`);
    checkEffects(result, `đốt nóng ${c.id}`);
  }
}

// ─── Thí nghiệm mẫu ───
for (const exp of experiments) {
  for (const id of exp.chemicalIds) {
    if (!knownIds.has(id)) {
      errors.push(`[Thí nghiệm "${exp.name}"] Hóa chất "${id}" KHÔNG tồn tại.`);
    }
  }
}

// ─── Kết quả ───
if (errors.length > 0) {
  console.error(`\n❌ VALIDATE THẤT BẠI — ${errors.length} lỗi (đã kiểm tra ${reactionsChecked} cặp phản ứng):\n`);
  for (const err of errors) console.error(`   • ${err}`);
  console.error("");
  process.exit(1);
}

console.log(`\n✅ VALIDATE THÀNH CÔNG — ${reactionsChecked} cặp phản ứng, ${chemicals.length} hóa chất, ${experiments.length} thí nghiệm mẫu.\n`);
