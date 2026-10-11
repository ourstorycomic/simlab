import { chemicals, Chemical } from "../src/lib/chemicals";
import { getReaction, getHeatingReaction, ReactionResult } from "../src/lib/reactions";
import * as fs from "fs";
import * as path from "path";

interface PairReaction {
  c1: Chemical;
  c2: Chemical;
  result: ReactionResult;
}

// 1. Thu thập tất cả các cặp có phản ứng (kể cả type !== 'none' và type === 'none')
const allPairReactions: PairReaction[] = [];
const educationalNoReactions: PairReaction[] = [];

for (let i = 0; i < chemicals.length; i++) {
  for (let j = i + 1; j < chemicals.length; j++) {
    const a = chemicals[i];
    const b = chemicals[j];
    const r = getReaction(a, b) || getReaction(b, a);
    if (r) {
      if (r.type === "none") {
        educationalNoReactions.push({ c1: a, c2: b, result: r });
      } else {
        allPairReactions.push({ c1: a, c2: b, result: r });
      }
    }
  }
}

// 2. Thu thập phản ứng khi nung nóng / nhiệt phân
interface HeatingReactionItem {
  chemical: Chemical;
  result: ReactionResult;
}
const heatingReactions: HeatingReactionItem[] = [];
for (const c of chemicals) {
  const hr = getHeatingReaction(c);
  if (hr) {
    heatingReactions.push({ chemical: c, result: hr });
  }
}

// Format hiện tượng quan sát
function formatObservations(r: ReactionResult): string {
  if (r.observations && r.observations.length > 0) {
    return r.observations.join("; ");
  }
  return "Biến đổi hóa học đặc trưng";
}

// Phân loại logic chi tiết theo nhóm sư phạm GDPT 2018
const amphotericPairIds = new Set([
  "al_naoh", "naoh_al", "al_koh", "koh_al",
  "aloh3_naoh", "naoh_aloh3", "aloh3_koh", "koh_aloh3",
  "al2o3_naoh", "naoh_al2o3", "al2o3_koh", "koh_al2o3",
]);

const cuSpecialPairs: PairReaction[] = [];
const metalAcidPairs: PairReaction[] = [];
const acidBasePairs: PairReaction[] = [];
const amphotericPairs: PairReaction[] = [];
const precipitationPairs: PairReaction[] = [];
const redoxMetalPairs: PairReaction[] = [];
const gasEvolutionPairs: PairReaction[] = [];
const organicComplexPairs: PairReaction[] = [];
const indicatorPairs: PairReaction[] = [];
const otherPairs: PairReaction[] = [];

for (const pair of allPairReactions) {
  const id1 = pair.c1.id;
  const id2 = pair.c2.id;
  const pairKey = `${id1}_${id2}`;
  const pairRevKey = `${id2}_${id1}`;
  const type = pair.result.type;

  // Lưỡng tính
  if (amphotericPairIds.has(pairKey) || amphotericPairIds.has(pairRevKey)) {
    amphotericPairs.push(pair);
    continue;
  }

  // Nhóm liên quan đến Cu
  if (id1 === "cu" || id2 === "cu" || id1 === "cuoh2" || id2 === "cuoh2" || id1 === "cuo" || id2 === "cuo") {
    cuSpecialPairs.push(pair);
  }

  if (type === "metal_acid") {
    metalAcidPairs.push(pair);
  } else if (type === "acid_base") {
    acidBasePairs.push(pair);
  } else if (type === "precipitation") {
    precipitationPairs.push(pair);
  } else if (type === "gas_evolution") {
    gasEvolutionPairs.push(pair);
  } else if (type === "redox") {
    redoxMetalPairs.push(pair);
  } else if (type === "complex" || (pair.c1.category === "organic" || pair.c2.category === "organic")) {
    organicComplexPairs.push(pair);
  } else if (type === "color_change") {
    indicatorPairs.push(pair);
  } else {
    otherPairs.push(pair);
  }
}

function renderTable(pairs: PairReaction[]): string {
  let table = `| Hóa chất A | Hóa chất B | Phương trình phản ứng | Hiện tượng quan sát | Nhiệt lượng |\n`;
  table += `|---|---|---|---|---|\n`;
  for (const item of pairs) {
    const n1 = item.c1.name;
    const n2 = item.c2.name;
    const eq = `\`${item.result.equation}\``;
    const obs = formatObservations(item.result);
    const heat = item.result.heatChange === "exothermic" ? "🔥 Tỏa nhiệt" : (item.result.heatChange === "endothermic" ? "❄️ Thu nhiệt" : "—");
    table += `| **${n1}** (${item.c1.formula}) | **${n2}** (${item.c2.formula}) | ${eq} | ${obs} | ${heat} |\n`;
  }
  return table;
}

