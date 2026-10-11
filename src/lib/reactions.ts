// ─── Chemical Reaction Engine ───
// Định nghĩa các phản ứng hóa học bám sát chương trình GDPT 2018 và hiệu ứng mô phỏng

import { Chemical } from "./chemicals";

export type ReactionType =
  | "acid_base" // Trung hòa axit-bazơ
  | "metal_acid" // Kim loại + Axit → H₂
  | "precipitation" // Tạo kết tủa
  | "color_change" // Đổi màu (chất chỉ thị)
  | "redox" // Oxi hóa khử
  | "combustion" // Cháy
  | "gas_evolution" // Sinh khí (CO₂, SO₂, NO₂...)
  | "complex" // Tạo phức
  | "none"; // Không phản ứng (kèm giải thích khoa học)

// Nhãn dùng chung cho các loại phản ứng
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
  none: "border-l-gray-400 dark:border-l-gray-500",
};

export interface ReactionEffect {
  type: "bubbles" | "color_change" | "precipitate" | "smoke" | "flame" | "flash" | "dissolve" | "sparkle";
  intensity: "low" | "medium" | "high";
  duration: number; // ms
  targetColor?: string;
  particleCount?: number;
}

export interface RealVideoDemo {
  url: string;
  fallbackUrls?: string[];
  title: string;
  description?: string;
  sourceName?: string;
  safetyWarning?: string;
  realPhenomena?: string[];
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
  realVideo?: RealVideoDemo;
}

// ─── Dữ liệu phản ứng Muối cacbonat + Axit ───
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
const H2_HTML = "<span class='text-cyan-300'>H₂↑</span>";
const NO2_HTML = "<span class='text-amber-700 font-semibold'>NO₂↑</span>";
const SO2_HTML = "<span class='text-amber-500 font-semibold'>SO₂↑</span>";

