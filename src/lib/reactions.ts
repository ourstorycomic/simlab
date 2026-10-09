// ─── Chemical Reaction Engine ───
// Định nghĩa các phản ứng hóa học và hiệu ứng đi kèm

import { Chemical } from "./chemicals";

export type ReactionType =
  | "acid_base" // Trung hòa axit-bazơ
  | "metal_acid" // Kim loại + Axit → H₂
  | "precipitation" // Tạo kết tủa
  | "color_change" // Đổi màu (chất chỉ thị)
  | "redox" // Oxi hóa khử
  | "combustion" // Cháy
  | "gas_evolution" // Sinh khí (CO₂, SO₂...)
  | "complex" // Tạo phức
  | "none";

// Nhãn dùng chung cho các loại phản ứng (dùng ở ReactionInfo, ReactionEffects...)
export const REACTION_TYPE_LABELS: Record<ReactionType, string> = {
  acid_base: "Trung hòa axit-bazơ",
  metal_acid: "Kim loại + axit",
  precipitation: "Tạo kết tủa",
  color_change: "Đổi màu",
  redox: "Oxi hóa khử",
  combustion: "Sự cháy",
  gas_evolution: "Sinh khí",
  complex: "Tạo phức",
  none: "Không phản ứng",
};

export const REACTION_TYPE_BORDER: Record<ReactionType, string> = {
  acid_base: "border-l-blue-400 dark:border-l-blue-500",
  metal_acid: "border-l-orange-400 dark:border-l-orange-500",
  precipitation: "border-l-indigo-400 dark:border-l-indigo-500",
  color_change: "border-l-pink-400 dark:border-l-pink-500",
  redox: "border-l-purple-400 dark:border-l-purple-500",
  combustion: "border-l-red-400 dark:border-l-red-500",
  gas_evolution: "border-l-green-400 dark:border-l-green-500",
  complex: "border-l-fuchsia-400 dark:border-l-fuchsia-500",
  none: "border-l-gray-300 dark:border-l-gray-600",
};

export interface ReactionEffect {
  type: "bubbles" | "color_change" | "precipitate" | "smoke" | "flame" | "flash" | "dissolve" | "sparkle";
  intensity: "low" | "medium" | "high";
  duration: number; // ms
  targetColor?: string;
  particleCount?: number;
}

export interface ReactionResult {
  type: ReactionType;
  equation: string;
  equationHtml: string; // Hiển thị dạng đẹp
  description: string;
  effects: ReactionEffect[];
  products: string[]; // IDs của sản phẩm
  observations: string[]; // Các hiện tượng quan sát được
  heatChange: "none" | "exothermic" | "endothermic";
}

// ─── Dữ liệu phản ứng Muối cacbonat + Axit ───
// Sinh động phương trình theo từng cặp acid/carbonate, tránh hardcode sai sản phẩm
const ACID_INFO: Record<string, { formula: string; coef: number; html: string }> = {
  hcl: { formula: "HCl", coef: 2, html: "2<span class='text-chemical-red'>HCl</span>" },
  h2so4: { formula: "H₂SO₄", coef: 1, html: "<span class='text-chemical-red'>H₂SO₄</span>" },
  hno3: { formula: "HNO₃", coef: 2, html: "2<span class='text-chemical-red'>HNO₃</span>" },
  ch3cooh: { formula: "CH₃COOH", coef: 2, html: "2<span class='text-chemical-orange'>CH₃COOH</span>" },
};

const CARBONATE_INFO: Record<string, { formula: string; html: string; saltCoef: number }> = {
  na2co3: { formula: "Na₂CO₃", html: "<span class='text-white'>Na₂CO₃</span>", saltCoef: 2 },
  caco3: { formula: "CaCO₃", html: "<span class='text-gray-200'>CaCO₃</span>", saltCoef: 1 },
  baco3: { formula: "BaCO₃", html: "<span class='text-gray-200'>BaCO₃</span>", saltCoef: 1 },
};

const CARBONATE_SALT: Record<
  string,
  Record<string, { saltId: string; saltFormula: string; saltHtml: string; precipitate?: boolean }>
> = {
  na2co3: {
    hcl: { saltId: "nacl", saltFormula: "NaCl", saltHtml: "<span class='text-white'>NaCl</span>" },
    h2so4: { saltId: "na2so4", saltFormula: "Na₂SO₄", saltHtml: "<span class='text-white'>Na₂SO₄</span>" },
    hno3: { saltId: "nano3", saltFormula: "NaNO₃", saltHtml: "<span class='text-white'>NaNO₃</span>" },
    ch3cooh: { saltId: "ch3coona", saltFormula: "CH₃COONa", saltHtml: "<span class='text-white'>CH₃COONa</span>" },
  },
  caco3: {
    hcl: { saltId: "cacl2", saltFormula: "CaCl₂", saltHtml: "<span class='text-white'>CaCl₂</span>" },
    h2so4: { saltId: "caso4", saltFormula: "CaSO₄", saltHtml: "<span class='text-gray-100'>CaSO₄↓</span>", precipitate: true },
    hno3: { saltId: "ca_no32", saltFormula: "Ca(NO₃)₂", saltHtml: "<span class='text-white'>Ca(NO₃)₂</span>" },
    ch3cooh: { saltId: "ca_ch3coo2", saltFormula: "(CH₃COO)₂Ca", saltHtml: "<span class='text-white'>(CH₃COO)₂Ca</span>" },
  },
  baco3: {
    hcl: { saltId: "bacl2", saltFormula: "BaCl₂", saltHtml: "<span class='text-white'>BaCl₂</span>" },
    h2so4: { saltId: "baso4", saltFormula: "BaSO₄", saltHtml: "<span class='text-gray-100'>BaSO₄↓</span>", precipitate: true },
    hno3: { saltId: "ba_no32", saltFormula: "Ba(NO₃)₂", saltHtml: "<span class='text-white'>Ba(NO₃)₂</span>" },
    ch3cooh: { saltId: "ba_ch3coo2", saltFormula: "(CH₃COO)₂Ba", saltHtml: "<span class='text-white'>(CH₃COO)₂Ba</span>" },
  },
};