let md = `# CẨM NANG TOÀN BỘ PHẢN ỨNG HÓA HỌC (SIMLAB REACTION CATALOG)

> **Tài liệu toàn diện**: Tra cứu tất cả các cặp hóa chất có phản ứng trong phòng thí nghiệm ảo **SimLab Master**, bao gồm phương trình cân bằng, hiện tượng trực quan, cơ chế nhiệt lượng, phản ứng nhiệt phân bằng đèn cồn và các trường hợp "Không phản ứng" phổ biến được giải thích khoa học theo chuẩn chương trình **GDPT 2018**.

---

## 📌 MỤC LỤC NHANH
1. [Tổng quan hệ thống hóa chất & năng lực mô phỏng](#1-tổng-quan-hệ-thống-hóa-chất--năng-lực-mô-phỏng)
2. [Chuyên đề: Kim loại Đồng (Cu) và các Axit / Hợp chất của Cu](#2-chuyên-đề-kim-loại-đồng-cu-và-các-axit--hợp-chất-của-cu)
3. [Phản ứng Kim loại tác dụng với Axit (Sinh khí H₂)](#3-phản-ứng-kim-loại-tác-dụng-với-axit-sinh-khí-h₂)
4. [Phản ứng Trung hòa Axit - Bazơ & Oxit bazơ tác dụng với Axit](#4-phản-ứng-trung-hòa-axit---bazơ--oxit-bazơ-tác-dụng-với-axit)
5. [Phản ứng Lưỡng tính đặc trưng của Nhôm và hợp chất (Al, Al₂O₃, Al(OH)₃)](#5-phản-ứng-lưỡng-tính-đặc-trưng-của-nhôm-và-hợp-chất-nhôm)
6. [Phản ứng Trao đổi ion tạo kết tủa](#6-phản-ứng-trao-đổi-ion-tạo-kết-tủa)
7. [Phản ứng Oxi hóa - Khử & Kim loại mạnh đẩy kim loại yếu](#7-phản-ứng-oxi-hóa---khử--kim-loại-mạnh-đẩy-kim-loại-yếu)
8. [Phản ứng Sinh khí (Cacbonat, Sunfua + Axit; Xúc tác điều chế O₂)](#8-phản-ứng-sinh-khí-axit--muối-cacbonatsunfua-xúc-tác-khí-oxi)
9. [Phản ứng Hóa học Hữu cơ & Tạo phức (Este hóa, Thủy phân, Phức Glucozơ - Đồng)](#9-phản-ứng-hóa-học-hữu-cơ--tạo-phức)
10. [Chất chỉ thị màu & Phép thử nhận biết (Quỳ tím, Phenolphthalein, Metyl da cam, Tinh bột)](#10-chất-chỉ-thị-màu--phép-thử-nhận-biết)
11. [Phản ứng Nhiệt phân & Nung nóng bằng Đèn cồn](#11-phản-ứng-nhiệt-phân--nung-nóng-bằng-đèn-cồn)
12. [Bảng tra cứu các trường hợp KHÔNG PHẢN ỨNG tiêu biểu (Có giải thích sư phạm)](#12-bảng-tra-cứu-các-trường-hợp-không-phản-ứng-tiêu-biểu)

---

## 1. TỔNG QUAN HỆ THỐNG HÓA CHẤT & NĂNG LỰC MÔ PHỎNG
- **Tổng số hóa chất trong phòng thí nghiệm:** **${chemicals.length} hóa chất** (đầy đủ các nhóm Kim loại, Phi kim, Axit vô cơ/hữu cơ, Bazơ kiềm/không tan, Oxit axit/bazơ/lưỡng tính, Muối, Hợp chất hữu cơ và Chất chỉ thị).
- **Tổng số cặp hóa chất có phản ứng trực tiếp:** **${allPairReactions.length} cặp phản ứng**.
- **Số phản ứng nhiệt phân / đốt nóng:** **${heatingReactions.length} phản ứng nung nhiệt**.
- **Số phản ứng "Không phản ứng" có thẻ sư phạm:** **${educationalNoReactions.length} trường hợp chuẩn kiến thức**.

---

## 2. CHUYÊN ĐỀ: KIM LOẠI ĐỒNG (Cu) VÀ CÁC AXIT / HỢP CHẤT CỦA Cu
*(Trả lời câu hỏi: "Axit và đồng có phản ứng không?")*

### ⚠️ Bản chất hóa học của Đồng (Cu):
1. **Với axit không có tính oxi hóa (HCl loãng, H₂SO₄ loãng, CH₃COOH)**: Đồng đứng **sau Hydro** trong dãy điện hóa kim loại ($E^\\circ_{\\text{Cu}^{2+}/\\text{Cu}} = +0.34\\text{V} > E^\\circ_{2\\text{H}^+/\\text{H}_2} = 0.00\\text{V}$). Do đó, kim loại Cu **KHÔNG phản ứng** và không thể giải phóng khí H₂.
2. **Với axit có tính oxi hóa mạnh (HNO₃ mọi nồng độ, H₂SO₄ đặc nóng)**: Cu phản ứng **rất mãnh liệt**, bị oxi hóa lên Cu²⁺ (dung dịch màu xanh lam) và giải phóng các khí màu đặc trưng (NO₂ màu nâu đỏ, SO₂ mùi hắc).
3. **Các hợp chất của Đồng (Cu(OH)₂, CuO)**: Là bazơ và oxit bazơ, chúng phản ứng **với TẤT CẢ các axit** tạo muối Cu²⁺ màu xanh lam trong suốt.

### Bảng tổng hợp các phản ứng của Cu và hợp chất:
| Hóa chất A | Hóa chất B | Phương trình phản ứng | Hiện tượng quan sát | Kết luận |
|---|---|---|---|---|
| **Đồng (Cu)** | **Axit Nitric (HNO₃)** | \`Cu + 4HNO3 → Cu(NO3)2 + 2NO2↑ + 2H2O\` | Dung dịch chuyển sang màu xanh lam; Sủi bọt khí mãnh liệt sinh khí NO₂ màu nâu đỏ có mùi hắc độc hại; Tỏa nhiệt nóng ống nghiệm | ✅ **CÓ PHẢN ỨNG (Rất mạnh)** |
| **Đồng (Cu)** | **Axit Sunfuric đặc (H₂SO₄)** | \`Cu + 2H2SO4(đặc) --t°--> CuSO4 + SO2↑ + 2H2O\` | Đồng tan khi đun nóng; Dung dịch chuyển sang xanh lam; Thoát khí SO₂ mùi hắc làm mất màu cánh hoa hoặc giấy quỳ ẩm | ✅ **CÓ PHẢN ỨNG (Cần đun nóng)** |
| **Đồng (Cu)** | **Sắt(III) Clorua (FeCl₃)** | \`Cu + 2FeCl3 → CuCl2 + 2FeCl2\` | Lá đồng tan dần không sinh khí; Dung dịch màu vàng nâu chuyển dần sang xanh lam/lục nhạt; Ứng dụng ăn mòn mạch in điện tử PCB | ✅ **CÓ PHẢN ỨNG** |
| **Đồng (Cu)** | **Bạc Nitrat (AgNO₃)** | \`Cu + 2AgNO3 → Cu(NO3)2 + 2Ag↓\` | Tinh thể bạc màu trắng xám bám lấp lánh trên thanh đồng; Dung dịch không màu chuyển dần sang màu xanh lam | ✅ **CÓ PHẢN ỨNG** |
| **Đồng(II) Hiđroxit (Cu(OH)₂)** | **Axit Clohidric (HCl)** | \`Cu(OH)2 + 2HCl → CuCl2 + 2H2O\` | Kết tủa xanh lam tan hoàn toàn; Dung dịch chuyển thành dung dịch xanh lam sáng trong suốt | ✅ **CÓ PHẢN ỨNG** |
| **Đồng(II) Hiđroxit (Cu(OH)₂)** | **Axit Sunfuric (H₂SO₄)** | \`Cu(OH)2 + H2SO4 → CuSO4 + 2H2O\` | Kết tủa xanh lam tan nhanh; Thu được dung dịch đồng sunfat xanh lam đặc trưng; Tỏa nhiệt | ✅ **CÓ PHẢN ỨNG** |
| **Đồng(II) Hiđroxit (Cu(OH)₂)** | **Axit Nitric (HNO₃)** | \`Cu(OH)2 + 2HNO3 → Cu(NO3)2 + 2H2O\` | Kết tủa xanh lam tan hoàn toàn tạo dung dịch Cu(NO₃)₂ trong suốt | ✅ **CÓ PHẢN ỨNG** |
| **Đồng(II) Oxit (CuO)** | **Axit Clohidric (HCl)** | \`CuO + 2HCl → CuCl2 + H2O\` | Bột màu đen tan dần; Dung dịch trong ống nghiệm chuyển sang màu xanh lam | ✅ **CÓ PHẢN ỨNG** |
| **Đồng(II) Oxit (CuO)** | **Axit Sunfuric (H₂SO₄)** | \`CuO + H2SO4 → CuSO4 + H2O\` | Bột đen tan tạo dung dịch đồng sunfat xanh lam | ✅ **CÓ PHẢN ỨNG** |
| **Đồng(II) Oxit (CuO)** | **Axit Nitric (HNO₃)** | \`CuO + 2HNO3 → Cu(NO3)2 + H2O\` | Bột đen tan tạo dung dịch đồng nitrat trong suốt | ✅ **CÓ PHẢN ỨNG** |
| **Đồng (Cu)** | **Axit Clohidric loãng (HCl)** | \`Cu + HCl → Không phản ứng\` | Không có hiện tượng; Cu không tan, không sủi bọt khí | ❌ **KHÔNG PHẢN ỨNG (Đứng sau H)** |
| **Đồng (Cu)** | **Axit Axetic (CH₃COOH)** | \`Cu + CH3COOH → Không phản ứng\` | Kim loại đồng không tan trong axit hữu cơ yếu ở điều kiện thường | ❌ **KHÔNG PHẢN ỨNG** |

---

## 3. PHẢN ỨNG KIM LOẠI TÁC DỤNG VỚI AXIT (SINH KHÍ H₂)
> Kim loại đứng trước Hydro (Mg, Al, Zn, Fe...) tác dụng với dung dịch axit loãng giải phóng khí Hydro H₂ không màu và dung dịch muối tan.

${renderTable(metalAcidPairs)}

---

## 4. PHẢN ỨNG TRUNG HÒA AXIT - BAZƠ & OXIT BAZƠ TÁC DỤNG VỚI AXIT
> Phản ứng giữa Axit với Bazơ kiềm (NaOH, KOH, Ba(OH)₂, Ca(OH)₂, NH₃) hoặc Bazơ không tan (Cu(OH)₂, Fe(OH)₃, Fe(OH)₂) và Oxit bazơ (CuO, Al₂O₃). Đa số phản ứng diễn ra tức thì và tỏa nhiều nhiệt.

${renderTable(acidBasePairs)}

---

## 5. PHẢN ỨNG LƯỠNG TÍNH ĐẶC TRƯNG CỦA NHÔM VÀ HỢP CHẤT NHÔM
> Nhôm (Al), Nhôm oxit (Al₂O₃) và Nhôm hiđroxit (Al(OH)₃) có tính chất đặc biệt: vừa tan trong axit mạnh vừa tan trong dung dịch kiềm mạnh (NaOH, KOH) tạo thành muối aluminat ([Al(OH)₄]⁻ hoặc AlO₂⁻).

${renderTable(amphotericPairs)}

---

## 6. PHẢN ỨNG TRAO ĐỔI ION TẠO KẾT TỦA
> Phản ứng trao đổi giữa các dung dịch muối, axit và bazơ khi sinh ra chất kết tủa không tan hoặc ít tan:
> - **Kết tủa trắng:** AgCl, BaSO₄, BaCO₃, CaCO₃.
> - **Kết tủa keo trắng:** Al(OH)₃.
> - **Kết tủa màu xanh lam:** Cu(OH)₂.
> - **Kết tủa màu nâu đỏ:** Fe(OH)₃, nâu đen Ag₂O.
> - **Kết tủa màu trắng xanh:** Fe(OH)₂.
> - **Kết tủa màu vàng tươi / vàng đậm:** PbI₂ (thí nghiệm mưa vàng), AgI.

${renderTable(precipitationPairs)}

---

## 7. PHẢN ỨNG OXI HÓA - KHỬ & KIM LOẠI MẠNH ĐẨY KIM LOẠI YẾU
> Áp dụng quy tắc alpha ($\\alpha$) và dãy hoạt động hóa học: Kim loại có tính khử mạnh hơn khử ion kim loại yếu hơn ra khỏi dung dịch muối của nó. Ngoài ra bao gồm phản ứng oxi hóa khử với KMnO₄ và axit HNO₃.

${renderTable(redoxMetalPairs)}

---

## 8. PHẢN ỨNG SINH KHÍ (AXIT + MUỐI CACBONAT/SUNFUA; XÚC TÁC KHÍ OXI)
> - Muối cacbonat (Na₂CO₃, CaCO₃, BaCO₃) + Axit → Muối + H₂O + **CO₂↑** (sủi bọt khí không mùi).
> - Sắt sunfua (FeS) + Axit → Muối + **H₂S↑** (khí mùi trứng thối độc hại).
> - Phân hủy xúc tác H₂O₂ hoặc KClO₃ với MnO₂ giải phóng **khí O₂↑** (làm que đóm bùng cháy).

${renderTable(gasEvolutionPairs)}

---

## 9. PHẢN ỨNG HÓA HỌC HỮU CƠ & TẠO PHỨC
> - **Phản ứng este hóa:** C₂H₅OH + CH₃COOH ⇄ CH₃COOC₂H₅ + H₂O (tạo este có mùi táo chín thơm dịu, phản ứng thuận nghịch tỏa ít nhiệt).
> - **Phản ứng xà phòng hóa este:** CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH.
> - **Tạo phức màu xanh lam thẫm của Polyancol:** Glucozơ hòa tan Cu(OH)₂ tạo dung dịch phức đồng saccharate xanh lam thẫm.
> - **Phản ứng tráng bạc:** Glucozơ tác dụng với thuốc thử Tollens [Ag(NH₃)₂]OH tạo lớp gương bạc sáng loáng.
> - **Phức màu đỏ máu:** FeCl₃ tác dụng KSCN nhận biết ion Fe³⁺.

${renderTable(organicComplexPairs)}

---

## 10. CHẤT CHỈ THỊ MÀU & PHÉP THỬ NHẬN BIẾT
> Nhận diện môi trường Axit / Bazơ / Hồ tinh bột thông qua sự chuyển màu tức thì:
> - **Quỳ tím:** Axit hóa ĐỎ; Bazơ hóa XANH.
> - **Phenolphthalein:** Môi trường bazơ hóa HỒNG ĐẬM.
> - **Metyl da cam:** Môi trường axit hóa ĐỎ, trung tính CAM, bazơ VÀNG.
> - **Iot + Hồ tinh bột:** Chuyển màu XANH TÍM đặc trưng.

${renderTable(indicatorPairs)}

---

## 11. PHẢN ỨNG NHIỆT PHÂN & NUNG NÓNG BẰNG ĐÈN CỒN
> Thực hiện bằng cách đặt hóa chất vào ống nghiệm hoặc bình tam giác và bật **Đèn cồn (Bunsen Burner)**.

| Hóa chất bị nung nóng | Công thức | Phương trình phản ứng nhiệt | Hiện tượng quan sát trực quan |
|---|---|---|---|
${heatingReactions.map(h => `| **${h.chemical.name}** | ${h.chemical.formula} | \`${h.result.equation}\` | ${formatObservations(h.result)} |`).join("\n")}

---

## 12. BẢNG TRA CỨU CÁC TRƯỜNG HỢP KHÔNG PHẢN ỨNG TIÊU BIỂU
> Giúp học sinh nắm vững điều kiện phản ứng trao đổi ion và quy luật dãy điện hóa kim loại:

| Hóa chất A | Hóa chất B | Phương trình quy ước | Bản chất khoa học & Lý do không phản ứng |
|---|---|---|---|
${educationalNoReactions.map(no => `| **${no.c1.name}** | **${no.c2.name}** | \`${no.result.equation}\` | ${no.result.description} |`).join("\n")}

---
*Tài liệu được khởi tạo và đồng bộ tự động với Reaction Engine của SimLab Master.*
`;

const outputPath = path.resolve(__dirname, "../HUONG_DAN_PHAN_UNG_HOA_HOC.md");
fs.writeFileSync(outputPath, md, "utf8");
console.log(`Đã xuất tài liệu thành công: ${outputPath}`);