// Phản ứng giữa 2 hóa chất
export function getReaction(
  chemical1: Chemical,
  chemical2: Chemical
): ReactionResult | null {
  const id1 = chemical1.id;
  const id2 = chemical2.id;
  const pair = (a: string, b: string) => (id1 === a && id2 === b) || (id1 === b && id2 === a);

  // ══════════════════════════════════════════════════════════════
  // 1. CHẤT CHỈ THỊ (INDICATORS)
  // ══════════════════════════════════════════════════════════════

  // Giấy quỳ tím + Axit → Đỏ
  if ((id1 === "quytim" && chemical2.category === "acid") || (chemical1.category === "acid" && id2 === "quytim")) {
    return {
      type: "color_change",
      equation: "Quỳ tím + H⁺ → Màu đỏ",
      equationHtml: "<span class='text-purple-400'>Quỳ tím</span> + <span class='text-chemical-red'>H⁺</span> → <span class='text-red-400'>Màu đỏ</span>",
      description: "Giấy quỳ tím chuyển sang màu đỏ trong môi trường axit",
      effects: [{ type: "color_change", intensity: "high", duration: 1500, targetColor: "#ff3333" }],
      products: [],
      observations: ["Giấy quỳ tím chuyển sang màu đỏ", "Môi trường axit (pH < 7)"],
      heatChange: "none",
    };
  }

  // Giấy quỳ tím + Bazơ → Xanh
  if ((id1 === "quytim" && chemical2.category === "base") || (chemical1.category === "base" && id2 === "quytim")) {
    return {
      type: "color_change",
      equation: "Quỳ tím + OH⁻ → Màu xanh",
      equationHtml: "<span class='text-purple-400'>Quỳ tím</span> + <span class='text-chemical-blue'>OH⁻</span> → <span class='text-blue-400'>Màu xanh</span>",
      description: "Giấy quỳ tím chuyển sang màu xanh trong môi trường bazơ",
      effects: [{ type: "color_change", intensity: "high", duration: 1500, targetColor: "#3388ff" }],
      products: [],
      observations: ["Giấy quỳ tím chuyển sang màu xanh", "Môi trường bazơ (pH > 7)"],
      heatChange: "none",
    };
  }

  // Phenolphthalein + Bazơ → Hồng
  if ((id1 === "phenolphthalein" && chemical2.category === "base") || (chemical1.category === "base" && id2 === "phenolphthalein")) {
    return {
      type: "color_change",
      equation: "Phenolphthalein + OH⁻ → Màu hồng",
      equationHtml: "<span class='text-white'>Phenolphthalein</span> + <span class='text-chemical-blue'>OH⁻</span> → <span class='text-pink-400'>Màu hồng</span>",
      description: "Phenolphthalein chuyển sang màu hồng trong môi trường bazơ",
      effects: [
        { type: "color_change", intensity: "high", duration: 2000, targetColor: "#ff44aa" },
        { type: "sparkle", intensity: "low", duration: 1500 },
      ],
      products: [],
      observations: ["Dung dịch chuyển từ không màu sang hồng", "Màu hồng đậm dần khi tăng pH"],
      heatChange: "none",
    };
  }

  // Metyl da cam + Axit → Đỏ
  if ((id1 === "metyl_da" && chemical2.category === "acid") || (chemical1.category === "acid" && id2 === "metyl_da")) {
    return {
      type: "color_change",
      equation: "Metyl da cam + H⁺ → Màu đỏ",
      equationHtml: "<span class='text-chemical-orange'>Metyl da cam</span> + <span class='text-chemical-red'>H⁺</span> → <span class='text-red-400'>Màu đỏ</span>",
      description: "Metyl da cam chuyển sang màu đỏ trong môi trường axit",
      effects: [{ type: "color_change", intensity: "high", duration: 2000, targetColor: "#ff3333" }],
      products: [],
      observations: ["Dung dịch chuyển từ cam sang đỏ", "Môi trường axit (pH < 3.1)"],
      heatChange: "none",
    };
  }

  // Metyl da cam + Bazơ → Vàng
  if ((id1 === "metyl_da" && chemical2.category === "base") || (chemical1.category === "base" && id2 === "metyl_da")) {
    return {
      type: "color_change",
      equation: "Metyl da cam + OH⁻ → Màu vàng",
      equationHtml: "<span class='text-chemical-red'>Metyl da cam</span> + <span class='text-chemical-blue'>OH⁻</span> → <span class='text-chemical-yellow'>Màu vàng</span>",
      description: "Metyl da cam chuyển sang màu vàng trong môi trường bazơ",
      effects: [{ type: "color_change", intensity: "high", duration: 2000, targetColor: "#ffdd33" }],
      products: [],
      observations: ["Dung dịch chuyển từ cam sang vàng"],
      heatChange: "none",
    };
  }

  // I₂ + Tinh bột → Xanh tím
  if (pair("i2", "tinh_bot")) {
    return {
      type: "color_change",
      equation: "I₂ + Tinh bột → Hợp chất màu xanh tím",
      equationHtml: "<span class='text-purple-400'>I₂</span> + <span class='text-white'>Tinh bột</span> → <span class='text-indigo-400'>Màu xanh tím</span>",
      description: "Iot tạo phức màu xanh tím đặc trưng với tinh bột (thuốc thử nhận biết)",
      effects: [{ type: "color_change", intensity: "high", duration: 2500, targetColor: "#6a5acd" }],
      products: [],
      observations: ["Hỗn hợp chuyển sang màu xanh tím đặc trưng", "Dùng để nhận biết hồ tinh bột"],
      heatChange: "none",
    };
  }

  // FeCl₃ + KSCN → Phức đỏ máu
  if (pair("fecl3", "kscn")) {
    return {
      type: "complex",
      equation: "FeCl₃ + 3KSCN → [Fe(SCN)]²⁺ (đỏ máu) + ...",
      equationHtml: "<span class='text-chemical-orange'>Fe³⁺</span> + <span class='text-white'>SCN⁻</span> → <span class='text-red-500'>[Fe(SCN)]²⁺</span>",
      description: "Tạo phức màu đỏ máu đặc trưng, dùng nhận biết ion Fe³⁺",
      effects: [
        { type: "color_change", intensity: "high", duration: 2500, targetColor: "#cc1111" },
        { type: "sparkle", intensity: "low", duration: 1500 },
      ],
      products: ["fescn3"],
      observations: ["Dung dịch chuyển sang màu đỏ máu", "Phản ứng nhận biết ion sắt(III)"],
      heatChange: "none",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 2. KHÍ & PHẢN ỨNG ĐẶC BIỆT
  // ══════════════════════════════════════════════════════════════

  // CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O (nước vôi trong hóa đục)
  if (pair("co2", "caoh2")) {
    return {
      type: "precipitation",
      equation: "CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O",
      equationHtml: `${CO2_HTML} + <span class='text-white'>Ca(OH)₂</span> → <span class='text-gray-100'>CaCO₃↓</span> + ${WATER_HTML}`,
      description: "Nước vôi trong hóa đục do tạo kết tủa canxi cacbonat (nhận biết CO₂)",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#f0f0f5" },
        { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["caco3"],
      observations: ["Nước vôi trong chuyển thành màu trắng đục", "Có kết tủa canxi cacbonat", "Dùng để nhận biết khí CO₂"],
      heatChange: "none",
    };
  }

  // CO₂ + Ba(OH)₂ → BaCO₃↓ + H₂O
  if (pair("co2", "baoh2")) {
    return {
      type: "precipitation",
      equation: "CO₂ + Ba(OH)₂ → BaCO₃↓ + H₂O",
      equationHtml: `${CO2_HTML} + <span class='text-white'>Ba(OH)₂</span> → <span class='text-gray-100'>BaCO₃↓</span> + ${WATER_HTML}`,
      description: "Dung dịch bari hidroxit bị vẩn đục do tạo kết tủa trắng BaCO₃",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#f0f0f5" },
        { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baco3"],
      observations: ["Dung dịch xuất hiện kết tủa trắng đục BaCO₃", "Nhận biết khí cacbonic CO₂"],
      heatChange: "none",
    };
  }

  // H₂O₂ + MnO₂ → O₂ (điều chế oxi xúc tác)
  if (pair("h2o2", "mno2")) {
    return {
      type: "gas_evolution",
      equation: "2H₂O₂ →(MnO₂) 2H₂O + O₂↑",
      equationHtml: `2<span class='text-white'>H₂O₂</span> →(MnO₂) 2${WATER_HTML} + <span class='text-gray-200'>O₂↑</span>`,
      description: "Hidro peroxit phân hủy nhanh tạo khí oxi khi có xúc tác MnO₂",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5000, particleCount: 35 },
        { type: "color_change", intensity: "low", duration: 1500, targetColor: "#ffffff" },
      ],
      products: ["o2"],
      observations: ["Sủi bọt khí mạnh (O₂)", "Que đóm còn tàn đỏ sẽ bùng cháy khi đưa vào", "MnO₂ là chất xúc tác, không bị tiêu hao"],
      heatChange: "exothermic",
    };
  }

  // KClO₃ + MnO₂ → KCl + O₂ (nhiệt phân)
  if (pair("kclo3", "mno2")) {
    return {
      type: "gas_evolution",
      equation: "2KClO₃ →(MnO₂, t°) 2KCl + 3O₂↑",
      equationHtml: `2<span class='text-white'>KClO₃</span> →(MnO₂, t°) 2<span class='text-white'>KCl</span> + 3<span class='text-gray-200'>O₂↑</span>`,
      description: "Kali clorat phân hủy khi đun nóng với xúc tác MnO₂, giải phóng khí oxi",
      effects: [
        { type: "bubbles", intensity: "high", duration: 6000, particleCount: 30 },
        { type: "sparkle", intensity: "low", duration: 2000 },
      ],
      products: ["kcl", "o2"],
      observations: ["Chất rắn tan chảy và sủi bọt khí O₂", "Que đóm còn tàn đỏ bùng cháy (nhận biết O₂)"],
      heatChange: "endothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 3. ĐỒNG (Cu) VÀ CÁC AXIT (Trọng tâm câu hỏi người dùng!)
  // ══════════════════════════════════════════════════════════════

  // Cu + HNO₃ → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O (Axit nitric - Oxi hóa khử kinh điển!)
  if (pair("cu", "hno3")) {
    return {
      type: "redox",
      equation: "Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O",
      equationHtml: `<span class='text-chemical-orange'>Cu</span> + 4<span class='text-chemical-red'>HNO₃</span> → <span class='text-chemical-blue'>Cu(NO₃)₂</span> + 2${NO2_HTML} + 2${WATER_HTML}`,
      description: "Đồng tan mãnh liệt trong axit nitric đặc, sinh ra khí NO₂ màu nâu đỏ độc hại và dung dịch chuyển sang màu xanh lam.",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5500, particleCount: 40 },
        { type: "smoke", intensity: "high", duration: 4500 },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#1e88e5" },
        { type: "dissolve", intensity: "high", duration: 4500 },
      ],
      products: ["cu_no32", "no2"],
      observations: [
        "Mảnh đồng màu đỏ cam tan dần trong axit",
        "Sủi bọt khí mãnh liệt, thoát ra khí NO₂ màu nâu đỏ đặc trưng, mùi hắc độc hại",
        "Dung dịch chuyển dần từ không màu sang màu xanh lam đặc trưng của ion Cu²⁺",
        "Phản ứng tỏa nhiệt mạnh, ống nghiệm nóng lên rõ rệt",
      ],
      heatChange: "exothermic",
      realVideo: {
        url: "/api/videos/dong-va-axit-nitric.mp4",
        fallbackUrls: ["/videos/dong-va-axit-nitric.mp4", "/videos/dong va axit nitric.mp4"],
        title: "Thí nghiệm thực tế: Kim loại Đồng (Cu) tác dụng Axit Nitric (HNO₃)",
        description: "Hiện tượng phản ứng mãnh liệt ngoài đời thật: Mảnh đồng màu đỏ cam tan nhanh trong dung dịch axit nitric, dung dịch chuyển sang màu xanh lam đặc trưng của ion Cu²⁺, đồng thời sủi bọt khí NO₂ màu nâu đỏ độc hại cuộn trào dữ dội và tỏa nhiệt rất mạnh.",
        sourceName: "Phòng thí nghiệm Hóa học Thực nghiệm GDPT 2018",
        safetyWarning: "CẢNH BÁO AN TOÀN: Khí NO₂ sinh ra có độc tính rất cao đối với đường hô hấp và niêm mạc mắt. Thí nghiệm thực tế ngoài đời bắt buộc phải tiến hành trong tủ hút khí độc chuyên dụng (Fume Hood) và người thực hiện phải trang bị kính bảo hộ, găng tay!",
        realPhenomena: [
          "Mảnh đồng tan nhanh, bề mặt sủi bọt khí mãnh liệt",
          "Khí NO₂ màu nâu đỏ đặc quánh cuồn cuộn dâng lên khỏi miệng ống nghiệm",
          "Dung dịch chuyển dần từ không màu sang xanh lục rồi xanh lam biếc của Cu(NO₃)₂",
          "Thành ống nghiệm tỏa nhiệt rất nóng làm nóng dung dịch bên trong",
        ],
      },
    };
  }

  // Cu + H₂SO₄ → CuSO₄ + SO₂↑ + 2H₂O (Axit sunfuric đặc nóng)
  if (pair("cu", "h2so4")) {
    return {
      type: "redox",
      equation: "Cu + 2H₂SO₄(đặc) →(t°) CuSO₄ + SO₂↑ + 2H₂O",
      equationHtml: `<span class='text-chemical-orange'>Cu</span> + 2<span class='text-chemical-red'>H₂SO₄</span> →(t°) <span class='text-chemical-blue'>CuSO₄</span> + ${SO2_HTML} + 2${WATER_HTML}`,
      description: "Đồng tan trong axit sunfuric đặc nóng, giải phóng khí SO₂ có mùi hắc và tạo dung dịch đồng(II) sunfat màu xanh lam. (Lưu ý: Cu không phản ứng với H₂SO₄ loãng ở nhiệt độ phòng vì đứng sau H).",
      effects: [
        { type: "bubbles", intensity: "medium", duration: 5000, particleCount: 25 },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#2563eb" },
        { type: "dissolve", intensity: "medium", duration: 4500 },
      ],
      products: ["cuso4", "so2"],
      observations: [
        "Đồng tan khi đun nóng với H₂SO₄ đặc",
        "Sủi bọt khí SO₂ mùi hắc nồng, làm mất màu quỳ ẩm hoặc cánh hoa",
        "Dung dịch chuyển sang màu xanh lam của CuSO₄",
      ],
      heatChange: "exothermic",
      realVideo: {
        url: "/api/videos/dong-axit-sunfuric.mp4",
        fallbackUrls: ["/videos/dong-axit-sunfuric.mp4", "/videos/dong Axit Sunfuric.mp4"],
        title: "Thí nghiệm thực tế: Kim loại Đồng (Cu) tác dụng Axit Sunfuric đặc nóng (H₂SO₄)",
        description: "Hiện tượng phản ứng thực nghiệm ngoài đời: Khi đun nóng lá đồng trong axit sunfuric đặc H₂SO₄, đồng tan dần sinh bọt khí SO₂ mùi hắc nồng và dung dịch chuyển sang màu xanh lam đặc trưng của ion Cu²⁺ (muối CuSO₄).",
        sourceName: "Phòng thí nghiệm Hóa học Thực nghiệm GDPT 2018",
        safetyWarning: "CẢNH BÁO AN TOÀN: Axit H₂SO₄ đặc có tính háo nước và ăn mòn da cực kỳ nguy hiểm. Khí SO₂ sinh ra có mùi hắc độc hại. Thí nghiệm thực tế bắt buộc phải tiến hành trong tủ hút khí độc và đeo kính bảo hộ!",
        realPhenomena: [
          "Dưới tác dụng của nhiệt độ, lá đồng bắt đầu tan dần trong H₂SO₄ đặc",
          "Sủi bọt khí SO₂ không màu, có mùi hắc đặc trưng làm quỳ ẩm hóa đỏ",
          "Dung dịch trong ống nghiệm chuyển dần từ không màu sang màu xanh lam biếc của CuSO₄",
          "Phản ứng tỏa nhiệt kết hợp nung nóng",
        ],
      },
    };
  }

  // Cu + HCl → Không phản ứng ở điều kiện thường (Giải thích khoa học GDPT 2018)
  if (pair("cu", "hcl")) {
    return {
      type: "none",
      equation: "Cu + HCl → Không phản ứng (đk thường)",
      equationHtml: `<span class='text-chemical-orange'>Cu</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Đồng đứng sau hiđro trong dãy hoạt động hóa học của kim loại nên không khử được ion H⁺ trong axit HCl loãng.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#cc8833" }],
      products: [],
      observations: [
        "Mảnh đồng giữ nguyên màu đỏ cam, không bị tan",
        "Không có bọt khí bay ra",
        "Dãy hoạt động kim loại: K > Na > Ca > Mg > Al > Zn > Fe > (H) > Cu > Ag > Au",
        "Đồng chỉ phản ứng với axit có tính oxi hóa mạnh như HNO₃ hoặc H₂SO₄ đặc nóng",
      ],
      heatChange: "none",
    };
  }

  // Cu + CH₃COOH → Không phản ứng ở đk thường
  if (pair("cu", "ch3cooh")) {
    return {
      type: "none",
      equation: "Cu + CH₃COOH → Không phản ứng",
      equationHtml: `<span class='text-chemical-orange'>Cu</span> + <span class='text-chemical-orange'>CH₃COOH</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Đồng đứng sau hiđro nên không tác dụng với axit axetic ở điều kiện thường.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#cc8833" }],
      products: [],
      observations: ["Mảnh đồng không tan, không sủi bọt khí"],
      heatChange: "none",
    };
  }

  // Cu + FeCl₃ → CuCl₂ + 2FeCl₂ (Ăn mòn mạch in điện tử)
  if (pair("cu", "fecl3")) {
    return {
      type: "redox",
      equation: "Cu + 2FeCl₃ → CuCl₂ + 2FeCl₂",
      equationHtml: `<span class='text-chemical-orange'>Cu</span> + 2<span class='text-chemical-orange'>FeCl₃</span> → <span class='text-chemical-blue'>CuCl₂</span> + 2<span class='text-chemical-green'>FeCl₂</span>`,
      description: "Đồng khử Fe³⁺ về Fe²⁺, mảnh đồng tan dần làm dung dịch chuyển sang màu xanh lục/xanh lam (ứng dụng ăn mòn bo mạch điện tử).",
      effects: [
        { type: "dissolve", intensity: "medium", duration: 4000 },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#20b2aa" },
      ],
      products: ["cucl2", "fecl2"],
      observations: [
        "Mảnh đồng tan dần mà không có bọt khí",
        "Dung dịch chuyển từ màu vàng nâu (Fe³⁺) sang xanh lục nhạt/xanh lam",
        "Ứng dụng thực tế trong công nghiệp sản xuất vi mạch in PCB",
      ],
      heatChange: "exothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 4. ĐỒNG(II) HIDROXIT Cu(OH)₂ VÀ ĐỒNG(II) OXIT CuO
  // ══════════════════════════════════════════════════════════════

  // Cu(OH)₂ + H₂SO₄ → CuSO₄ + 2H₂O (user nhắc tới!)
  if (pair("cuoh2", "h2so4")) {
    return {
      type: "acid_base",
      equation: "Cu(OH)₂ + H₂SO₄ → CuSO₄ + 2H₂O",
      equationHtml: `<span class='text-cyan-400'>Cu(OH)₂</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-chemical-blue'>CuSO₄</span> + 2${WATER_HTML}`,
      description: "Đồng(II) hidroxit tan trong axit sunfuric tạo dung dịch đồng(II) sunfat màu xanh lam trong suốt.",
      effects: [
        { type: "dissolve", intensity: "high", duration: 3000 },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#2563eb" },
      ],
      products: ["cuso4"],
      observations: [
        "Kết tủa màu xanh lam Cu(OH)₂ tan dần",
        "Dung dịch trở nên trong suốt, có màu xanh lam đặc trưng của CuSO₄",
        "Phản ứng trung hòa bazơ không tan với axit mạnh",
      ],
      heatChange: "exothermic",
    };
  }

  // Cu(OH)₂ + HCl → CuCl₂ + 2H₂O
  if (pair("cuoh2", "hcl")) {
    return {
      type: "acid_base",
      equation: "Cu(OH)₂ + 2HCl → CuCl₂ + 2H₂O",
      equationHtml: `<span class='text-cyan-400'>Cu(OH)₂</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-chemical-blue'>CuCl₂</span> + 2${WATER_HTML}`,
      description: "Đồng(II) hidroxit tan trong axit clohidric tạo dung dịch muối CuCl₂ màu xanh lam sáng.",
      effects: [
        { type: "dissolve", intensity: "high", duration: 3000 },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#20b2aa" },
      ],
      products: ["cucl2"],
      observations: [
        "Kết tủa xanh lam tan hoàn toàn",
        "Dung dịch chuyển sang màu xanh lam sáng",
      ],
      heatChange: "exothermic",
    };
  }

  // Cu(OH)₂ + HNO₃ → Cu(NO₃)₂ + 2H₂O
  if (pair("cuoh2", "hno3")) {
    return {
      type: "acid_base",
      equation: "Cu(OH)₂ + 2HNO₃ → Cu(NO₃)₂ + 2H₂O",
      equationHtml: `<span class='text-cyan-400'>Cu(OH)₂</span> + 2<span class='text-chemical-red'>HNO₃</span> → <span class='text-chemical-blue'>Cu(NO₃)₂</span> + 2${WATER_HTML}`,
      description: "Cu(OH)₂ tan trong axit nitric tạo dung dịch xanh lam trong suốt.",
      effects: [
        { type: "dissolve", intensity: "high", duration: 3000 },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#1e88e5" },
      ],
      products: ["cu_no32"],
      observations: ["Kết tủa xanh lam tan tạo dung dịch xanh lam trong suốt"],
      heatChange: "exothermic",
    };
  }

  // Cu(OH)₂ + Glucose → Phức đồng saccarat (xanh lam thẫm)
  if (pair("cuoh2", "glucose")) {
    return {
      type: "complex",
      equation: "2C₆H₁₂O₆ + Cu(OH)₂ → (C₆H₁₁O₆)₂Cu + 2H₂O",
      equationHtml: `2<span class='text-white'>C₆H₁₂O₆</span> + <span class='text-cyan-400'>Cu(OH)₂</span> → <span class='text-blue-600 font-bold'>Phức xanh lam thẫm</span> + 2${WATER_HTML}`,
      description: "Glucose hòa tan kết tủa Cu(OH)₂ ở nhiệt độ thường tạo phức chất màu xanh lam thẫm (tính chất của polyancol có nhiều nhóm OH kề nhau).",
      effects: [
        { type: "dissolve", intensity: "high", duration: 3500 },
        { type: "color_change", intensity: "high", duration: 3500, targetColor: "#0d47a1" },
        { type: "sparkle", intensity: "low", duration: 2000 },
      ],
      products: [],
      observations: [
        "Kết tủa màu xanh lam Cu(OH)₂ tan dần",
        "Dung dịch chuyển sang màu xanh lam thẫm đặc trưng",
        "Phản ứng nhận biết polyancol và carbohydrate trong hóa học lớp 12",
      ],
      heatChange: "none",
    };
  }

  // CuO + Axit (HCl, H₂SO₄, HNO₃)
  if (pair("cuo", "hcl")) {
    return {
      type: "acid_base",
      equation: "CuO + 2HCl → CuCl₂ + H₂O",
      equationHtml: `<span class='text-gray-400'>CuO</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-chemical-blue'>CuCl₂</span> + ${WATER_HTML}`,
      description: "Bột màu đen của CuO tan trong axit clohidric tạo dung dịch màu xanh lam.",
      effects: [
        { type: "dissolve", intensity: "medium", duration: 3500 },
        { type: "color_change", intensity: "high", duration: 3500, targetColor: "#20b2aa" },
      ],
      products: ["cucl2"],
      observations: ["Bột màu đen tan dần", "Dung dịch chuyển sang màu xanh lam"],
      heatChange: "exothermic",
    };
  }
  if (pair("cuo", "h2so4")) {
    return {
      type: "acid_base",
      equation: "CuO + H₂SO₄ → CuSO₄ + H₂O",
      equationHtml: `<span class='text-gray-400'>CuO</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-chemical-blue'>CuSO₄</span> + ${WATER_HTML}`,
      description: "Bột CuO màu đen tan trong axit sunfuric tạo dung dịch CuSO₄ màu xanh lam.",
      effects: [
        { type: "dissolve", intensity: "medium", duration: 3500 },
        { type: "color_change", intensity: "high", duration: 3500, targetColor: "#2563eb" },
      ],
      products: ["cuso4"],
      observations: ["Bột oxit đen tan tạo dung dịch màu xanh lam"],
      heatChange: "exothermic",
    };
  }
  if (pair("cuo", "hno3")) {
    return {
      type: "acid_base",
      equation: "CuO + 2HNO₃ → Cu(NO₃)₂ + H₂O",
      equationHtml: `<span class='text-gray-400'>CuO</span> + 2<span class='text-chemical-red'>HNO₃</span> → <span class='text-chemical-blue'>Cu(NO₃)₂</span> + ${WATER_HTML}`,
      description: "Bột CuO tan trong axit nitric tạo dung dịch Cu(NO₃)₂ màu xanh lam.",
      effects: [
        { type: "dissolve", intensity: "medium", duration: 3500 },
        { type: "color_change", intensity: "high", duration: 3500, targetColor: "#1e88e5" },
      ],
      products: ["cu_no32"],
      observations: ["Bột đen tan tạo dung dịch màu xanh lam"],
      heatChange: "exothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 5. KIM LOẠI TÁC DỤNG VỚI AXIT (Metal + Acid → H₂ / Redox)
  // ══════════════════════════════════════════════════════════════

  // Al + Axit
  if (pair("al", "hcl")) {
    return {
      type: "metal_acid",
      equation: "2Al + 6HCl → 2AlCl₃ + 3H₂↑",
      equationHtml: `2<span class='text-gray-300'>Al</span> + 6<span class='text-chemical-red'>HCl</span> → 2<span class='text-white'>AlCl₃</span> + 3${H2_HTML}`,
      description: "Nhôm tan trong axit clohidric giải phóng khí hiđro",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5000, particleCount: 30 },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["alcl3", "h2"],
      observations: ["Nhôm tan dần", "Sủi bọt khí H₂ mãnh liệt", "Phản ứng tỏa nhiều nhiệt"],
      heatChange: "exothermic",
    };
  }
  if (pair("al", "h2so4")) {
    return {
      type: "metal_acid",
      equation: "2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂↑",
      equationHtml: `2<span class='text-gray-300'>Al</span> + 3<span class='text-chemical-red'>H₂SO₄</span> → <span class='text-white'>Al₂(SO₄)₃</span> + 3${H2_HTML}`,
      description: "Nhôm tan trong axit sunfuric loãng giải phóng khí hiđro",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5000, particleCount: 30 },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["al2so43", "h2"],
      observations: ["Mảnh nhôm tan dần", "Sủi bọt khí H₂", "Ống nghiệm nóng lên"],
      heatChange: "exothermic",
    };
  }
  if (pair("al", "hno3")) {
    return {
      type: "redox",
      equation: "Al + 4HNO₃(loãng) → Al(NO₃)₃ + NO↑ + 2H₂O",
      equationHtml: `<span class='text-gray-300'>Al</span> + 4<span class='text-chemical-red'>HNO₃</span> → <span class='text-white'>Al(NO₃)₃</span> + <span class='text-gray-200'>NO↑</span> + 2${WATER_HTML}`,
      description: "Nhôm tan trong axit nitric loãng giải phóng khí NO không màu hóa nâu ngoài không khí.",
      effects: [
        { type: "bubbles", intensity: "medium", duration: 4500, particleCount: 25 },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["h2"],
      observations: ["Nhôm tan sủi bọt khí", "Khí không màu hóa nâu nhạt tại miệng ống nghiệm"],
      heatChange: "exothermic",
    };
  }

  // Fe + Axit
  if (pair("fe", "hcl")) {
    return {
      type: "metal_acid",
      equation: "Fe + 2HCl → FeCl₂ + H₂↑",
      equationHtml: `<span class='text-gray-400'>Fe</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-chemical-green'>FeCl₂</span> + ${H2_HTML}`,
      description: "Sắt tan trong axit clohidric tạo dung dịch màu xanh lục nhạt",
      effects: [
        { type: "bubbles", intensity: "medium", duration: 5000, particleCount: 20 },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#66bb88" },
      ],
      products: ["fecl2", "h2"],
      observations: ["Sắt tan dần", "Có bọt khí H₂ thoát ra", "Dung dịch chuyển màu xanh lục nhạt"],
      heatChange: "exothermic",
    };
  }
  if (pair("fe", "h2so4")) {
    return {
      type: "metal_acid",
      equation: "Fe + H₂SO₄ → FeSO₄ + H₂↑",
      equationHtml: `<span class='text-gray-400'>Fe</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-chemical-green'>FeSO₄</span> + ${H2_HTML}`,
      description: "Sắt tan trong axit sunfuric loãng tạo dung dịch xanh lục nhạt FeSO₄",
      effects: [
        { type: "bubbles", intensity: "medium", duration: 4500, particleCount: 20 },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#66bb88" },
      ],
      products: ["feso4", "h2"],
      observations: ["Sắt tan dần", "Sủi bọt khí H₂", "Dung dịch có màu xanh lục nhạt"],
      heatChange: "exothermic",
    };
  }
  if (pair("fe", "hno3")) {
    return {
      type: "redox",
      equation: "Fe + 4HNO₃(loãng) → Fe(NO₃)₃ + NO↑ + 2H₂O",
      equationHtml: `<span class='text-gray-400'>Fe</span> + 4<span class='text-chemical-red'>HNO₃</span> → <span class='text-yellow-500'>Fe(NO₃)₃</span> + <span class='text-gray-200'>NO↑</span> + 2${WATER_HTML}`,
      description: "Sắt tan trong axit nitric loãng tạo muối sắt(III) màu vàng nâu và khí NO.",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5000, particleCount: 30 },
        { type: "color_change", intensity: "high", duration: 3500, targetColor: "#d97706" },
      ],
      products: ["no2"],
      observations: ["Sắt tan sủi bọt khí mạnh", "Dung dịch chuyển sang màu vàng nâu của Fe³⁺"],
      heatChange: "exothermic",
    };
  }

  // Zn + Axit
  if (pair("zn", "hcl")) {
    return {
      type: "metal_acid",
      equation: "Zn + 2HCl → ZnCl₂ + H₂↑",
      equationHtml: `<span class='text-gray-300'>Zn</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>ZnCl₂</span> + ${H2_HTML}`,
      description: "Kẽm tác dụng với axit clohidric giải phóng khí hidro",
      effects: [
        { type: "bubbles", intensity: "high", duration: 4500, particleCount: 35 },
        { type: "dissolve", intensity: "medium", duration: 4000 },
      ],
      products: ["zncl2", "h2"],
      observations: ["Sủi bọt khí mãnh liệt", "Mảnh kẽm tan dần", "Ống nghiệm nóng lên"],
      heatChange: "exothermic",
    };
  }
  if (pair("zn", "h2so4")) {
    return {
      type: "metal_acid",
      equation: "Zn + H₂SO₄ → ZnSO₄ + H₂↑",
      equationHtml: `<span class='text-gray-300'>Zn</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-white'>ZnSO₄</span> + ${H2_HTML}`,
      description: "Kẽm tan trong axit sunfuric loãng, giải phóng khí hidro",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5000, particleCount: 30 },
        { type: "color_change", intensity: "medium", duration: 2500, targetColor: "#ffffff" },
      ],
      products: ["znso4", "h2"],
      observations: ["Kẽm tan dần", "Sủi bọt khí H₂", "Dung dịch trong suốt"],
      heatChange: "exothermic",
    };
  }

  // Mg + Axit
  if (pair("mg", "hcl")) {
    return {
      type: "metal_acid",
      equation: "Mg + 2HCl → MgCl₂ + H₂↑",
      equationHtml: `<span class='text-gray-300'>Mg</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>MgCl₂</span> + ${H2_HTML}`,
      description: "Magie tan mãnh liệt trong axit clohidric",
      effects: [
        { type: "bubbles", intensity: "high", duration: 3500, particleCount: 40 },
        { type: "dissolve", intensity: "high", duration: 2500 },
        { type: "flash", intensity: "low", duration: 500 },
      ],
      products: ["mgcl2", "h2"],
      observations: ["Kim loại tan nhanh, tỏa nhiều nhiệt", "Sủi bọt khí dữ dội (H₂)", "Dung dịch trong suốt"],
      heatChange: "exothermic",
    };
  }
  if (pair("mg", "h2so4")) {
    return {
      type: "metal_acid",
      equation: "Mg + H₂SO₄ → MgSO₄ + H₂↑",
      equationHtml: `<span class='text-gray-300'>Mg</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-white'>MgSO₄</span> + ${H2_HTML}`,
      description: "Magie tan rất nhanh trong axit sunfuric loãng",
      effects: [
        { type: "bubbles", intensity: "high", duration: 3500, particleCount: 40 },
        { type: "dissolve", intensity: "high", duration: 2500 },
      ],
      products: ["mgso4", "h2"],
      observations: ["Magie tan nhanh chóng", "Sủi bọt khí H₂ rất mạnh", "Phản ứng tỏa nhiệt"],
      heatChange: "exothermic",
    };
  }

  // Ag + Axit
  if (pair("ag", "hno3")) {
    return {
      type: "redox",
      equation: "Ag + 2HNO₃ → AgNO₃ + NO₂↑ + H₂O",
      equationHtml: `<span class='text-gray-200'>Ag</span> + 2<span class='text-chemical-red'>HNO₃</span> → <span class='text-white'>AgNO₃</span> + ${NO2_HTML} + ${WATER_HTML}`,
      description: "Bạc tan trong axit nitric giải phóng khí NO₂ màu nâu đỏ.",
      effects: [
        { type: "bubbles", intensity: "medium", duration: 4000 },
        { type: "smoke", intensity: "medium", duration: 3500 },
      ],
      products: ["agno3", "no2"],
      observations: ["Bạc tan dần", "Xuất hiện khí màu nâu đỏ NO₂", "Dung dịch trong suốt chứa AgNO₃"],
      heatChange: "exothermic",
    };
  }
  if (pair("ag", "hcl") || pair("ag", "h2so4")) {
    return {
      type: "none",
      equation: "Ag + Axit loãng → Không phản ứng",
      equationHtml: `<span class='text-gray-200'>Ag</span> + <span class='text-chemical-red'>Axit</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Bạc đứng sau hiđro trong dãy điện hóa nên không phản ứng với axit HCl hoặc H₂SO₄ loãng.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#ececec" }],
      products: [],
      observations: ["Mảnh bạc giữ nguyên màu trắng sáng", "Không tan, không có bọt khí"],
      heatChange: "none",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 6. NHÔM TAN TRONG KIỀM (Al + Kiềm)
  // ══════════════════════════════════════════════════════════════

  // 2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑
  if (pair("al", "naoh")) {
    return {
      type: "redox",
      equation: "2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑",
      equationHtml: `2<span class='text-gray-300'>Al</span> + 2<span class='text-chemical-blue'>NaOH</span> + 2${WATER_HTML} → 2<span class='text-white'>NaAlO₂</span> + 3${H2_HTML}`,
      description: "Nhôm tan mãnh liệt trong dung dịch kiềm NaOH giải phóng khí hiđro (phản ứng đặc trưng của nhôm).",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5500, particleCount: 45 },
        { type: "dissolve", intensity: "high", duration: 4500 },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["naalo2", "h2"],
      observations: [
        "Mảnh nhôm tan nhanh trong dung dịch xút",
        "Sủi bọt khí H₂ rất dữ dội",
        "Phản ứng tỏa nhiều nhiệt, ống nghiệm rất nóng",
        "Tạo dung dịch natri aluminat không màu",
      ],
      heatChange: "exothermic",
    };
  }

  // 2Al + 2KOH + 2H₂O → 2KAlO₂ + 3H₂↑
  if (pair("al", "koh")) {
    return {
      type: "redox",
      equation: "2Al + 2KOH + 2H₂O → 2KAlO₂ + 3H₂↑",
      equationHtml: `2<span class='text-gray-300'>Al</span> + 2<span class='text-chemical-blue'>KOH</span> + 2${WATER_HTML} → 2<span class='text-white'>KAlO₂</span> + 3${H2_HTML}`,
      description: "Nhôm tan trong dung dịch kiềm KOH giải phóng khí hiđro.",
      effects: [
        { type: "bubbles", intensity: "high", duration: 5500, particleCount: 45 },
        { type: "dissolve", intensity: "high", duration: 4500 },
      ],
      products: ["kalo2", "h2"],
      observations: ["Nhôm tan dữ dội trong dung dịch KOH", "Sủi bọt khí H₂ mãnh liệt", "Phản ứng tỏa nhiệt"],
      heatChange: "exothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 7. KIM LOẠI ĐẨY MUỐI (PHẢN ỨNG THẾ)
  // ══════════════════════════════════════════════════════════════

  // 2Al + 3CuCl₂ → 2AlCl₃ + 3Cu↓ (user nhắc tới!)
  if (pair("al", "cucl2")) {
    return {
      type: "redox",
      equation: "2Al + 3CuCl₂ → 2AlCl₃ + 3Cu↓",
      equationHtml: `2<span class='text-gray-300'>Al</span> + 3<span class='text-chemical-blue'>CuCl₂</span> → 2<span class='text-white'>AlCl₃</span> + 3<span class='text-chemical-orange'>Cu↓</span>`,
      description: "Nhôm đẩy đồng ra khỏi dung dịch CuCl₂, giải phóng đồng kim loại màu đỏ cam bám trên bề mặt nhôm.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#ffffff" },
        { type: "sparkle", intensity: "medium", duration: 2500 },
      ],
      products: ["alcl3", "cu"],
      observations: [
        "Màu xanh của CuCl₂ nhạt dần rồi trở nên trong suốt",
        "Chất rắn màu đỏ cam (Cu) bám dày đặc trên miếng nhôm",
        "Phản ứng tỏa nhiệt mạnh",
      ],
      heatChange: "exothermic",
    };
  }

  // 2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu↓
  if (pair("al", "cuso4")) {
    return {
      type: "redox",
      equation: "2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu↓",
      equationHtml: `2<span class='text-gray-300'>Al</span> + 3<span class='text-chemical-blue'>CuSO₄</span> → <span class='text-white'>Al₂(SO₄)₃</span> + 3<span class='text-chemical-orange'>Cu↓</span>`,
      description: "Nhôm đẩy đồng ra khỏi dung dịch đồng(II) sunfat.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#ffffff" },
      ],
      products: ["al2so43", "cu"],
      observations: [
        "Dung dịch xanh lam nhạt màu dần",
        "Lớp đồng màu đỏ cam bám quanh thanh nhôm",
      ],
      heatChange: "exothermic",
    };
  }

  // 2AlCl₃ + 3Mg → 2Al + 3MgCl₂ (user nhắc tới!)
  if (pair("alcl3", "mg")) {
    return {
      type: "redox",
      equation: "2AlCl₃ + 3Mg → 2Al↓ + 3MgCl₂",
      equationHtml: `2<span class='text-white'>AlCl₃</span> + 3<span class='text-gray-300'>Mg</span> → 2<span class='text-gray-200'>Al↓</span> + 3<span class='text-white'>MgCl₂</span>`,
      description: "Magie có tính khử mạnh hơn nhôm nên đẩy nhôm ra khỏi muối nhôm clorua.",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#c0c8d0" },
        { type: "sparkle", intensity: "low", duration: 2000 },
      ],
      products: ["mgcl2", "al"],
      observations: [
        "Magie tan dần",
        "Xuất hiện chất rắn màu trắng bạc của nhôm kết tủa",
      ],
      heatChange: "exothermic",
    };
  }

  // Fe + CuSO₄ → FeSO₄ + Cu↓
  if (pair("fe", "cuso4")) {
    return {
      type: "redox",
      equation: "Fe + CuSO₄ → FeSO₄ + Cu↓",
      equationHtml: `<span class='text-gray-400'>Fe</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-chemical-green'>FeSO₄</span> + <span class='text-chemical-orange'>Cu↓</span>`,
      description: "Sắt đẩy đồng ra khỏi dung dịch muối đồng sunfat",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#66bb88" },
      ],
      products: ["feso4", "cu"],
      observations: [
        "Dung dịch xanh lam nhạt dần",
        "Xuất hiện chất rắn màu đỏ cam bám trên đinh sắt (Cu)",
        "Dung dịch chuyển màu xanh lục nhạt (FeSO₄)",
      ],
      heatChange: "exothermic",
    };
  }

  // Fe + CuCl₂ → FeCl₂ + Cu↓
  if (pair("fe", "cucl2")) {
    return {
      type: "redox",
      equation: "Fe + CuCl₂ → FeCl₂ + Cu↓",
      equationHtml: `<span class='text-gray-400'>Fe</span> + <span class='text-chemical-blue'>CuCl₂</span> → <span class='text-chemical-green'>FeCl₂</span> + <span class='text-chemical-orange'>Cu↓</span>`,
      description: "Sắt đẩy đồng ra khỏi dung dịch CuCl₂",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#66bb88" },
      ],
      products: ["fecl2", "cu"],
      observations: ["Màu xanh của CuCl₂ nhạt dần", "Chất rắn màu đỏ cam bám trên sắt"],
      heatChange: "exothermic",
    };
  }

  // Zn + CuSO₄ → ZnSO₄ + Cu↓
  if (pair("zn", "cuso4")) {
    return {
      type: "redox",
      equation: "Zn + CuSO₄ → ZnSO₄ + Cu↓",
      equationHtml: `<span class='text-gray-300'>Zn</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-white'>ZnSO₄</span> + <span class='text-chemical-orange'>Cu↓</span>`,
      description: "Kẽm đẩy đồng ra khỏi dung dịch muối đồng sunfat",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#ffffff" },
      ],
      products: ["znso4", "cu"],
      observations: ["Dung dịch xanh lam nhạt dần", "Xuất hiện chất rắn màu đỏ cam (Cu)", "Dung dịch trở nên trong suốt"],
      heatChange: "exothermic",
    };
  }

  // Zn + CuCl₂ → ZnCl₂ + Cu↓
  if (pair("zn", "cucl2")) {
    return {
      type: "redox",
      equation: "Zn + CuCl₂ → ZnCl₂ + Cu↓",
      equationHtml: `<span class='text-gray-300'>Zn</span> + <span class='text-chemical-blue'>CuCl₂</span> → <span class='text-white'>ZnCl₂</span> + <span class='text-chemical-orange'>Cu↓</span>`,
      description: "Kẽm đẩy đồng ra khỏi dung dịch CuCl₂",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#ffffff" },
      ],
      products: ["zncl2", "cu"],
      observations: ["Dung dịch mất màu xanh", "Đồng bám trên mảnh kẽm"],
      heatChange: "exothermic",
    };
  }

  // Mg + CuCl₂ / CuSO₄
  if (pair("mg", "cucl2")) {
    return {
      type: "redox",
      equation: "Mg + CuCl₂ → MgCl₂ + Cu↓",
      equationHtml: `<span class='text-gray-300'>Mg</span> + <span class='text-chemical-blue'>CuCl₂</span> → <span class='text-white'>MgCl₂</span> + <span class='text-chemical-orange'>Cu↓</span>`,
      description: "Magie đẩy đồng ra khỏi dung dịch CuCl₂",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#ffffff" },
      ],
      products: ["mgcl2", "cu"],
      observations: ["Dải magie phủ lớp đồng đỏ cam", "Dung dịch xanh chuyển sang trong suốt"],
      heatChange: "exothermic",
    };
  }
  if (pair("mg", "cuso4")) {
    return {
      type: "redox",
      equation: "Mg + CuSO₄ → MgSO₄ + Cu↓",
      equationHtml: `<span class='text-gray-300'>Mg</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-white'>MgSO₄</span> + <span class='text-chemical-orange'>Cu↓</span>`,
      description: "Magie đẩy đồng ra khỏi dung dịch CuSO₄",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#cc8833" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#ffffff" },
      ],
      products: ["mgso4", "cu"],
      observations: ["Đồng đỏ bám trên dải magie", "Dung dịch mất màu xanh"],
      heatChange: "exothermic",
    };
  }

  // Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag↓
  if (pair("cu", "agno3")) {
    return {
      type: "redox",
      equation: "Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag↓",
      equationHtml: `<span class='text-chemical-orange'>Cu</span> + 2<span class='text-white'>AgNO₃</span> → <span class='text-chemical-blue'>Cu(NO₃)₂</span> + 2<span class='text-gray-200'>Ag↓</span>`,
      description: "Đồng đẩy bạc ra khỏi dung dịch bạc nitrat",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#d0d0d8" },
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#4488ff" },
        { type: "sparkle", intensity: "low", duration: 1500 },
      ],
      products: ["cu_no32", "ag"],
      observations: [
        "Dung dịch không màu chuyển dần sang màu xanh lam (Cu(NO₃)₂)",
        "Xuất hiện chất rắn màu trắng xám (Ag) bám trên sợi đồng lấp lánh",
        "Phản ứng đặc trưng của dãy hoạt động kim loại",
      ],
      heatChange: "exothermic",
    };
  }

  // Fe + 2AgNO₃ → Fe(NO₃)₂ + 2Ag↓
  if (pair("fe", "agno3")) {
    return {
      type: "redox",
      equation: "Fe + 2AgNO₃ → Fe(NO₃)₂ + 2Ag↓",
      equationHtml: `<span class='text-gray-400'>Fe</span> + 2<span class='text-white'>AgNO₃</span> → <span class='text-chemical-green'>Fe(NO₃)₂</span> + 2<span class='text-gray-200'>Ag↓</span>`,
      description: "Sắt đẩy bạc ra khỏi dung dịch AgNO₃",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3500, targetColor: "#d0d0d8" },
        { type: "color_change", intensity: "low", duration: 2500, targetColor: "#66bb88" },
      ],
      products: ["ag"],
      observations: ["Tinh thể bạc màu trắng xám bám trên đinh sắt"],
      heatChange: "exothermic",
    };
  }

  // Al + 3AgNO₃ → Al(NO₃)₃ + 3Ag↓
  if (pair("al", "agno3")) {
    return {
      type: "redox",
      equation: "Al + 3AgNO₃ → Al(NO₃)₃ + 3Ag↓",
      equationHtml: `<span class='text-gray-300'>Al</span> + 3<span class='text-white'>AgNO₃</span> → <span class='text-white'>Al(NO₃)₃</span> + 3<span class='text-gray-200'>Ag↓</span>`,
      description: "Nhôm đẩy bạc ra khỏi dung dịch bạc nitrat",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#d0d0d8" },
        { type: "sparkle", intensity: "medium", duration: 2000 },
      ],
      products: ["ag"],
      observations: ["Bạc kim loại kết tủa bám trên bề mặt nhôm"],
      heatChange: "exothermic",
    };
  }

  // Fe + 2FeCl₃ → 3FeCl₂
  if (pair("fe", "fecl3")) {
    return {
      type: "redox",
      equation: "Fe + 2FeCl₃ → 3FeCl₂",
      equationHtml: `<span class='text-gray-400'>Fe</span> + 2<span class='text-chemical-orange'>FeCl₃</span> → 3<span class='text-chemical-green'>FeCl₂</span>`,
      description: "Sắt kim loại bị oxi hóa bởi ion Fe³⁺ tạo muối Fe²⁺ màu xanh lục nhạt.",
      effects: [
        { type: "dissolve", intensity: "medium", duration: 4000 },
        { type: "color_change", intensity: "high", duration: 3500, targetColor: "#66bb88" },
      ],
      products: ["fecl2"],
      observations: ["Đinh sắt tan dần", "Dung dịch từ màu vàng nâu chuyển sang xanh lục nhạt"],
      heatChange: "exothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 8. TẠO KẾT TỦA (PRECIPITATION) & BAZƠ + MUỐI
  // ══════════════════════════════════════════════════════════════

  // 2KOH + CuSO₄ → Cu(OH)₂↓ + K₂SO₄ (user nhắc tới!)
  if (pair("koh", "cuso4")) {
    return {
      type: "precipitation",
      equation: "2KOH + CuSO₄ → Cu(OH)₂↓ + K₂SO₄",
      equationHtml: `2<span class='text-chemical-blue'>KOH</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-cyan-300'>Cu(OH)₂↓</span> + <span class='text-white'>K₂SO₄</span>`,
      description: "Kali hidroxit tác dụng với đồng(II) sunfat tạo kết tủa đồng(II) hidroxit màu xanh lam.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#3388ff" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#3388ff" },
      ],
      products: ["cuoh2", "k2so4"],
      observations: [
        "Xuất hiện kết tủa dạng bông màu xanh lam (Cu(OH)₂)",
        "Dung dịch nhạt màu dần",
      ],
      heatChange: "none",
    };
  }

  // 2NaOH + CuSO₄ → Cu(OH)₂↓ + Na₂SO₄
  if (pair("naoh", "cuso4")) {
    return {
      type: "precipitation",
      equation: "2NaOH + CuSO₄ → Cu(OH)₂↓ + Na₂SO₄",
      equationHtml: `2<span class='text-white'>NaOH</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-cyan-300'>Cu(OH)₂↓</span> + <span class='text-white'>Na₂SO₄</span>`,
      description: "Tạo kết tủa đồng(II) hidroxit màu xanh lam",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#3388ff" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#3388ff" },
      ],
      products: ["cuoh2", "na2so4"],
      observations: [
        "Xuất hiện kết tủa màu xanh lam (Cu(OH)₂)",
        "Dung dịch nhạt màu dần",
      ],
      heatChange: "none",
    };
  }

  // Ba(OH)₂ + CuSO₄ → Cu(OH)₂↓ + BaSO₄↓ (đồng thời 2 kết tủa)
  if (pair("baoh2", "cuso4")) {
    return {
      type: "precipitation",
      equation: "Ba(OH)₂ + CuSO₄ → Cu(OH)₂↓ + BaSO₄↓",
      equationHtml: `<span class='text-white'>Ba(OH)₂</span> + <span class='text-chemical-blue'>CuSO₄</span> → <span class='text-cyan-300'>Cu(OH)₂↓</span> + <span class='text-gray-100'>BaSO₄↓</span>`,
      description: "Phản ứng sinh ra đồng thời 2 kết tủa: Cu(OH)₂ màu xanh lam và BaSO₄ màu trắng.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4500, targetColor: "#66aaff" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#66aaff" },
      ],
      products: ["cuoh2", "baso4"],
      observations: [
        "Xuất hiện hỗn hợp 2 kết tủa: kết tủa xanh lam Cu(OH)₂ và kết tủa trắng mịn BaSO₄",
        "Dung dịch mất màu xanh hoàn toàn",
      ],
      heatChange: "none",
    };
  }

  // CuCl₂ + Kiềm (NaOH, KOH)
  if (pair("cucl2", "naoh")) {
    return {
      type: "precipitation",
      equation: "CuCl₂ + 2NaOH → Cu(OH)₂↓ + 2NaCl",
      equationHtml: `<span class='text-chemical-blue'>CuCl₂</span> + 2<span class='text-white'>NaOH</span> → <span class='text-cyan-300'>Cu(OH)₂↓</span> + 2<span class='text-white'>NaCl</span>`,
      description: "Tạo kết tủa đồng(II) hidroxit màu xanh lam",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#3388ff" },
        { type: "color_change", intensity: "high", duration: 2500, targetColor: "#3388ff" },
      ],
      products: ["cuoh2", "nacl"],
      observations: ["Xuất hiện kết tủa xanh lam", "Dung dịch mất màu xanh"],
      heatChange: "none",
    };
  }
  if (pair("cucl2", "koh")) {
    return {
      type: "precipitation",
      equation: "CuCl₂ + 2KOH → Cu(OH)₂↓ + 2KCl",
      equationHtml: `<span class='text-chemical-blue'>CuCl₂</span> + 2<span class='text-chemical-blue'>KOH</span> → <span class='text-cyan-300'>Cu(OH)₂↓</span> + 2<span class='text-white'>KCl</span>`,
      description: "Tạo kết tủa đồng(II) hidroxit màu xanh lam",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#3388ff" },
        { type: "color_change", intensity: "high", duration: 2500, targetColor: "#3388ff" },
      ],
      products: ["cuoh2", "kcl"],
      observations: ["Xuất hiện kết tủa xanh lam"],
      heatChange: "none",
    };
  }

  // CuCl₂ + 2AgNO₃ → Cu(NO₃)₂ + 2AgCl↓
  if (pair("cucl2", "agno3")) {
    return {
      type: "precipitation",
      equation: "CuCl₂ + 2AgNO₃ → Cu(NO₃)₂ + 2AgCl↓",
      equationHtml: `<span class='text-chemical-blue'>CuCl₂</span> + 2<span class='text-white'>AgNO₃</span> → <span class='text-chemical-blue'>Cu(NO₃)₂</span> + 2<span class='text-gray-200'>AgCl↓</span>`,
      description: "Tạo kết tủa trắng AgCl trong dung dịch xanh lam",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#f0f0f0" },
      ],
      products: ["agcl", "cu_no32"],
      observations: ["Xuất hiện kết tủa trắng vón cục AgCl", "Dung dịch vẫn có màu xanh lam của ion Cu²⁺"],
      heatChange: "none",
    };
  }

  // FeCl₃ + NaOH / KOH → Fe(OH)₃↓ (nâu đỏ)
  if (pair("fecl3", "naoh")) {
    return {
      type: "precipitation",
      equation: "FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl",
      equationHtml: `<span class='text-chemical-orange'>FeCl₃</span> + 3<span class='text-white'>NaOH</span> → <span class='text-chemical-red'>Fe(OH)₃↓</span> + 3<span class='text-white'>NaCl</span>`,
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
  if (pair("fecl3", "koh")) {
    return {
      type: "precipitation",
      equation: "FeCl₃ + 3KOH → Fe(OH)₃↓ + 3KCl",
      equationHtml: `<span class='text-chemical-orange'>FeCl₃</span> + 3<span class='text-chemical-blue'>KOH</span> → <span class='text-chemical-red'>Fe(OH)₃↓</span> + 3<span class='text-white'>KCl</span>`,
      description: "Tạo kết tủa sắt(III) hidroxit màu nâu đỏ",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#cc4400" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#cc4400" },
      ],
      products: ["feoh3", "kcl"],
      observations: ["Xuất hiện kết tủa dạng bông màu nâu đỏ Fe(OH)₃"],
      heatChange: "none",
    };
  }

  // FeCl₂ / FeSO₄ + Kiềm → Fe(OH)₂↓ (trắng xanh)
  if (pair("fecl2", "naoh")) {
    return {
      type: "precipitation",
      equation: "FeCl₂ + 2NaOH → Fe(OH)₂↓ + 2NaCl",
      equationHtml: `<span class='text-chemical-green'>FeCl₂</span> + 2<span class='text-white'>NaOH</span> → <span class='text-emerald-300'>Fe(OH)₂↓</span> + 2<span class='text-white'>NaCl</span>`,
      description: "Tạo kết tủa sắt(II) hidroxit màu trắng xanh, để lâu ngoài không khí bị oxi hóa thành Fe(OH)₃ màu nâu đỏ.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#88ccaa" },
        { type: "color_change", intensity: "medium", duration: 3000, targetColor: "#88ccaa" },
      ],
      products: ["feoh2", "nacl"],
      observations: [
        "Xuất hiện kết tủa màu trắng xanh",
        "Để ngoài không khí kết tủa sẽ chuyển dần sang màu nâu đỏ do bị oxi hóa",
      ],
      heatChange: "none",
    };
  }
  if (pair("feso4", "naoh")) {
    return {
      type: "precipitation",
      equation: "FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄",
      equationHtml: `<span class='text-chemical-green'>FeSO₄</span> + 2<span class='text-white'>NaOH</span> → <span class='text-emerald-300'>Fe(OH)₂↓</span> + <span class='text-white'>Na₂SO₄</span>`,
      description: "Tạo kết tủa sắt(II) hidroxit màu trắng xanh",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#88ccaa" },
        { type: "color_change", intensity: "medium", duration: 3000, targetColor: "#88ccaa" },
      ],
      products: ["feoh2", "na2so4"],
      observations: ["Xuất hiện kết tủa màu trắng xanh Fe(OH)₂"],
      heatChange: "none",
    };
  }
  if (pair("feso4", "koh")) {
    return {
      type: "precipitation",
      equation: "FeSO₄ + 2KOH → Fe(OH)₂↓ + K₂SO₄",
      equationHtml: `<span class='text-chemical-green'>FeSO₄</span> + 2<span class='text-chemical-blue'>KOH</span> → <span class='text-emerald-300'>Fe(OH)₂↓</span> + <span class='text-white'>K₂SO₄</span>`,
      description: "Tạo kết tủa sắt(II) hidroxit màu trắng xanh",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#88ccaa" },
      ],
      products: ["feoh2", "k2so4"],
      observations: ["Xuất hiện kết tủa màu trắng xanh Fe(OH)₂"],
      heatChange: "none",
    };
  }

  // AlCl₃ + Kiềm → Al(OH)₃↓ (keo trắng)
  if (pair("alcl3", "naoh")) {
    return {
      type: "precipitation",
      equation: "AlCl₃ + 3NaOH → Al(OH)₃↓ + 3NaCl",
      equationHtml: `<span class='text-white'>AlCl₃</span> + 3<span class='text-white'>NaOH</span> → <span class='text-gray-100'>Al(OH)₃↓</span> + 3<span class='text-white'>NaCl</span>`,
      description: "Tạo kết tủa nhôm hidroxit dạng keo trắng (kết tủa lưỡng tính tan khi dư kiềm)",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#f0f4f8" },
      ],
      products: ["aloh3", "nacl"],
      observations: ["Xuất hiện kết tủa keo trắng Al(OH)₃", "Kết tủa sẽ tan nếu tiếp tục thêm dư dung dịch kiềm mạnh NaOH"],
      heatChange: "none",
    };
  }
  if (pair("alcl3", "koh")) {
    return {
      type: "precipitation",
      equation: "AlCl₃ + 3KOH → Al(OH)₃↓ + 3KCl",
      equationHtml: `<span class='text-white'>AlCl₃</span> + 3<span class='text-chemical-blue'>KOH</span> → <span class='text-gray-100'>Al(OH)₃↓</span> + 3<span class='text-white'>KCl</span>`,
      description: "Tạo kết tủa keo trắng Al(OH)₃",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#f0f4f8" },
      ],
      products: ["aloh3", "kcl"],
      observations: ["Xuất hiện kết tủa keo trắng Al(OH)₃"],
      heatChange: "none",
    };
  }

  // AlCl₃ + 3AgNO₃ → 3AgCl↓ + Al(NO₃)₃ (user nhắc tới!)
  if (pair("alcl3", "agno3")) {
    return {
      type: "precipitation",
      equation: "AlCl₃ + 3AgNO₃ → 3AgCl↓ + Al(NO₃)₃",
      equationHtml: `<span class='text-white'>AlCl₃</span> + 3<span class='text-white'>AgNO₃</span> → 3<span class='text-gray-200'>AgCl↓</span> + <span class='text-white'>Al(NO₃)₃</span>`,
      description: "Bạc nitrat tác dụng với nhôm clorua tạo kết tủa trắng bạc clorua AgCl.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#f0f0f0" },
        { type: "flash", intensity: "low", duration: 1000 },
      ],
      products: ["agcl"],
      observations: ["Xuất hiện kết tủa trắng vón cục (AgCl)", "Nhận biết ion clorua Cl⁻"],
      heatChange: "none",
    };
  }

  // 3AgNO₃ + FeCl₃ → 3AgCl↓ + Fe(NO₃)₃
  if (pair("fecl3", "agno3")) {
    return {
      type: "precipitation",
      equation: "FeCl₃ + 3AgNO₃ → 3AgCl↓ + Fe(NO₃)₃",
      equationHtml: `<span class='text-chemical-orange'>FeCl₃</span> + 3<span class='text-white'>AgNO₃</span> → 3<span class='text-gray-200'>AgCl↓</span> + <span class='text-yellow-500'>Fe(NO₃)₃</span>`,
      description: "Tạo kết tủa trắng AgCl trong dung dịch muối sắt(III)",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#f0f0f0" },
      ],
      products: ["agcl"],
      observations: ["Xuất hiện kết tủa trắng vón cục AgCl"],
      heatChange: "none",
    };
  }

  // AgNO₃ + NaCl → AgCl↓ + NaNO₃
  if (pair("agno3", "nacl")) {
    return {
      type: "precipitation",
      equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
      equationHtml: `<span class='text-white'>AgNO₃</span> + <span class='text-white'>NaCl</span> → <span class='text-gray-200'>AgCl↓</span> + <span class='text-white'>NaNO₃</span>`,
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

  // AgNO₃ + HCl → AgCl↓ + HNO₃
  if (pair("agno3", "hcl")) {
    return {
      type: "precipitation",
      equation: "AgNO₃ + HCl → AgCl↓ + HNO₃",
      equationHtml: `<span class='text-white'>AgNO₃</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-gray-200'>AgCl↓</span> + <span class='text-white'>HNO₃</span>`,
      description: "Bạc nitrat tác dụng với axit clohidric tạo kết tủa trắng AgCl",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#dddddd" },
        { type: "flash", intensity: "low", duration: 1000 },
      ],
      products: ["agcl"],
      observations: ["Xuất hiện kết tủa trắng vón cục (AgCl)", "Nhận biết ion clorua trong dung dịch"],
      heatChange: "none",
    };
  }

  // AgNO₃ + KI → AgI↓ + KNO₃ (kết tủa vàng đậm)
  if (pair("agno3", "ki")) {
    return {
      type: "precipitation",
      equation: "AgNO₃ + KI → AgI↓ + KNO₃",
      equationHtml: `<span class='text-white'>AgNO₃</span> + <span class='text-white'>KI</span> → <span class='text-yellow-400 font-semibold'>AgI↓</span> + <span class='text-white'>KNO₃</span>`,
      description: "Tạo kết tủa bạc iodua màu vàng đậm, không tan trong axit và amoniac.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#ffee55" },
        { type: "color_change", intensity: "high", duration: 2500, targetColor: "#ffee55" },
      ],
      products: ["agi", "kno3"],
      observations: ["Xuất hiện kết tủa màu vàng đậm AgI", "Dùng để nhận biết ion iodua I⁻"],
      heatChange: "none",
    };
  }

  // 2AgNO₃ + 2NaOH / 2KOH → Ag₂O↓ + 2NaNO₃ + H₂O (kết tủa nâu đen)
  if (pair("agno3", "naoh")) {
    return {
      type: "precipitation",
      equation: "2AgNO₃ + 2NaOH → Ag₂O↓ + 2NaNO₃ + H₂O",
      equationHtml: `2<span class='text-white'>AgNO₃</span> + 2<span class='text-white'>NaOH</span> → <span class='text-amber-900 font-bold'>Ag₂O↓</span> + 2<span class='text-white'>NaNO₃</span> + ${WATER_HTML}`,
      description: "Bạc hidroxit AgOH không bền, tự phân hủy ngay tạo kết tủa bạc oxit Ag₂O màu nâu đen.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#4a3c31" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#4a3c31" },
      ],
      products: ["ag2o", "nano3"],
      observations: ["Xuất hiện kết tủa màu nâu đen Ag₂O ngay lập tức", "AgOH sinh ra không bền bị phân hủy"],
      heatChange: "none",
    };
  }
  if (pair("agno3", "koh")) {
    return {
      type: "precipitation",
      equation: "2AgNO₃ + 2KOH → Ag₂O↓ + 2KNO₃ + H₂O",
      equationHtml: `2<span class='text-white'>AgNO₃</span> + 2<span class='text-chemical-blue'>KOH</span> → <span class='text-amber-900 font-bold'>Ag₂O↓</span> + 2<span class='text-white'>KNO₃</span> + ${WATER_HTML}`,
      description: "Tạo kết tủa bạc oxit Ag₂O màu nâu đen.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#4a3c31" },
      ],
      products: ["ag2o", "kno3"],
      observations: ["Xuất hiện kết tủa nâu đen Ag₂O"],
      heatChange: "none",
    };
  }

  // BaCl₂ / Ba(NO₃)₂ + Na₂SO₄ / H₂SO₄ → BaSO₄↓ (kết tủa trắng mịn)
  if (pair("bacl2", "na2so4")) {
    return {
      type: "precipitation",
      equation: "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl",
      equationHtml: `<span class='text-white'>BaCl₂</span> + <span class='text-white'>Na₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-white'>NaCl</span>`,
      description: "Tạo kết tủa bari sunfat màu trắng (nhận biết ion sunfat)",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baso4", "nacl"],
      observations: ["Xuất hiện kết tủa trắng mịn (BaSO₄)", "Kết tủa không tan trong axit", "Nhận biết ion sunfat (SO₄²⁻)"],
      heatChange: "none",
    };
  }
  if (pair("bacl2", "h2so4")) {
    return {
      type: "precipitation",
      equation: "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl",
      equationHtml: `<span class='text-white'>BaCl₂</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-chemical-red'>HCl</span>`,
      description: "Bari clorua tác dụng với axit sunfuric tạo kết tủa trắng BaSO₄",
      effects: [
        { type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" },
      ],
      products: ["baso4"],
      observations: ["Xuất hiện kết tủa trắng mịn (BaSO₄)", "Kết tủa không tan trong axit"],
      heatChange: "none",
    };
  }
  if (pair("ba_no32", "na2so4")) {
    return {
      type: "precipitation",
      equation: "Ba(NO₃)₂ + Na₂SO₄ → BaSO₄↓ + 2NaNO₃",
      equationHtml: `<span class='text-white'>Ba(NO₃)₂</span> + <span class='text-white'>Na₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-white'>NaNO₃</span>`,
      description: "Tạo kết tủa bari sunfat màu trắng",
      effects: [{ type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" }],
      products: ["baso4", "nano3"],
      observations: ["Xuất hiện kết tủa trắng mịn BaSO₄"],
      heatChange: "none",
    };
  }
  if (pair("ba_no32", "h2so4")) {
    return {
      type: "precipitation",
      equation: "Ba(NO₃)₂ + H₂SO₄ → BaSO₄↓ + 2HNO₃",
      equationHtml: `<span class='text-white'>Ba(NO₃)₂</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-white'>HNO₃</span>`,
      description: "Tạo kết tủa bari sunfat màu trắng",
      effects: [{ type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" }],
      products: ["baso4"],
      observations: ["Xuất hiện kết tủa trắng mịn BaSO₄"],
      heatChange: "none",
    };
  }
  if (pair("baoh2", "na2so4")) {
    return {
      type: "precipitation",
      equation: "Ba(OH)₂ + Na₂SO₄ → BaSO₄↓ + 2NaOH",
      equationHtml: `<span class='text-white'>Ba(OH)₂</span> + <span class='text-white'>Na₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2<span class='text-chemical-blue'>NaOH</span>`,
      description: "Tạo kết tủa bari sunfat màu trắng",
      effects: [{ type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" }],
      products: ["baso4", "naoh"],
      observations: ["Xuất hiện kết tủa trắng BaSO₄"],
      heatChange: "none",
    };
  }
  if (pair("baoh2", "h2so4")) {
    return {
      type: "precipitation",
      equation: "Ba(OH)₂ + H₂SO₄ → BaSO₄↓ + 2H₂O",
      equationHtml: `<span class='text-white'>Ba(OH)₂</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-gray-100'>BaSO₄↓</span> + 2${WATER_HTML}`,
      description: "Phản ứng vừa trung hòa axit-bazơ vừa tạo kết tủa trắng bari sunfat.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 3500, targetColor: "#eeeeee" },
        { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["baso4"],
      observations: ["Xuất hiện kết tủa trắng mịn BaSO₄", "Độ dẫn điện của dung dịch giảm mạnh về 0 khi phản ứng vừa đủ", "Phản ứng tỏa nhiệt"],
      heatChange: "exothermic",
    };
  }

  // BaCl₂ / Ba(OH)₂ + Na₂CO₃ → BaCO₃↓ + ...
  if (pair("bacl2", "na2co3")) {
    return {
      type: "precipitation",
      equation: "BaCl₂ + Na₂CO₃ → BaCO₃↓ + 2NaCl",
      equationHtml: `<span class='text-white'>BaCl₂</span> + <span class='text-white'>Na₂CO₃</span> → <span class='text-gray-100'>BaCO₃↓</span> + 2<span class='text-white'>NaCl</span>`,
      description: "Tạo kết tủa bari cacbonat màu trắng (tan trong axit giải phóng CO₂)",
      effects: [{ type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" }],
      products: ["baco3", "nacl"],
      observations: ["Xuất hiện kết tủa trắng BaCO₃", "Kết tủa tan trong axit mạnh tạo CO₂"],
      heatChange: "none",
    };
  }
  if (pair("baoh2", "na2co3")) {
    return {
      type: "precipitation",
      equation: "Ba(OH)₂ + Na₂CO₃ → BaCO₃↓ + 2NaOH",
      equationHtml: `<span class='text-white'>Ba(OH)₂</span> + <span class='text-white'>Na₂CO₃</span> → <span class='text-gray-100'>BaCO₃↓</span> + 2<span class='text-chemical-blue'>NaOH</span>`,
      description: "Tạo kết tủa bari cacbonat màu trắng",
      effects: [{ type: "precipitate", intensity: "medium", duration: 3000, targetColor: "#eeeeee" }],
      products: ["baco3", "naoh"],
      observations: ["Xuất hiện kết tủa trắng BaCO₃"],
      heatChange: "none",
    };
  }

  // Pb(NO₃)₂ + KI → PbI₂↓ (kết tủa vàng tươi)
  if (pair("pbno32", "ki")) {
    return {
      type: "precipitation",
      equation: "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃",
      equationHtml: `<span class='text-white'>Pb(NO₃)₂</span> + 2<span class='text-white'>KI</span> → <span class='text-chemical-yellow'>PbI₂↓</span> + 2<span class='text-white'>KNO₃</span>`,
      description: "Tạo kết tủa chì(II) iodua màu vàng tươi lấp lánh (mưa vàng)",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4000, targetColor: "#ffdd33" },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#ffdd33" },
        { type: "sparkle", intensity: "low", duration: 2000 },
      ],
      products: ["pbi2", "kno3"],
      observations: ["Xuất hiện kết tủa màu vàng tươi PbI₂", "Kết tủa lấp lánh dưới ánh sáng", "Thí nghiệm 'mưa vàng' kinh điển"],
      heatChange: "none",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 9. LƯỠNG TÍNH: Al(OH)₃ & Al₂O₃ VỚI AXIT VÀ BAZƠ
  // ══════════════════════════════════════════════════════════════

  // Al(OH)₃ + NaOH → NaAlO₂ + 2H₂O (user nhắc tới!)
  if (pair("aloh3", "naoh")) {
    return {
      type: "acid_base",
      equation: "Al(OH)₃ + NaOH → NaAlO₂ + 2H₂O",
      equationHtml: `<span class='text-gray-100'>Al(OH)₃</span> + <span class='text-chemical-blue'>NaOH</span> → <span class='text-white'>NaAlO₂</span> + 2${WATER_HTML}`,
      description: "Nhôm hidroxit lưỡng tính tan trong dung dịch kiềm mạnh NaOH tạo natri aluminat trong suốt.",
      effects: [
        { type: "dissolve", intensity: "high", duration: 3500 },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["naalo2"],
      observations: [
        "Kết tủa keo trắng Al(OH)₃ tan dần",
        "Dung dịch trở nên trong suốt",
        "Chứng minh tính lưỡng tính của nhôm hidroxit",
      ],
      heatChange: "exothermic",
    };
  }

  // Al(OH)₃ + KOH → KAlO₂ + 2H₂O
  if (pair("aloh3", "koh")) {
    return {
      type: "acid_base",
      equation: "Al(OH)₃ + KOH → KAlO₂ + 2H₂O",
      equationHtml: `<span class='text-gray-100'>Al(OH)₃</span> + <span class='text-chemical-blue'>KOH</span> → <span class='text-white'>KAlO₂</span> + 2${WATER_HTML}`,
      description: "Al(OH)₃ tan trong dung dịch KOH",
      effects: [
        { type: "dissolve", intensity: "high", duration: 3500 },
      ],
      products: ["kalo2"],
      observations: ["Kết tủa keo trắng tan hoàn toàn trong KOH"],
      heatChange: "exothermic",
    };
  }

  // Al(OH)₃ + Axit (HCl, H₂SO₄, HNO₃)
  if (pair("aloh3", "hcl")) {
    return {
      type: "acid_base",
      equation: "Al(OH)₃ + 3HCl → AlCl₃ + 3H₂O",
      equationHtml: `<span class='text-gray-100'>Al(OH)₃</span> + 3<span class='text-chemical-red'>HCl</span> → <span class='text-white'>AlCl₃</span> + 3${WATER_HTML}`,
      description: "Al(OH)₃ tan trong axit clohidric tạo muối nhôm clorua.",
      effects: [
        { type: "dissolve", intensity: "high", duration: 3000 },
      ],
      products: ["alcl3"],
      observations: ["Kết tủa keo trắng tan nhanh tạo dung dịch trong suốt"],
      heatChange: "exothermic",
    };
  }

  // Al₂O₃ + 2NaOH → 2NaAlO₂ + H₂O (user nhắc tới!)
  if (pair("al2o3", "naoh")) {
    return {
      type: "acid_base",
      equation: "Al₂O₃ + 2NaOH → 2NaAlO₂ + H₂O",
      equationHtml: `<span class='text-gray-300'>Al₂O₃</span> + 2<span class='text-chemical-blue'>NaOH</span> → 2<span class='text-white'>NaAlO₂</span> + ${WATER_HTML}`,
      description: "Nhôm oxit lưỡng tính tan trong dung dịch kiềm mạnh NaOH tạo natri aluminat.",
      effects: [
        { type: "dissolve", intensity: "medium", duration: 3500 },
      ],
      products: ["naalo2"],
      observations: ["Bột màu trắng tan trong dung dịch xút", "Dung dịch trong suốt"],
      heatChange: "exothermic",
    };
  }
  if (pair("al2o3", "koh")) {
    return {
      type: "acid_base",
      equation: "Al₂O₃ + 2KOH → 2KAlO₂ + H₂O",
      equationHtml: `<span class='text-gray-300'>Al₂O₃</span> + 2<span class='text-chemical-blue'>KOH</span> → 2<span class='text-white'>KAlO₂</span> + ${WATER_HTML}`,
      description: "Nhôm oxit tan trong dung dịch kiềm KOH.",
      effects: [{ type: "dissolve", intensity: "medium", duration: 3500 }],
      products: ["kalo2"],
      observations: ["Bột oxit nhôm tan trong dung dịch kiềm"],
      heatChange: "exothermic",
    };
  }
  if (pair("al2o3", "hcl")) {
    return {
      type: "acid_base",
      equation: "Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O",
      equationHtml: `<span class='text-gray-300'>Al₂O₃</span> + 6<span class='text-chemical-red'>HCl</span> → 2<span class='text-white'>AlCl₃</span> + 3${WATER_HTML}`,
      description: "Nhôm oxit tan trong axit clohidric",
      effects: [{ type: "dissolve", intensity: "medium", duration: 3500 }],
      products: ["alcl3"],
      observations: ["Bột trắng tan trong dung dịch axit"],
      heatChange: "exothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 10. TRUNG HÒA AXIT - BAZƠ CHUNG
  // ══════════════════════════════════════════════════════════════

  if (
    (chemical1.category === "acid" && chemical2.category === "base") ||
    (chemical1.category === "base" && chemical2.category === "acid")
  ) {
    const acid = chemical1.category === "acid" ? chemical1 : chemical2;
    const base = chemical1.category === "base" ? chemical1 : chemical2;

    // HCl + NaOH → NaCl + H₂O
    if (pair(acid.id, base.id) && ((acid.id === "hcl" && base.id === "naoh") || (acid.id === "naoh" && base.id === "hcl"))) {
      return {
        type: "acid_base",
        equation: "NaOH + HCl → NaCl + H₂O",
        equationHtml: `<span class='text-chemical-blue'>NaOH</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-white'>NaCl</span> + ${WATER_HTML}`,
        description: "Phản ứng trung hòa tạo muối và nước",
        effects: [
          { type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" },
          { type: "bubbles", intensity: "low", duration: 2000 },
        ],
        products: ["nacl"],
        observations: ["Dung dịch trở nên trong suốt", "Phản ứng tỏa nhiệt nhẹ"],
        heatChange: "exothermic",
      };
    }

    // HCl + KOH → KCl + H₂O
    if (pair(acid.id, base.id) && ((acid.id === "hcl" && base.id === "koh") || (acid.id === "koh" && base.id === "hcl"))) {
      return {
        type: "acid_base",
        equation: "KOH + HCl → KCl + H₂O",
        equationHtml: `<span class='text-chemical-blue'>KOH</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-white'>KCl</span> + ${WATER_HTML}`,
        description: "Phản ứng trung hòa kiềm kali và axit clohidric",
        effects: [{ type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" }],
        products: ["kcl"],
        observations: ["Dung dịch trong suốt", "Phản ứng tỏa nhiệt"],
        heatChange: "exothermic",
      };
    }

    // H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O
    if (pair(acid.id, base.id) && ((acid.id === "h2so4" && base.id === "koh") || (acid.id === "koh" && base.id === "h2so4"))) {
      return {
        type: "acid_base",
        equation: "2KOH + H₂SO₄ → K₂SO₄ + 2H₂O",
        equationHtml: `2<span class='text-chemical-blue'>KOH</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-white'>K₂SO₄</span> + 2${WATER_HTML}`,
        description: "Phản ứng trung hòa giữa KOH và H₂SO₄",
        effects: [{ type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" }],
        products: ["k2so4"],
        observations: ["Dung dịch trong suốt, tỏa nhiệt"],
        heatChange: "exothermic",
      };
    }

    // HNO₃ + KOH → KNO₃ + H₂O
    if (pair(acid.id, base.id) && ((acid.id === "hno3" && base.id === "koh") || (acid.id === "koh" && base.id === "hno3"))) {
      return {
        type: "acid_base",
        equation: "KOH + HNO₃ → KNO₃ + H₂O",
        equationHtml: `<span class='text-chemical-blue'>KOH</span> + <span class='text-chemical-red'>HNO₃</span> → <span class='text-white'>KNO₃</span> + ${WATER_HTML}`,
        description: "Phản ứng trung hòa tạo muối kali nitrat",
        effects: [{ type: "color_change", intensity: "low", duration: 1500, targetColor: "#ffffff" }],
        products: ["kno3"],
        observations: ["Dung dịch trong suốt"],
        heatChange: "exothermic",
      };
    }

    // CH₃COOH + KOH → CH₃COOK + H₂O
    if (pair(acid.id, base.id) && ((acid.id === "ch3cooh" && base.id === "koh") || (acid.id === "koh" && base.id === "ch3cooh"))) {
      return {
        type: "acid_base",
        equation: "CH₃COOH + KOH → CH₃COOK + H₂O",
        equationHtml: `<span class='text-chemical-orange'>CH₃COOH</span> + <span class='text-chemical-blue'>KOH</span> → <span class='text-white'>CH₃COOK</span> + ${WATER_HTML}`,
        description: "Phản ứng trung hòa tạo kali axetat",
        effects: [{ type: "color_change", intensity: "low", duration: 1500, targetColor: "#ffffff" }],
        products: ["ch3cook"],
        observations: ["Dung dịch trong suốt"],
        heatChange: "exothermic",
      };
    }

    // NaOH + CH₃COOH → CH₃COONa + H₂O
    if (pair(acid.id, base.id) && ((acid.id === "ch3cooh" && base.id === "naoh") || (acid.id === "naoh" && base.id === "ch3cooh"))) {
      return {
        type: "acid_base",
        equation: "NaOH + CH₃COOH → CH₃COONa + H₂O",
        equationHtml: `<span class='text-chemical-blue'>NaOH</span> + <span class='text-chemical-orange'>CH₃COOH</span> → <span class='text-white'>CH₃COONa</span> + ${WATER_HTML}`,
        description: "Phản ứng trung hòa giữa bazơ mạnh và axit yếu",
        effects: [{ type: "color_change", intensity: "low", duration: 1500, targetColor: "#ffffff" }],
        products: ["ch3coona"],
        observations: ["Dung dịch trở nên trong suốt"],
        heatChange: "exothermic",
      };
    }

    // NH₃ + HCl → NH₄Cl (khói trắng)
    if (pair(acid.id, base.id) && ((acid.id === "hcl" && base.id === "nh3") || (acid.id === "nh3" && base.id === "hcl"))) {
      return {
        type: "acid_base",
        equation: "NH₃ + HCl → NH₄Cl",
        equationHtml: `<span class='text-gray-300'>NH₃</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-white'>NH₄Cl</span>`,
        description: "Phản ứng tạo khói trắng amoni clorua đặc trưng",
        effects: [
          { type: "smoke", intensity: "high", duration: 4000 },
          { type: "color_change", intensity: "low", duration: 1000, targetColor: "#ffffff" },
        ],
        products: ["nh4cl"],
        observations: ["Xuất hiện khói trắng dày đặc (tinh thể NH₄Cl)", "Phản ứng tỏa nhiệt"],
        heatChange: "exothermic",
      };
    }

    // NaOH + H₂SO₄ → Na₂SO₄ + 2H₂O
    if (pair(acid.id, base.id) && ((acid.id === "h2so4" && base.id === "naoh") || (acid.id === "naoh" && base.id === "h2so4"))) {
      return {
        type: "acid_base",
        equation: "2NaOH + H₂SO₄ → Na₂SO₄ + 2H₂O",
        equationHtml: `2<span class='text-chemical-blue'>NaOH</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-white'>Na₂SO₄</span> + 2${WATER_HTML}`,
        description: "Phản ứng trung hòa tạo natri sunfat",
        effects: [{ type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" }],
        products: ["na2so4"],
        observations: ["Dung dịch trong suốt", "Phản ứng tỏa nhiệt"],
        heatChange: "exothermic",
      };
    }

    // Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O
    if (pair(acid.id, base.id) && ((acid.id === "hcl" && base.id === "caoh2") || (acid.id === "caoh2" && base.id === "hcl"))) {
      return {
        type: "acid_base",
        equation: "Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O",
        equationHtml: `<span class='text-white'>Ca(OH)₂</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>CaCl₂</span> + 2${WATER_HTML}`,
        description: "Nước vôi trong phản ứng với axit clohidric",
        effects: [{ type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" }],
        products: ["cacl2"],
        observations: ["Dung dịch trong suốt", "Tỏa nhiệt nhẹ"],
        heatChange: "exothermic",
      };
    }

    // Ba(OH)₂ + 2HCl → BaCl₂ + 2H₂O
    if (pair(acid.id, base.id) && ((acid.id === "hcl" && base.id === "baoh2") || (acid.id === "baoh2" && base.id === "hcl"))) {
      return {
        type: "acid_base",
        equation: "Ba(OH)₂ + 2HCl → BaCl₂ + 2H₂O",
        equationHtml: `<span class='text-white'>Ba(OH)₂</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-white'>BaCl₂</span> + 2${WATER_HTML}`,
        description: "Trung hòa bari hidroxit với axit clohidric",
        effects: [{ type: "color_change", intensity: "medium", duration: 2000, targetColor: "#ffffff" }],
        products: ["bacl2"],
        observations: ["Dung dịch trong suốt"],
        heatChange: "exothermic",
      };
    }

    // Fe(OH)₃ + 3HCl → FeCl₃ + 3H₂O
    if (pair(acid.id, base.id) && ((acid.id === "hcl" && base.id === "feoh3") || (acid.id === "feoh3" && base.id === "hcl"))) {
      return {
        type: "acid_base",
        equation: "Fe(OH)₃ + 3HCl → FeCl₃ + 3H₂O",
        equationHtml: `<span class='text-chemical-red'>Fe(OH)₃</span> + 3<span class='text-chemical-red'>HCl</span> → <span class='text-chemical-orange'>FeCl₃</span> + 3${WATER_HTML}`,
        description: "Kết tủa nâu đỏ Fe(OH)₃ tan trong axit clohidric tạo dung dịch màu vàng nâu.",
        effects: [
          { type: "dissolve", intensity: "high", duration: 3000 },
          { type: "color_change", intensity: "high", duration: 3000, targetColor: "#d97706" },
        ],
        products: ["fecl3"],
        observations: ["Kết tủa nâu đỏ tan hoàn toàn", "Dung dịch chuyển sang màu vàng nâu của Fe³⁺"],
        heatChange: "exothermic",
      };
    }

    // Fe(OH)₂ + 2HCl → FeCl₂ + 2H₂O
    if (pair(acid.id, base.id) && ((acid.id === "hcl" && base.id === "feoh2") || (acid.id === "feoh2" && base.id === "hcl"))) {
      return {
        type: "acid_base",
        equation: "Fe(OH)₂ + 2HCl → FeCl₂ + 2H₂O",
        equationHtml: `<span class='text-emerald-300'>Fe(OH)₂</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-chemical-green'>FeCl₂</span> + 2${WATER_HTML}`,
        description: "Kết tủa trắng xanh Fe(OH)₂ tan trong axit tạo dung dịch FeCl₂ xanh lục nhạt.",
        effects: [
          { type: "dissolve", intensity: "high", duration: 3000 },
          { type: "color_change", intensity: "medium", duration: 3000, targetColor: "#66bb88" },
        ],
        products: ["fecl2"],
        observations: ["Kết tủa trắng xanh tan tạo dung dịch màu xanh lục nhạt"],
        heatChange: "exothermic",
      };
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 11. MUỐI CACBONAT + AXIT (Sinh khí CO₂)
  // ══════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════
  // 12. MUỐI SUNFUA + AXIT (FeS + HCl/H₂SO₄)
  // ══════════════════════════════════════════════════════════════
  if (pair("fes", "hcl")) {
    return {
      type: "gas_evolution",
      equation: "FeS + 2HCl → FeCl₂ + H₂S↑",
      equationHtml: `<span class='text-gray-400'>FeS</span> + 2<span class='text-chemical-red'>HCl</span> → <span class='text-chemical-green'>FeCl₂</span> + <span class='text-yellow-600 font-semibold'>H₂S↑</span>`,
      description: "Sắt(II) sunfua tan trong axit clohidric giải phóng khí hiđro sunfua mùi trứng thối đặc trưng.",
      effects: [
        { type: "bubbles", intensity: "high", duration: 4500, particleCount: 30 },
        { type: "dissolve", intensity: "medium", duration: 4000 },
        { type: "color_change", intensity: "medium", duration: 3000, targetColor: "#66bb88" },
      ],
      products: ["fecl2", "h2s"],
      observations: [
        "Chất rắn màu đen FeS tan dần",
        "Sủi bọt khí H₂S có mùi trứng thối đặc trưng, rất độc",
        "Dung dịch chuyển sang màu xanh lục nhạt của FeCl₂",
      ],
      heatChange: "exothermic",
    };
  }
  if (pair("fes", "h2so4")) {
    return {
      type: "gas_evolution",
      equation: "FeS + H₂SO₄ → FeSO₄ + H₂S↑",
      equationHtml: `<span class='text-gray-400'>FeS</span> + <span class='text-chemical-red'>H₂SO₄</span> → <span class='text-chemical-green'>FeSO₄</span> + <span class='text-yellow-600 font-semibold'>H₂S↑</span>`,
      description: "FeS tác dụng với axit sunfuric loãng sinh khí H₂S mùi trứng thối.",
      effects: [
        { type: "bubbles", intensity: "high", duration: 4500, particleCount: 30 },
        { type: "color_change", intensity: "medium", duration: 3000, targetColor: "#66bb88" },
      ],
      products: ["feso4", "h2s"],
      observations: ["FeS tan dần, sinh khí H₂S có mùi trứng thối"],
      heatChange: "exothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 13. HỮU CƠ: ESTE HÓA & TRÁNG GƯƠNG
  // ══════════════════════════════════════════════════════════════

  // Etanol + Axit axetic → Etyl axetat (Este hóa)
  if (pair("etanol", "ch3cooh")) {
    return {
      type: "complex",
      equation: "C₂H₅OH + CH₃COOH ⇄(H₂SO₄ đ, t°) CH₃COOC₂H₅ + H₂O",
      equationHtml: `<span class='text-white'>C₂H₅OH</span> + <span class='text-chemical-orange'>CH₃COOH</span> ⇄(H₂SO₄ đ, t°) <span class='text-emerald-400 font-semibold'>CH₃COOC₂H₅</span> + ${WATER_HTML}`,
      description: "Phản ứng este hóa giữa rượu etylic và axit axetic tạo etyl axetat có mùi thơm hoa quả.",
      effects: [
        { type: "bubbles", intensity: "low", duration: 2500 },
        { type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" },
      ],
      products: ["ch3cooc2h5"],
      observations: [
        "Chất lỏng tách lớp nhẹ",
        "Có mùi thơm hoa quả chín dễ chịu (mùi dầu chuối/táo)",
        "Phản ứng thuận nghịch cần axit H₂SO₄ đặc làm xúc tác và hút nước",
      ],
      heatChange: "endothermic",
    };
  }

  // Etyl axetat + NaOH → CH₃COONa + C₂H₅OH (Thủy phân este)
  if (pair("ch3cooc2h5", "naoh")) {
    return {
      type: "acid_base",
      equation: "CH₃COOC₂H₅ + NaOH →(t°) CH₃COONa + C₂H₅OH",
      equationHtml: `<span class='text-white'>CH₃COOC₂H₅</span> + <span class='text-chemical-blue'>NaOH</span> →(t°) <span class='text-white'>CH₃COONa</span> + <span class='text-white'>C₂H₅OH</span>`,
      description: "Phản ứng xà phòng hóa thủy phân este trong môi trường kiềm.",
      effects: [{ type: "color_change", intensity: "low", duration: 2000, targetColor: "#ffffff" }],
      products: ["ch3coona", "etanol"],
      observations: ["Hỗn hợp từ tách lớp trở nên đồng nhất sau khi đun nóng", "Mùi thơm của este biến mất"],
      heatChange: "none",
    };
  }

  // AgNO₃ + Glucose (Tráng gương / tráng bạc khi có môi trường kiềm/NH₃)
  if (pair("agno3", "glucose")) {
    return {
      type: "redox",
      equation: "C₆H₁₂O₆ + 2AgNO₃ + 3NH₃ + H₂O →(t°) 2Ag↓ + ...",
      equationHtml: `<span class='text-white'>C₆H₁₂O₆</span> + 2<span class='text-white'>AgNO₃</span> →(NH₃, t°) 2<span class='text-gray-100 font-bold'>Ag↓ (Gương bạc)</span> + ...`,
      description: "Phản ứng tráng bạc của glucose: nhóm andehit -CHO khử ion Ag⁺ tạo lớp bạc kim loại sáng bóng bám vào thành ống nghiệm.",
      effects: [
        { type: "precipitate", intensity: "high", duration: 4500, targetColor: "#d8d8e8" },
        { type: "sparkle", intensity: "high", duration: 3500 },
        { type: "color_change", intensity: "high", duration: 3000, targetColor: "#e0e0ec" },
      ],
      products: ["ag"],
      observations: [
        "Thành ống nghiệm xuất hiện một lớp bạc kim loại sáng loáng soi gương được",
        "Dùng để tráng ruột phích, tráng gương soi và nhận biết đường glucose",
      ],
      heatChange: "none",
    };
  }

  // KMnO₄ + FeSO₄ (Redox, cần môi trường axit)
  if (pair("kmno4", "feso4")) {
    return {
      type: "redox",
      equation: "2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O",
      equationHtml: `2<span class='text-purple-400'>KMnO₄</span> + 10<span class='text-chemical-green'>FeSO₄</span> → ... → <span class='text-yellow-500'>Fe₂(SO₄)₃</span>`,
      description: "Phản ứng oxi hóa khử: KMnO₄ (tím) bị khử làm mất màu tím, FeSO₄ bị oxi hóa thành Fe₂(SO₄)₃ màu vàng nâu.",
      effects: [
        { type: "color_change", intensity: "high", duration: 4000, targetColor: "#bb8833" },
        { type: "bubbles", intensity: "low", duration: 2000 },
        { type: "flash", intensity: "medium", duration: 1500 },
      ],
      products: ["fe2so43", "k2so4", "mnso4"],
      observations: [
        "Màu tím đặc trưng của KMnO₄ bị mất màu",
        "Dung dịch chuyển sang màu vàng nâu của ion Fe³⁺",
      ],
      heatChange: "exothermic",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 14. CÁC TRƯỜNG HỢP KHÔNG XẢY RA PHẢN ỨNG (User đề cập!)
  // ══════════════════════════════════════════════════════════════

  // CuS + HCl / H₂SO₄ → Không phản ứng (CuS không tan trong axit)
  if (pair("cus", "hcl") || pair("cus", "h2so4")) {
    const isH2SO4 = pair("cus", "h2so4");
    return {
      type: "none",
      equation: isH2SO4 ? "CuS + H₂SO₄ → Không phản ứng" : "CuS + HCl → Không phản ứng",
      equationHtml: `<span class='text-gray-400'>CuS</span> + <span class='text-chemical-red'>${isH2SO4 ? "H₂SO₄" : "HCl"}</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: `Đồng(II) sunfua (CuS) là kết tủa có tích số tan cực nhỏ (Ksp ≈ 10⁻³⁶), không tan trong axit mạnh như ${isH2SO4 ? "H₂SO₄" : "HCl"} loãng (chỉ tan trong axit có tính oxi hóa mạnh như HNO₃).`,
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#1c1c1c" }],
      products: [],
      observations: [
        "Chất kết tủa màu đen CuS không bị hòa tan",
        "Không có bọt khí mùi trứng thối thoát ra",
        "Quy tắc thực nghiệm: các muối sunfua của Cu, Pb, Ag, Hg không tan trong axit loãng",
      ],
      heatChange: "none",
    };
  }

  // Al₂O₃ + H₂O → Không phản ứng (user nhắc tới!)
  if (pair("al2o3", "h2o")) {
    return {
      type: "none",
      equation: "Al₂O₃ + H₂O → Không phản ứng",
      equationHtml: `<span class='text-gray-300'>Al₂O₃</span> + ${WATER_HTML} → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Nhôm oxit có mạng tinh thể ion rất bền vững, không tác dụng với nước ở điều kiện thường.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#f5f5f5" }],
      products: [],
      observations: ["Bột nhôm oxit không tan trong nước", "Không có hiện tượng phản ứng"],
      heatChange: "none",
    };
  }

  // MgO + H₂O → Không phản ứng ở đk thường (user nhắc tới!)
  if (pair("mgo", "h2o")) {
    return {
      type: "none",
      equation: "MgO + H₂O → Không phản ứng (đk thường)",
      equationHtml: `<span class='text-gray-300'>MgO</span> + ${WATER_HTML} → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Magie oxit thực tế không tan và hầu như không phản ứng với nước ở nhiệt độ phòng.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#f5f5f5" }],
      products: [],
      observations: ["Bột MgO không tan trong nước ở nhiệt độ phòng"],
      heatChange: "none",
    };
  }

  // CaCO₃ + NaOH → Không phản ứng
  if (pair("caco3", "naoh") || pair("caco3", "koh")) {
    return {
      type: "none",
      equation: "CaCO₃ + NaOH → Không phản ứng",
      equationHtml: `<span class='text-gray-200'>CaCO₃</span> + <span class='text-chemical-blue'>NaOH</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Không thỏa mãn điều kiện phản ứng trao đổi ion giữa muối và bazơ (chất tham gia phải tan và phải sinh ra chất kết tủa mới hoặc chất khí).",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#ffffff" }],
      products: [],
      observations: ["Chất rắn CaCO₃ không tan trong dung dịch kiềm"],
      heatChange: "none",
    };
  }

  // NaCl + KNO₃ → Không phản ứng
  if (pair("nacl", "kno3")) {
    return {
      type: "none",
      equation: "NaCl + KNO₃ → Không phản ứng",
      equationHtml: `<span class='text-white'>NaCl</span> + <span class='text-white'>KNO₃</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Cả 2 muối đều phân ly thành các ion (Na⁺, Cl⁻, K⁺, NO₃⁻), nhưng không tạo thành chất kết tủa, chất bay hơi hay chất điện li yếu nên phản ứng trao đổi ion không diễn ra.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#ffffff" }],
      products: [],
      observations: ["Dung dịch vẫn trong suốt không màu", "Không có kết tủa, không có bọt khí"],
      heatChange: "none",
    };
  }

  // NaCl + HCl → Không phản ứng
  if (pair("nacl", "hcl")) {
    return {
      type: "none",
      equation: "NaCl + HCl → Không phản ứng",
      equationHtml: `<span class='text-white'>NaCl</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Cùng chứa gốc clorua Cl⁻, không có phản ứng xảy ra.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#ffffff" }],
      products: [],
      observations: ["Dung dịch trong suốt, không có hiện tượng"],
      heatChange: "none",
    };
  }

  // Na₂SO₄ + HCl → Không phản ứng
  if (pair("na2so4", "hcl")) {
    return {
      type: "none",
      equation: "Na₂SO₄ + HCl → Không phản ứng",
      equationHtml: `<span class='text-white'>Na₂SO₄</span> + <span class='text-chemical-red'>HCl</span> → <span class='text-gray-400'>Không xảy ra phản ứng</span>`,
      description: "Không tạo kết tủa hay bay hơi, phản ứng trao đổi ion không diễn ra.",
      effects: [{ type: "color_change", intensity: "low", duration: 800, targetColor: "#ffffff" }],
      products: [],
      observations: ["Dung dịch trong suốt, không xảy ra phản ứng"],
      heatChange: "none",
    };
  }

  // Không tìm thấy phản ứng phù hợp
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
        equationHtml: `<span class='text-white'>C₂H₅OH</span> + 3<span class='text-gray-200'>O₂</span> → 2${CO2_HTML} + 3${WATER_HTML}`,
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
        equationHtml: `2<span class='text-gray-300'>Mg</span> + <span class='text-gray-200'>O₂</span> → 2<span class='text-white'>MgO</span>`,
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
        equationHtml: `<span class='text-gray-200'>CaCO₃</span> →(t°) <span class='text-white'>CaO</span> + ${CO2_HTML}`,
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

    // BaCO₃ nhiệt phân → BaO + CO₂
    case "baco3": {
      return {
        type: "gas_evolution",
        equation: "BaCO₃ →(t°) BaO + CO₂↑",
        equationHtml: `<span class='text-gray-200'>BaCO₃</span> →(t°) <span class='text-white'>BaO</span> + ${CO2_HTML}`,
        description: "Bari cacbonat bị phân hủy ở nhiệt độ cao tạo bari oxit và CO₂.",
        effects: [{ type: "bubbles", intensity: "low", duration: 5000 }],
        products: ["bao", "co2"],
        observations: ["Chất rắn phân hủy giải phóng khí CO₂"],
        heatChange: "endothermic",
      };
    }

    // Cu(OH)₂ nhiệt phân → CuO + H₂O (kết tủa xanh lam hóa đen)
    case "cuoh2": {
      return {
        type: "precipitation",
        equation: "Cu(OH)₂ →(t°) CuO + H₂O",
        equationHtml: `<span class='text-cyan-400'>Cu(OH)₂</span> →(t°) <span class='text-gray-400'>CuO</span> + ${WATER_HTML}`,
        description: "Đồng(II) hidroxit màu xanh lam bị nhiệt phân thành đồng(II) oxit màu đen.",
        effects: [
          { type: "color_change", intensity: "high", duration: 3500, targetColor: "#222222" },
          { type: "smoke", intensity: "low", duration: 2500 },
        ],
        products: ["cuo"],
        observations: [
          "Chất rắn màu xanh lam Cu(OH)₂ dần chuyển sang màu đen đặc trưng của CuO",
          "Có hơi nước ngưng tụ thành giọt trên thành ống nghiệm",
        ],
        heatChange: "endothermic",
      };
    }

    // Fe(OH)₃ nhiệt phân → Fe₂O₃ + 3H₂O (nâu đỏ)
    case "feoh3": {
      return {
        type: "precipitation",
        equation: "2Fe(OH)₃ →(t°) Fe₂O₃ + 3H₂O",
        equationHtml: `2<span class='text-chemical-red'>Fe(OH)₃</span> →(t°) <span class='text-red-700 font-bold'>Fe₂O₃</span> + 3${WATER_HTML}`,
        description: "Sắt(III) hidroxit bị nhiệt phân thành oxit sắt(III) màu đỏ nâu.",
        effects: [
          { type: "color_change", intensity: "high", duration: 3500, targetColor: "#8b2500" },
        ],
        products: ["fe2o3"],
        observations: ["Chất rắn màu nâu đỏ chuyển thành bột oxit Fe₂O₃", "Hơi nước thoát ra"],
        heatChange: "endothermic",
      };
    }

    // 2AgNO₃ → 2Ag + 2NO₂ + O₂ (nhiệt phân muối nitrat)
    case "agno3": {
      return {
        type: "redox",
        equation: "2AgNO₃ →(t°) 2Ag↓ + 2NO₂↑ + O₂↑",
        equationHtml: `2<span class='text-white'>AgNO₃</span> →(t°) 2<span class='text-gray-100 font-bold'>Ag↓</span> + 2${NO2_HTML} + <span class='text-gray-200'>O₂↑</span>`,
        description: "Bạc nitrat bị phân hủy sinh ra kim loại bạc và khí NO₂ màu nâu đỏ.",
        effects: [
          { type: "bubbles", intensity: "high", duration: 4000 },
          { type: "smoke", intensity: "high", duration: 4000 },
          { type: "sparkle", intensity: "medium", duration: 2500 },
        ],
        products: ["ag", "no2", "o2"],
        observations: [
          "Muối trắng chuyển thành lớp bạc màu xám lấp lánh",
          "Thoát ra khí NO₂ màu nâu đỏ",
        ],
        heatChange: "endothermic",
      };
    }

    // 2KMnO₄ → K₂MnO₄ + MnO₂ + O₂ (điều chế oxi trong phòng thí nghiệm)
    case "kmno4": {
      return {
        type: "gas_evolution",
        equation: "2KMnO₄ →(t°) K₂MnO₄ + MnO₂ + O₂↑",
        equationHtml: `2<span class='text-purple-400'>KMnO₄</span> →(t°) <span class='text-emerald-700'>K₂MnO₄</span> + <span class='text-gray-400'>MnO₂</span> + <span class='text-gray-200'>O₂↑</span>`,
        description: "Nhiệt phân thuốc tím giải phóng khí oxi (phương pháp điều chế oxi phổ biến trong phòng thí nghiệm).",
        effects: [
          { type: "bubbles", intensity: "high", duration: 5000, particleCount: 35 },
          { type: "sparkle", intensity: "medium", duration: 2500 },
        ],
        products: ["k2mno4", "mno2", "o2"],
        observations: [
          "Thuốc tím nổ lách tách và giải phóng khí O₂",
          "Que đóm còn tàn đỏ bùng cháy mãnh liệt khi đưa lại gần miệng ống nghiệm",
        ],
        heatChange: "endothermic",
      };
    }

    // NH₄Cl → NH₃ + HCl (thăng hoa muối amoni)
    case "nh4cl": {
      return {
        type: "gas_evolution",
        equation: "NH₄Cl ⇄(t°) NH₃↑ + HCl↑",
        equationHtml: `<span class='text-white'>NH₄Cl</span> ⇄(t°) <span class='text-gray-300'>NH₃↑</span> + <span class='text-chemical-red'>HCl↑</span>`,
        description: "Amoni clorua thăng hoa khi đun nóng, phân hủy thành khí NH₃ và HCl rồi ngưng tụ lại ở phần lạnh.",
        effects: [
          { type: "smoke", intensity: "high", duration: 4500 },
        ],
        products: ["nh3", "hcl"],
        observations: [
          "Muối trắng bốc khói dày đặc",
          "Tinh thể trắng ngưng tụ lại ở phần thành ống nghiệm phía trên",
        ],
        heatChange: "endothermic",
      };
    }

    // H₂O₂ đun nóng → H₂O + O₂
    case "h2o2": {
      return {
        type: "gas_evolution",
        equation: "2H₂O₂ →(t°) 2H₂O + O₂↑",
        equationHtml: `2<span class='text-white'>H₂O₂</span> →(t°) 2${WATER_HTML} + <span class='text-gray-200'>O₂↑</span>`,
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

    // 4CuO → 2Cu₂O + O₂ (user nhắc tới: 4CuO → O2 + 2Cu2O)
    case "cuo": {
      return {
        type: "redox",
        equation: "4CuO →(>1000°C) 2Cu₂O + O₂↑",
        equationHtml: `4<span class='text-gray-400'>CuO</span> →(t°) 2<span class='text-red-600 font-bold'>Cu₂O</span> + <span class='text-gray-200'>O₂↑</span>`,
        description: "Ở nhiệt độ cao trên 1000°C, đồng(II) oxit màu đen bị nhiệt phân thành đồng(I) oxit màu đỏ gạch và oxi.",
        effects: [
          { type: "color_change", intensity: "high", duration: 3500, targetColor: "#c0392b" },
          { type: "bubbles", intensity: "low", duration: 2500 },
        ],
        products: ["cu2o", "o2"],
        observations: [
          "Bột màu đen chuyển dần sang màu đỏ gạch của Cu₂O",
          "Giải phóng khí oxi",
        ],
        heatChange: "endothermic",
      };
    }

    default:
      return null;
  }
}