const WATER_HTML = "<span class='text-cyan-300'>H₂O</span>";
const CO2_HTML = "<span class='text-gray-200'>CO₂↑</span>";

// Phản ứng giữa 2 hóa chất (có thể cần điều kiện)
export function getReaction(
  chemical1: Chemical,
  chemical2: Chemical
): ReactionResult | null {
  const id1 = chemical1.id;
  const id2 = chemical2.id;

  // ─── Chất chỉ thị quỳ tím ───
  // Giấy quỳ tím + Axit → Đỏ
  if (
    (id1 === "quytim" && chemical2.category === "acid") ||
    (chemical1.category === "acid" && id2 === "quytim")
  ) {
    return {
      type: "color_change",
      equation: "Quỳ tím + H⁺ → Màu đỏ",
      equationHtml:
        "<span class='text-purple-400'>Quỳ tím</span> + <span class='text-chemical-red'>H⁺</span> → <span class='text-red-400'>Màu đỏ</span>",
      description: "Giấy quỳ tím chuyển sang màu đỏ trong môi trường axit",
      effects: [
        { type: "color_change", intensity: "high", duration: 1500, targetColor: "#ff3333" },
      ],
      products: [],
      observations: [
        "Giấy quỳ tím chuyển sang màu đỏ",
        "Môi trường axit (pH < 7)",
      ],
      heatChange: "none",
    };
  }

  // Giấy quỳ tím + Bazơ → Xanh
  if (
    (id1 === "quytim" && chemical2.category === "base") ||
    (chemical1.category === "base" && id2 === "quytim")
  ) {
    return {
      type: "color_change",
      equation: "Quỳ tím + OH⁻ → Màu xanh",
      equationHtml:
        "<span class='text-purple-400'>Quỳ tím</span> + <span class='text-chemical-blue'>OH⁻</span> → <span class='text-blue-400'>Màu xanh</span>",
      description: "Giấy quỳ tím chuyển sang màu xanh trong môi trường bazơ",
      effects: [
        { type: "color_change", intensity: "high", duration: 1500, targetColor: "#3388ff" },
      ],
      products: [],
      observations: [
        "Giấy quỳ tím chuyển sang màu xanh",
        "Môi trường bazơ (pH > 7)",
      ],
      heatChange: "none",
    };
  }

  // ─── Iot + Tinh bột → Xanh tím ───
  if (
    (id1 === "i2" && id2 === "tinh_bot") ||
    (id1 === "tinh_bot" && id2 === "i2")
  ) {
    return {
      type: "color_change",
      equation: "I₂ + Tinh bột → Hợp chất màu xanh tím",
      equationHtml:
        "<span class='text-purple-400'>I₂</span> + <span class='text-white'>Tinh bột</span> → <span class='text-indigo-400'>Màu xanh tím</span>",
      description: "Iot tạo phức màu xanh tím đặc trưng với tinh bột (thuốc thử nhận biết)",
      effects: [
        { type: "color_change", intensity: "high", duration: 2500, targetColor: "#6a5acd" },
      ],
      products: [],
      observations: [
        "Hỗn hợp chuyển sang màu xanh tím đặc trưng",
        "Dùng để nhận biết hồ tinh bột",
      ],
      heatChange: "none",
    };
  }

  // ─── FeCl₃ + KSCN → Phức đỏ máu ───
  if (
    (id1 === "fecl3" && id2 === "kscn") ||
    (id1 === "kscn" && id2 === "fecl3")
  ) {
    return {
      type: "complex",
      equation: "Fe³⁺ + SCN⁻ → [Fe(SCN)]²⁺ (đỏ máu)",
      equationHtml:
        "<span class='text-chemical-orange'>Fe³⁺</span> + <span class='text-white'>SCN⁻</span> → <span class='text-red-500'>[Fe(SCN)]²⁺</span>",
      description: "Tạo phức màu đỏ máu đặc trưng, dùng nhận biết ion Fe³⁺",
      effects: [
        { type: "color_change", intensity: "high", duration: 2500, targetColor: "#cc1111" },
        { type: "sparkle", intensity: "low", duration: 1500 },
      ],
      products: ["fescn3"],
      observations: [
        "Dung dịch chuyển sang màu đỏ máu",
        "Phản ứng nhận biết ion sắt(III)",
      ],
      heatChange: "none",
    };
  }

  // ─── CO₂ + Ca(OH)₂ → CaCO₃↓ (nước vôi trong hóa đục) ───
  if (
    (id1 === "co2" && id2 === "caoh2") ||
    (id1 === "caoh2" && id2 === "co2")
  ) {
    return {
      type: "precipitation",
      equation: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O",
      equationHtml:
        "<span class='text-gray-200'>CO₂</span> + <span class='text-white'>Ca(OH)₂</span> → <span class='text-gray-100'>CaCO₃↓</span> + " + WATER_HTML,
      description: "Nước vôi trong hóa đục do tạo kết tủa canxi cacbonat (nhận biết CO₂)",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#f0f0f5" },
        { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["caco3"],
      observations: [
        "Nước vôi trong chuyển thành màu trắng đục",
        "Có kết tủa canxi cacbonat",
        "Dùng để nhận biết khí CO₂",
      ],
      heatChange: "none",
    };
  }

  // ─── H₂O₂ + MnO₂ → O₂ (điều chế oxi) ───
  if (
    (id1 === "h2o2" && id2 === "mno2") ||
    (id1 === "mno2" && id2 === "h2o2")
  ) {
    return {
      type: "gas_evolution",
      equation: "2H₂O₂ →(MnO₂) 2H₂O + O₂↑",
      equationHtml:
        "2<span class='text-white'>H₂O₂</span> →(MnO₂) 2" + WATER_HTML + " + <span class='text-gray-200'>O₂↑</span>",
      description: "Hidro peroxit phân hủy nhanh tạo khí oxi khi có xúc tác MnO₂",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5000, particleCount: 35 },
        { type: "color_change", intensity: "low", duration: 1500, targetColor: "#ffffff" },
      ],
      products: ["o2"],
      observations: [
        "Sủi bọt khí mạnh (O₂)",
        "Que đóm còn tàn đỏ sẽ bùng cháy khi đưa vào",
        "MnO₂ là chất xúc tác, không bị biến đổi",
      ],
      heatChange: "exothermic",
    };
  }

  // ─── KClO₃ + MnO₂ → KCl + O₂ (nhiệt phân) ───
  if (
    (id1 === "kclo3" && id2 === "mno2") ||
    (id1 === "mno2" && id2 === "kclo3")
  ) {
    return {
      type: "gas_evolution",
      equation: "2KClO₃ →(MnO₂, t°) 2KCl + 3O₂↑",
      equationHtml:
        "2<span class='text-white'>KClO₃</span> →(MnO₂, t°) 2<span class='text-white'>KCl</span> + 3<span class='text-gray-200'>O₂↑</span>",
      description: "Kali clorat phân hủy khi đun nóng với xúc tác MnO₂, giải phóng khí oxi",
      effects: [
        { type: "bubbles", intensity: "high", duration: 6000, particleCount: 30 },
        { type: "sparkle", intensity: "low", duration: 2000 },
      ],
      products: ["kcl", "o2"],
      observations: [
        "Chất rắn tan dần khi đun nóng",
        "Sủi bọt khí O₂",
        "Que đóm còn tàn đỏ bùng cháy (thử O₂)",
      ],
      heatChange: "endothermic",
    };
  }

  // ─── Acid + Base → Trung hòa ───
  if (
    (chemical1.category === "acid" && chemical2.category === "base") ||
    (chemical1.category === "base" && chemical2.category === "acid")
  ) {
    const acid = chemical1.category === "acid" ? chemical1 : chemical2;
    const base = chemical1.category === "base" ? chemical1 : chemical2;

    // HCl + NaOH → NaCl + H₂O
    if (
      (acid.id === "hcl" && base.id === "naoh") ||
      (acid.id === "naoh" && base.id === "hcl")
    ) {
      return {
        type: "acid_base",
        equation:
          "NaOH + HCl → NaCl + H₂O",
        equationHtml:
          "<span class='text-chemical-blue'>NaOH</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-white'>NaCl</span> + " + WATER_HTML,
        description: "Phản ứng trung hòa tạo muối và nước",
        effects: [
          { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
          { type: "bubbles", intensity: "low", duration: 3000 },
        ],
        products: ["nacl"],
        observations: [
          "Dung dịch trở nên trong suốt",
          "Xuất hiện bọt khí nhẹ",
          "Phản ứng tỏa nhiệt nhẹ",
        ],
        heatChange: "exothermic",
      };
    }

    // NaOH + CH₃COOH → CH₃COONa + H₂O
    if (
      (acid.id === "ch3cooh" && base.id === "naoh") ||
      (acid.id === "naoh" && base.id === "ch3cooh")
    ) {
      return {
        type: "acid_base",
        equation:
          "NaOH + CH₃COOH → CH₃COONa + H₂O",
        equationHtml:
          "<span class='text-chemical-blue'>NaOH</span> + <span class='text-chemical-orange'>CH₃COOH</span> → <span class='text-white'>CH₃COONa</span> + " + WATER_HTML,
        description: "Phản ứng trung hòa giữa bazơ mạnh và axit yếu",
        effects: [
          { type: "color_change", intensity: "low", duration: 1500, targetColor: "#ffffff" },
        ],
        products: ["ch3coona"],
        observations: ["Dung dịch trở nên trong suốt", "Có mùi khét nhẹ"],
        heatChange: "exothermic",
      };
    }

    // NH₃ + HCl → NH₄Cl (khói trắng)
    if (
      (acid.id === "hcl" && base.id === "nh3") ||
      (acid.id === "nh3" && base.id === "hcl")
    ) {
      return {
        type: "acid_base",
        equation:
          "NH₃ + HCl → NH₄Cl",
        equationHtml:
          "<span class='text-gray-300'>NH₃</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-white'>NH₄Cl</span>",
        description: "Phản ứng tạo khói trắng amoni clorua",
        effects: [
          { type: "smoke", intensity: "high", duration: 4000 },
          { type: "color_change", intensity: "low", duration: 1000, targetColor: "#ffffff" },
        ],
        products: ["nh4cl"],
        observations: [
          "Xuất hiện khói trắng dày đặc",
          "Phản ứng tỏa nhiệt",
          "Tạo thành muối amoni",
        ],
        heatChange: "exothermic",
      };
    }

    // NaOH + H₂SO₄ → Na₂SO₄ + 2H₂O
    if (
      (acid.id === "h2so4" && base.id === "naoh") ||
      (acid.id === "naoh" && base.id === "h2so4")
    ) {
      return {
        type: "acid_base",
        equation:
          "2NaOH + H₂SO₄ → Na₂SO₄ + 2H₂O",
        equationHtml:
          "2<span class='text-chemical-blue'>NaOH</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-white'>Na₂SO₄</span> + 2" + WATER_HTML,
        description: "Phản ứng trung hòa giữa natri hidroxit và axit sunfuric",
        effects: [
          { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
        ],
        products: ["na2so4"],
        observations: [
          "Dung dịch trở nên trong suốt",
          "Phản ứng tỏa nhiệt",
        ],
        heatChange: "exothermic",
      };
    }

    // Ca(OH)₂ + HCl → CaCl₂ + 2H₂O
    if (
      (acid.id === "hcl" && base.id === "caoh2") ||
      (acid.id === "caoh2" && base.id === "hcl")
    ) {
      return {
        type: "acid_base",
        equation:
          "Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O",
        equationHtml:
          "<span class='text-white'>Ca(OH)₂</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>CaCl₂</span> + 2" + WATER_HTML,
        description: "Phản ứng trung hòa giữa nước vôi trong và axit clohidric",
        effects: [
          { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
        ],
        products: ["cacl2"],
        observations: [
          "Dung dịch trở nên trong suốt",
          "Phản ứng tỏa nhiệt nhẹ",
        ],
        heatChange: "exothermic",
      };
    }

    // Ca(OH)₂ + CH₃COOH → (CH₃COO)₂Ca + 2H₂O
    if (
      (acid.id === "ch3cooh" && base.id === "caoh2") ||
      (acid.id === "caoh2" && base.id === "ch3cooh")
    ) {
      return {
        type: "acid_base",
        equation:
          "Ca(OH)₂ + 2CH₃COOH → (CH₃COO)₂Ca + 2H₂O",
        equationHtml:
          "<span class='text-white'>Ca(OH)₂</span> + 2<span class='text-chemical-orange'>CH₃COOH</span> → <span class='text-white'>(CH₃COO)₂Ca</span> + 2" + WATER_HTML,
        description: "Phản ứng trung hòa giữa canxi hidroxit và axit axetic",
        effects: [
          { type: "color_change", intensity: "low", duration: 1500, targetColor: "#ffffff" },
        ],
        products: ["ca_ch3coo2"],
        observations: [
          "Dung dịch trở nên trong suốt",
        ],
        heatChange: "exothermic",
      };
    }
  }

  // ─── Metal + Acid → H₂ ───
  if (
    (chemical1.category === "metal" && chemical2.category === "acid") ||
    (chemical1.category === "acid" && chemical2.category === "metal")
  ) {
    const metal = chemical1.category === "metal" ? chemical1 : chemical2;
    const acid = chemical1.category === "acid" ? chemical1 : chemical2;

    // Zn + HCl → ZnCl₂ + H₂↑
    if (
      (metal.id === "zn" && acid.id === "hcl") ||
      (metal.id === "hcl" && acid.id === "zn")
    ) {
      return {
        type: "metal_acid",
        equation: "Zn + 2HCl → ZnCl₂ + H₂↑",
        equationHtml:
          "<span class='text-gray-300'>Zn</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>ZnCl₂</span> + <span class='text-cyan-300'>H₂↑</span>",
        description: "Kẽm tác dụng với axit clohidric giải phóng khí hidro",
        effects: [
          { type: "bubbles", intensity: "medium", duration: 3000 },
          { type: "dissolve", intensity: "low", duration: 4000 },
        ],
        products: ["zncl2", "h2"],
        observations: [
          "Sủi bọt khí mãnh liệt",
          "Mảnh kẽm tan dần",
          "Ống nghiệm nóng lên",
        ],
        heatChange: "exothermic",
      };
    }

    // Mg + HCl → MgCl₂ + H₂↑
    if (
      (metal.id === "mg" && acid.id === "hcl") ||
      (metal.id === "hcl" && acid.id === "mg")
    ) {
      return {
        type: "metal_acid",
        equation: "Mg + 2HCl → MgCl₂ + H₂↑",
        equationHtml:
          "<span class='text-gray-300'>Mg</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>MgCl₂</span> + <span class='text-cyan-300'>H₂↑</span>",
        description: "Magie tác dụng với axit clohidric giải phóng khí hidro",
        effects: [
          { type: "bubbles", intensity: "high", duration: 2500 },
          { type: "dissolve", intensity: "high", duration: 2500 },
          { type: "flash", intensity: "low", duration: 500 },
        ],
        products: ["mgcl2", "h2"],
        observations: [
          "Sủi bọt khí rất mãnh liệt",
          "Dải Magie tan rất nhanh",
          "Phản ứng tỏa nhiệt mạnh, dung dịch nóng lên",
        ],
        heatChange: "exothermic",
      };
    }


    // Fe + HCl → FeCl₂ + H₂↑
    if (
      (metal.id === "fe" && acid.id === "hcl") ||
      (metal.id === "hcl" && acid.id === "fe")
    ) {
      return {
        type: "metal_acid",
        equation: "Fe + 2HCl → FeCl₂ + H₂↑",
        equationHtml:
          "<span class='text-gray-400'>Fe</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-chemical-green'>FeCl₂</span> + <span class='text-cyan-300'>H₂↑</span>",
        description: "Sắt tan trong axit clohidric tạo dung dịch màu xanh lục nhạt",
        effects: [
          { type: "bubbles", intensity: "medium", duration: 5000, particleCount: 20 },
          { type: "color_change", intensity: "high", duration: 3000, targetColor: "#66bb88" },
        ],
        products: ["fecl2"],
        observations: [
          "Sắt tan dần",
          "Có bọt khí thoát ra (H₂)",
          "Dung dịch chuyển màu xanh lục nhạt",
        ],
        heatChange: "exothermic",
      };
    }

    // Mg + HCl → MgCl₂ + H₂↑
    if (
      (metal.id === "mg" && acid.id === "hcl") ||
      (metal.id === "hcl" && acid.id === "mg")
    ) {
      return {
        type: "metal_acid",
        equation: "Mg + 2HCl → MgCl₂ + H₂↑",
        equationHtml:
          "<span class='text-gray-300'>Mg</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>MgCl₂</span> + <span class='text-cyan-300'>H₂↑</span>",
        description: "Magie tan mãnh liệt trong axit clohidric",
        effects: [
          { type: "bubbles", intensity: "high", duration: 4000, particleCount: 40 },
          { type: "sparkle", intensity: "medium", duration: 2000 },
          { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
        ],
        products: ["mgcl2"],
        observations: [
          "Kim loại tan nhanh, tỏa nhiều nhiệt",
          "Sủi bọt khí dữ dội (H₂)",
          "Dung dịch trong suốt",
        ],
        heatChange: "exothermic",
      };
    }

    // Al + HCl → AlCl₃ + H₂↑
    if (
      (metal.id === "al" && acid.id === "hcl") ||
      (metal.id === "hcl" && acid.id === "al")
    ) {
      return {
        type: "metal_acid",
        equation: "2Al + 6HCl → 2AlCl₃ + 3H₂↑",
        equationHtml:
          "2<span class='text-gray-300'>Al</span> + 6<span class='text-chemical-red'>HCl</span> → 2<span class='text-white'>AlCl₃</span> + 3<span class='text-cyan-300'>H₂↑</span>",
        description: "Nhôm tan trong axit clohidric",
        effects: [
          { type: "bubbles", intensity: "medium", duration: 5000, particleCount: 25 },
          { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
        ],
        products: ["alcl3"],
        observations: [
          "Nhôm tan dần",
          "Có bọt khí thoát ra (H₂)",
          "Phản ứng tỏa nhiệt",
        ],
        heatChange: "exothermic",
      };
    }

    // Zn + H₂SO₄ → ZnSO₄ + H₂↑
    if (
      (metal.id === "zn" && acid.id === "h2so4") ||
      (metal.id === "h2so4" && acid.id === "zn")
    ) {
      return {
        type: "metal_acid",
        equation: "Zn + H₂SO₄ → ZnSO₄ + H₂↑",
        equationHtml:
          "<span class='text-gray-300'>Zn</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-white'>ZnSO₄</span> + <span class='text-cyan-300'>H₂↑</span>",
        description: "Kẽm tan trong axit sunfuric loãng, giải phóng khí hidro",
        effects: [
          { type: "bubbles", intensity: "high", duration: 5000, particleCount: 30 },
          { type: "color_change", intensity: "medium", duration: 2500, targetColor: "#ffffff" },
        ],
        products: ["znso4"],
        observations: [
          "Kẽm tan dần",
          "Sủi bọt khí H₂",
          "Dung dịch trong suốt",
        ],
        heatChange: "exothermic",
      };
    }

    // Fe + H₂SO₄ → FeSO₄ + H₂↑
    if (
      (metal.id === "fe" && acid.id === "h2so4") ||
      (metal.id === "h2so4" && acid.id === "fe")
    ) {
      return {
        type: "metal_acid",
        equation: "Fe + H₂SO₄ → FeSO₄ + H₂↑",
        equationHtml:
          "<span class='text-gray-400'>Fe</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-chemical-green'>FeSO₄</span> + <span class='text-cyan-300'>H₂↑</span>",
        description: "Sắt tan trong axit sunfuric loãng tạo dung dịch xanh lục nhạt",
        effects: [
          { type: "bubbles", intensity: "medium", duration: 4500, particleCount: 20 },
          { type: "color_change", intensity: "high", duration: 3000, targetColor: "#66bb88" },
        ],
        products: ["feso4"],
        observations: [
          "Sắt tan dần",
          "Có bọt khí H₂ thoát ra",
          "Dung dịch màu xanh lục nhạt",
        ],
        heatChange: "exothermic",
      };
    }
  }

  // ─── Kim loại đẩy muối (phản ứng thế) ───

  // Fe + CuSO₄ → FeSO₄ + Cu↓
  if (
    (id1 === "fe" && id2 === "cuso4") ||
    (id1 === "cuso4" && id2 === "fe")
  ) {
    return {
      type: "redox",
      equation: "Fe + CuSO₄ → FeSO₄ + Cu↓",
      equationHtml:
        "<span class='text-gray-400'>Fe</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-chemical-green'>FeSO₄</span> + <span class='text-chemical-orange'>Cu↓</span>",
      description: "Sắt đẩy đồng ra khỏi dung dịch muối đồng sunfat",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#66bb88" },
      ],
      products: ["feso4", "cu"],
      observations: [
        "Dung dịch xanh lam nhạt dần",
        "Xuất hiện chất rắn màu đỏ cam bám trên sắt (Cu)",
        "Dung dịch chuyển màu xanh lục nhạt (FeSO₄)",
      ],
      heatChange: "exothermic",
    };
  }

  // Zn + CuSO₄ → ZnSO₄ + Cu↓
  if (
    (id1 === "zn" && id2 === "cuso4") ||
    (id1 === "cuso4" && id2 === "zn")
  ) {
    return {
      type: "redox",
      equation: "Zn + CuSO₄ → ZnSO₄ + Cu↓",
      equationHtml:
        "<span class='text-gray-300'>Zn</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-white'>ZnSO₄</span> + <span class='text-chemical-orange'>Cu↓</span>",
      description: "Kẽm đẩy đồng ra khỏi dung dịch muối đồng sunfat",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#ffffff" },
      ],
      products: ["znso4", "cu"],
      observations: [
        "Dung dịch xanh lam nhạt dần",
        "Xuất hiện chất rắn màu đỏ cam (Cu)",
        "Dung dịch trở nên trong suốt (ZnSO₄)",
      ],
      heatChange: "exothermic",
    };
  }

  // Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag↓
  if (
    (id1 === "cu" && id2 === "agno3") ||
    (id1 === "agno3" && id2 === "cu")
  ) {
    return {
      type: "redox",
      equation: "Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag↓",
      equationHtml:
        "<span class='text-chemical-orange'>Cu</span> + 2<span class='text-white'>AgNO₃</span> → <span class='text-chemical-blue'>Cu(NO₃)₂</span> + 2<span class='text-gray-200'>Ag↓</span>",
      description: "Đồng đẩy bạc ra khỏi dung dịch bạc nitrat",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#d0d0d8" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#4488ff" },
        { type: "sparkle", intensity: "low", duration: 1500 },
      ],
      products: ["cu_no32", "ag"],
      observations: [
        "Dung dịch không màu chuyển dần sang màu xanh lam (Cu(NO₃)₂)",
        "Xuất hiện chất rắn màu trắng xám (Ag) bám trên đồng",
        "Phản ứng đặc trưng của dãy hoạt động kim loại",
      ],
      heatChange: "exothermic",
    };
  }

  // ─── Precipitation reactions ───
  // CuSO₄ + NaOH → Cu(OH)₂↓ (kết tủa xanh)
  if (
    (id1 === "cuso4" && id2 === "naoh") ||
    (id1 === "naoh" && id2 === "cuso4")
  ) {
    return {
      type: "precipitation",
      equation:
        "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄",
      equationHtml:
        "<span class='text-chemical-blue'>CuSO₄</span> + 2<span class='text-white'>NaOH</span> → <span class='text-cyan-300'>Cu(OH)₂↓</span> + <span class='text-white'>Na₂SO₄</span>",
      description: "Tạo kết tủa đồng(II) hidroxit màu xanh lam",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#3388ff" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#3388ff" },
      ],
      products: ["cuoh2", "na2so4"],
      observations: [
        "Xuất hiện kết tủa màu xanh lam (Cu(OH)₂)",
        "Dung dịch nhạt màu dần",
        "Kết tủa không tan",
      ],
      heatChange: "none",
    };
  }

  // FeCl₃ + NaOH → Fe(OH)₃↓ (kết tủa nâu đỏ)
  if (
    (id1 === "fecl3" && id2 === "naoh") ||
    (id1 === "naoh" && id2 === "fecl3")
  ) {
    return {
      type: "precipitation",
      equation:
        "FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl",
      equationHtml:
        "<span class='text-chemical-orange'>FeCl₃</span> + 3<span class='text-white'>NaOH</span> → <span class='text-chemical-red'>Fe(OH)₃↓</span> + 3<span class='text-white'>NaCl</span>",
      description: "Tạo kết tủa sắt(III) hidroxit màu nâu đỏ",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#cc4400" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#cc4400" },
      ],
      products: ["feoh3", "nacl"],
      observations: [
        "Xuất hiện kết tủa màu nâu đỏ (Fe(OH)₃)",
        "Dung dịch chuyển từ vàng nâu sang không màu",
        "Kết tủa dạng bông",
      ],
      heatChange: "none",
    };
  }

  // AgNO₃ + NaCl → AgCl↓ + NaNO₃ (kết tủa trắng)
  if (
    (id1 === "agno3" && id2 === "nacl") ||
    (id1 === "nacl" && id2 === "agno3")
  ) {
    return {
      type: "precipitation",
      equation:
        "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
      equationHtml:
        "<span class='text-white'>AgNO₃</span> + <span class='text-white'>NaCl</span> → <span class='text-gray-200'>AgCl↓</span> + <span class='text-white'>NaNO₃</span>",
      description: "Tạo kết tủa bạc clorua màu trắng (nhận biết ion clorua)",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#dddddd" },
        { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
        { type: "flash", intensity: "low", duration: 1000 },
      ],
      products: ["agcl", "nano3"],
      observations: [
        "Xuất hiện kết tủa trắng đục (AgCl)",
        "Dung dịch chuyển từ trong sang đục",
        "Kết tủa hóa đen nếu để ngoài ánh sáng",
      ],
      heatChange: "none",
    };
  }

  // AgNO₃ + HCl → AgCl↓ + HNO₃ (kết tủa trắng)
  if (
    (id1 === "agno3" && id2 === "hcl") ||
    (id1 === "hcl" && id2 === "agno3")
  ) {
    return {
      type: "precipitation",
      equation:
        "AgNO₃ + HCl → AgCl↓ + HNO₃",
      equationHtml:
        "<span class='text-white'>AgNO₃</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-gray-200'>AgCl↓</span> + <span class='text-white'>HNO₃</span>",
      description: "Bạc nitrat tác dụng với axit clohidric tạo kết tủa trắng AgCl",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#dddddd" },
        { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
        { type: "flash", intensity: "low", duration: 1000 },
      ],
      products: ["agcl"],
      observations: [
        "Xuất hiện kết tủa trắng (AgCl)",
        "Dung dịch chuyển từ trong sang đục",
        "Nhận biết ion clorua trong dung dịch",
      ],
      heatChange: "none",
    };
  }

  // BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl (kết tủa trắng, không tan)
  if (
    (id1 === "bacl2" && id2 === "na2so4") ||
    (id1 === "na2so4" && id2 === "bacl2")
  ) {
    return {
      type: "precipitation",
      equation:
        "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl",
      equationHtml:
        "<span class='text-white'>BaCl₂</span> + <span class='text-white'>Na₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-white'>NaCl</span>",
      description: "Tạo kết tủa bari sunfat màu trắng (nhận biết ion sunfat)",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baso4", "nacl"],
      observations: [
        "Xuất hiện kết tủa trắng mịn (BaSO₄)",
        "Kết tủa không tan trong axit",
        "Nhận biết ion sunfat (SO₄²⁻)",
      ],
      heatChange: "none",
    };
  }

  // BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl
  if (
    (id1 === "bacl2" && id2 === "h2so4") ||
    (id1 === "h2so4" && id2 === "bacl2")
  ) {
    return {
      type: "precipitation",
      equation:
        "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl",
      equationHtml:
        "<span class='text-white'>BaCl₂</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-chemical-red'>HCl</span>",
      description: "Bari clorua tác dụng với axit sunfuric tạo kết tủa trắng BaSO₄",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baso4"],
      observations: [
        "Xuất hiện kết tủa trắng mịn (BaSO₄)",
        "Kết tủa không tan trong axit",
      ],
      heatChange: "none",
    };
  }

  // BaCl₂ + Na₂CO₃ → BaCO₃↓ + 2NaCl (kết tủa trắng)
  if (
    (id1 === "bacl2" && id2 === "na2co3") ||
    (id1 === "na2co3" && id2 === "bacl2")
  ) {
    return {
      type: "precipitation",
      equation:
        "BaCl₂ + Na₂CO₃ → BaCO₃↓ + 2NaCl",
      equationHtml:
        "<span class='text-white'>BaCl₂</span> + <span class='text-white'>Na₂CO₃</span> → <span class='text-gray-100'>BaCO₃↓</span> + 2<span class='text-white'>NaCl</span>",
      description: "Tạo kết tủa bari cacbonat màu trắng (tan trong axit giải phóng CO₂)",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baco3", "nacl"],
      observations: [
        "Xuất hiện kết tủa trắng (BaCO₃)",
        "Kết tủa tan trong axit mạnh tạo CO₂",
      ],
      heatChange: "none",
    };
  }

  // Ba(NO₃)₂ + Na₂SO₄ → BaSO₄↓ + 2NaNO₃
  if (
    (id1 === "ba_no32" && id2 === "na2so4") ||
    (id1 === "na2so4" && id2 === "ba_no32")
  ) {
    return {
      type: "precipitation",
      equation:
        "Ba(NO₃)₂ + Na₂SO₄ → BaSO₄↓ + 2NaNO₃",
      equationHtml:
        "<span class='text-white'>Ba(NO₃)₂</span> + <span class='text-white'>Na₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-white'>NaNO₃</span>",
      description: "Tạo kết tủa bari sunfat màu trắng (nhận biết ion sunfat)",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baso4", "nano3"],
      observations: [
        "Xuất hiện kết tủa trắng mịn (BaSO₄)",
        "Kết tủa không tan trong axit",
      ],
      heatChange: "none",
    };
  }

  // Ba(NO₃)₂ + H₂SO₄ → BaSO₄↓ + 2HNO₃
  if (
    (id1 === "ba_no32" && id2 === "h2so4") ||
    (id1 === "h2so4" && id2 === "ba_no32")
  ) {
    return {
      type: "precipitation",
      equation:
        "Ba(NO₃)₂ + H₂SO₄ → BaSO₄↓ + 2HNO₃",
      equationHtml:
        "<span class='text-white'>Ba(NO₃)₂</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-white'>HNO₃</span>",
      description: "Bari nitrat tác dụng với axit sunfuric tạo kết tủa trắng BaSO₄",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baso4"],
      observations: [
        "Xuất hiện kết tủa trắng mịn (BaSO₄)",
        "Kết tủa không tan trong axit",
      ],
      heatChange: "none",
    };
  }

  // Pb(NO₃)₂ + KI → PbI₂↓ (kết tủa vàng)
  if (
    (id1 === "pbno32" && id2 === "ki") ||
    (id1 === "ki" && id2 === "pbno32")
  ) {
    return {
      type: "precipitation",
      equation:
        "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃",
      equationHtml:
        "<span class='text-white'>Pb(NO₃)₂</span> + 2<span class='text-white'>KI</span> → <span class='text-chemical-yellow'>PbI₂↓</span> + 2<span class='text-white'>KNO₃</span>",
      description: "Tạo kết tủa chì(II) iodua màu vàng tươi",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#ffdd33" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#ffdd33" },
        { type: "sparkle", intensity: "low", duration: 2000 },
      ],
      products: ["pbi2", "kno3"],
      observations: [
        "Xuất hiện kết tủa màu vàng tươi (PbI₂)",
        "Kết tủa lấp lánh dưới ánh sáng",
        "Phản ứng tạo màu rất đẹp",
      ],
      heatChange: "none",
    };
  }

  // ─── Acid + Muối cacbonat → CO₂ ───
  // Sử dụng cờ `carbonate` trên hóa chất để áp dụng cho mọi muối cacbonat
  const carb1 = chemical1.carbonate ? chemical1 : null;
  const carb2 = chemical2.carbonate ? chemical2 : null;
  const acidForCarb =
    chemical1.category === "acid" ? chemical1 : chemical2.category === "acid" ? chemical2 : null;
  const carbonateChem = carb1 && chemical1.category !== "acid" ? carb1 : carb2 && chemical2.category !== "acid" ? carb2 : null;

  if (carbonateChem && acidForCarb) {
    const carbInfo = CARBONATE_INFO[carbonateChem.id];
    const acidInfo = ACID_INFO[acidForCarb.id];
    const saltInfo = CARBONATE_SALT[carbonateChem.id]?.[acidForCarb.id];
    if (carbInfo && acidInfo && saltInfo) {
      const saltCoefStr = carbInfo.saltCoef > 1 ? `${carbInfo.saltCoef}` : "";
      const equation = `${carbInfo.formula} + ${acidInfo.coef > 1 ? `${acidInfo.coef}` : ""}${acidInfo.formula} → ${saltCoefStr}${saltInfo.saltFormula} + H₂O + CO₂↑`;
      const equationHtml = `${carbInfo.html} + ${acidInfo.html} → ${saltCoefStr}${saltInfo.saltHtml} + ${WATER_HTML} + ${CO2_HTML}`;
      const products = [saltInfo.saltId, "co2"];
      return {
        type: "gas_evolution",
        equation,
        equationHtml,
        description: "Muối cacbonat tác dụng với axit giải phóng khí cacbonic (sủi bọt mạnh)",
        effects: saltInfo.precipitate
          ? [
              { type: "bubbles", intensity: "high", duration: 5000, particleCount: 30 },
              { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
            ]
          : [
              { type: "bubbles", intensity: "high", duration: 5000, particleCount: 30 },
              { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
            ],
        products,
        observations: [
          "Sủi bọt khí mạnh (CO₂)",
          "Dung dịch trở nên trong suốt",
          "Tạo thành muối, nước và khí cacbonic",
        ],
        heatChange: "exothermic",
      };
    }
  }

  // ─── Color change with indicator ───
  // Phenolphthalein + Base → Pink
  if (
    (id1 === "phenolphthalein" && chemical2.category === "base") ||
    (chemical1.category === "base" && id2 === "phenolphthalein")
  ) {
    return {
      type: "color_change",
      equation: "PP → PP⁻ (dạng ion màu hồng)",
      equationHtml:
        "<span class='text-white'>Phenolphthalein</span> + <span class='text-chemical-blue'>OH⁻</span> → <span class='text-pink-400'>Màu hồng</span>",
      description: "Phenolphthalein chuyển sang màu hồng trong môi trường bazơ",
      effects: [
        { type: "color_change", intensity: "high", duration: 2000, targetColor: "#ff44aa" },
        { type: "sparkle", intensity: "low", duration: 1500 },
      ],
      products: [],
      observations: [
        "Dung dịch chuyển từ không màu sang hồng",
        "Màu hồng đậm dần khi tăng pH",
      ],
      heatChange: "none",
    };
  }

  // Metyl da cam + Acid → Red
  if (
    (id1 === "metyl_da" && chemical2.category === "acid") ||
    (chemical1.category === "acid" && id2 === "metyl_da")
  ) {
    return {
      type: "color_change",
      equation: "MO (vàng) + H⁺ → MO⁻ (đỏ)",
      equationHtml:
        "<span class='text-chemical-orange'>Metyl da cam</span> + <span class='text-chemical-red'>H⁺</span> → <span class='text-red-400'>Màu đỏ</span>",
      description: "Metyl da cam chuyển sang màu đỏ trong môi trường axit",
      effects: [
        { type: "color_change", intensity: "high", duration: 2000, targetColor: "#ff3333" },
      ],
      products: [],
      observations: [
        "Dung dịch chuyển từ vàng/cam sang đỏ",
        "Màu đỏ tươi đặc trưng trong môi trường axit",
      ],
      heatChange: "none",
    };
  }

  // Metyl da cam + Base → Yellow
  if (
    (id1 === "metyl_da" && chemical2.category === "base") ||
    (chemical1.category === "base" && id2 === "metyl_da")
  ) {
    return {
      type: "color_change",
      equation: "MO (đỏ) + OH⁻ → MO⁻ (vàng)",
      equationHtml:
        "<span class='text-chemical-red'>Metyl da cam</span> + <span class='text-chemical-blue'>OH⁻</span> → <span class='text-chemical-yellow'>Màu vàng</span>",
      description: "Metyl da cam chuyển sang màu vàng trong môi trường bazơ",
      effects: [
        { type: "color_change", intensity: "high", duration: 2000, targetColor: "#ffdd33" },
      ],
      products: [],
      observations: [
        "Dung dịch chuyển từ cam sang vàng",
      ],
      heatChange: "none",
    };
  }

  // ─── KMnO₄ + FeSO₄ (Redox, cần môi trường H₂SO₄ loãng) ───
  if (
    (id1 === "kmno4" && id2 === "feso4") ||
    (id1 === "feso4" && id2 === "kmno4")
  ) {
    return {
      type: "redox",
      equation:
        "2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O",
      equationHtml:
        "2<span class='text-purple-400'>KMnO₄</span> + 10<span class='text-chemical-green'>FeSO₄</span> → ... → <span class='text-yellow-500'>Fe₂(SO₄)₃</span>",
      description:
        "Phản ứng oxi hóa khử trong môi trường H₂SO₄ loãng: KMnO₄ (tím) bị khử, FeSO₄ bị oxi hóa thành Fe₂(SO₄)₃. Lưu ý: cần thêm H₂SO₄ loãng để phản ứng diễn ra hoàn toàn.",
      effects: [
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#bb8833" },
        { type: "bubbles", intensity: "low", duration: 2000 },
        { type: "flash", intensity: "medium", duration: 1500 },
      ],
      products: ["fe2so43", "k2so4", "mnso4"],
      observations: [
        "Dung dịch tím nhạt dần",
        "Chuyển sang màu vàng nâu của Fe³⁺",
      ],
      heatChange: "exothermic",
    };
  }

  // ─── BaCl₂ + H₂SO₄ (Tạo kết tủa trắng) ───
  if (
    (id1 === "bacl2" && id2 === "h2so4") ||
    (id1 === "h2so4" && id2 === "bacl2")
  ) {
    return {
      type: "precipitation",
      equation: "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl",
      equationHtml:
        "<span class='text-white'>BaCl₂</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-white'>HCl</span>",
      description: "Phản ứng tạo kết tủa trắng Bari sunfat (BaSO₄).",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3000 },
      ],
      products: ["baso4", "hcl"],
      observations: [
        "Xuất hiện kết tủa trắng",
        "Kết tủa không tan trong axit dư",
      ],
      heatChange: "none",
    };
  }

  // ─── No reaction ───
  return null;
}

// ─── Phản ứng khi đun nóng một hóa chất ───
export function getHeatingReaction(chemical: Chemical): ReactionResult | null {
  switch (chemical.id) {
    // Etanol cháy → CO₂ + H₂O
    case "etanol": {
      return {
        type: "combustion",
        equation: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O",
        equationHtml:
          "<span class='text-white'>C₂H₅OH</span> + 3<span class='text-gray-200'>O₂</span> → 2<span class='text-gray-200'>CO₂</span> + 3" + WATER_HTML,
        description: "Etanol cháy với ngọn lửa màu xanh, tỏa nhiều nhiệt",
        effects: [
          { type: "flame", intensity: "high", duration: 5000 },
          { type: "smoke", intensity: "low", duration: 3000 },
        ],
        products: ["co2"],
        observations: [
          "Etanol bốc cháy với ngọn lửa màu xanh",
          "Phản ứng tỏa nhiều nhiệt",
          "Sinh ra khí CO₂ và hơi nước",
        ],
        heatChange: "exothermic",
      };
    }

    // Magie cháy → MgO
    case "mg": {
      return {
        type: "combustion",
        equation: "2Mg + O₂ → 2MgO",
        equationHtml:
          "2<span class='text-gray-300'>Mg</span> + <span class='text-gray-200'>O₂</span> → 2<span class='text-white'>MgO</span>",
        description: "Magie cháy sáng chói trong không khí tạo magie oxit",
        effects: [
          { type: "flame", intensity: "high", duration: 4000 },
          { type: "sparkle", intensity: "high", duration: 3000 },
          { type: "flash", intensity: "high", duration: 1500 },
        ],
        products: ["mgo"],
        observations: [
          "Magie cháy với ngọn lửa sáng chói màu trắng",
          "Tạo chất rắn màu trắng (MgO)",
          "Phản ứng tỏa rất nhiều nhiệt",
        ],
        heatChange: "exothermic",
      };
    }

    // CaCO₃ nhiệt phân → CaO + CO₂
    case "caco3": {
      return {
        type: "gas_evolution",
        equation: "CaCO₃ →(t°) CaO + CO₂↑",
        equationHtml:
          "<span class='text-gray-200'>CaCO₃</span> →(t°) <span class='text-white'>CaO</span> + " + CO2_HTML,
        description: "Nhiệt phân đá vôi ở khoảng 900°C tạo vôi sống và khí cacbonic",
        effects: [
          { type: "bubbles", intensity: "low", duration: 6000 },
          { type: "flash", intensity: "low", duration: 2000 },
        ],
        products: ["cao", "co2"],
        observations: [
          "Chất rắn chuyển thành vôi sống (CaO)",
          "Giải phóng khí CO₂",
          "Phản ứng thu nhiệt",
        ],
        heatChange: "endothermic",
      };
    }

    // H₂O₂ đun nóng → H₂O + O₂
    case "h2o2": {
      return {
        type: "gas_evolution",
        equation: "2H₂O₂ →(t°) 2H₂O + O₂↑",
        equationHtml:
          "2<span class='text-white'>H₂O₂</span> →(t°) 2" + WATER_HTML + " + <span class='text-gray-200'>O₂↑</span>",
        description: "Hidro peroxit phân hủy khi đun nóng giải phóng khí oxi",
        effects: [
          { type: "bubbles", intensity: "medium", duration: 4000, particleCount: 20 },
        ],
        products: ["o2"],
        observations: [
          "Sủi bọt khí O₂",
          "Que đóm còn tàn đỏ bùng cháy khi đưa vào",
        ],
        heatChange: "endothermic",
      };
    }

    default:
      return null;
  }
}
