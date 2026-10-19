/**
 * Cơ sở Tri thức Số Hóa Sách Giáo Khoa GDPT 2018 (SimLab Curriculum Knowledge Base)
 * Nguồn dữ liệu tham chiếu: Bộ sách Kết nối tri thức với cuộc sống & Cánh Diều (NXB Giáo Dục Việt Nam)
 * Phục vụ cơ chế RAG (Retrieval-Augmented Generation) chống Hallucination (bịa đặt) của AI.
 */

export interface SGKChunk {
  id: string;
  subject: "chemistry" | "physics" | "biology" | "general_science";
  grade: number; // 8, 9, 10, 11, 12
  topic: string;
  sourceBook: string; // VD: "Hóa học 11 - Kết nối tri thức - Bài 4"
  ruleOrLaw: string; // Định luật / Nguyên lý khoa học
  safetyWarning?: string; // Cảnh báo an toàn thí nghiệm
  keywords: string[];
  explanation: string;
}

export const SGK_CURRICULUM_DATA: SGKChunk[] = [
  // ─── 1. AN TOÀN PHÒNG THÍ NGHIỆM (KHTN 8, HÓA 10) ───
  {
    id: "safe-01",
    subject: "chemistry",
    grade: 10,
    topic: "Quy tắc an toàn pha loãng Axit Sunfuric đặc",
    sourceBook: "Hóa học 10 - Kết nối tri thức - Bài 1 & Chuyên đề an toàn",
    ruleOrLaw: "Axit H₂SO₄ đặc háo nước mạnh và tỏa nhiệt mãnh liệt (ΔH < 0).",
    safetyWarning: "NGHIÊM CẤM rót nước vào axit sunfuric đặc. Nước có khối lượng riêng nhỏ hơn sẽ nổi lên trên, sôi đột ngột và bắn axit ra ngoài gây bỏng cực kỳ nguy hiểm.",
    keywords: ["h2so4", "axit", "nước vào axit", "pha loãng", "bỏng", "an toàn", "sunfuric", "đặc"],
    explanation: "Cách pha loãng an toàn: Rót từ từ axit sunfuric đặc vào nước dọc theo đũa thủy tinh, vừa rót vừa khuấy nhẹ. Tuyệt đối không làm ngược lại.",
  },
  {
    id: "safe-02",
    subject: "chemistry",
    grade: 8,
    topic: "Quy tắc đun nóng hóa chất trong ống nghiệm",
    sourceBook: "KHTN 8 - Kết nối tri thức - Mở đầu: Sử dụng dụng cụ và an toàn",
    ruleOrLaw: "Thủy tinh giãn nở vì nhiệt cục bộ có thể nứt vỡ; chất lỏng sôi cục bộ gây trào phụt.",
    safetyWarning: "Không để đáy ống nghiệm sát bấc đèn cồn; không hướng miệng ống nghiệm về phía mình hoặc người khác.",
    keywords: ["đun", "đèn cồn", "ống nghiệm", "nhiệt độ", "trào", "vỡ", "bỏng"],
    explanation: "Quy trình chuẩn: Dùng kẹp gỗ cặp ở 1/3 thân ống nghiệm tính từ miệng. Hơ đều dọc thân và đáy ống nghiệm để nhiệt tản đều, sau đó mới đun tập trung tại vị trí có hóa chất, nghiêng góc 45 độ.",
  },
  {
    id: "safe-03",
    subject: "chemistry",
    grade: 10,
    topic: "An toàn khi điều chế và thu khí độc (Cl2, NO2, SO2, H2S)",
    sourceBook: "Hóa học 10 - Cánh Diều - Bài 17: Halogen",
    ruleOrLaw: "Khí Halogen và Oxide của Nitơ/Lưu huỳnh có tính độc, kích ứng mạnh đường hô hấp.",
    safetyWarning: "Phải thực hiện trong tủ hút hoặc dùng bông tẩm dung dịch kiềm (NaOH) nút ở miệng ống nghiệm để hấp thụ khí dư.",
    keywords: ["khí độc", "cl2", "no2", "so2", "bông tẩm", "hút", "naoh"],
    explanation: "Dung dịch kiềm NaOH phản ứng trung hòa các khí oxit axit và halogen: Cl₂ + 2NaOH → NaCl + NaClO + H₂O; 2NO₂ + 2NaOH → NaNO₃ + NaNO₂ + H₂O.",
  },

  // ─── 2. HÓA HỌC VÔ CƠ & CÂN BẰNG ION (HÓA 11 - GDPT 2018) ───
  {
    id: "chem-11-01",
    subject: "chemistry",
    grade: 11,
    topic: "Phản ứng của Kim loại Đồng (Cu) với Axit Nitric (HNO3)",
    sourceBook: "Hóa học 11 - Kết nối tri thức - Bài 5: Hợp chất của Nitrogen",
    ruleOrLaw: "Axit nitric là chất oxi hóa rất mạnh. Kim loại Cu bị oxi hóa lên mức số oxi hóa +2.",
    keywords: ["cu", "hno3", "đồng", "nitric", "sủi bọt", "màu nâu", "no2", "nâu đỏ", "xanh lam"],
    explanation: "Hiện tượng: Đồng tan dần, dung dịch chuyển từ không màu sang màu xanh lam của ion Cu²⁺, có bọt khí màu nâu đỏ (NO₂) thoát ra với HNO₃ đặc: Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O. Với HNO₃ loãng sinh khí NO không màu hóa nâu trong không khí.",
  },
  {
    id: "chem-11-02",
    subject: "chemistry",
    grade: 11,
    topic: "Nhận biết Ion Sulfate (SO4 2-) bằng Barium Chloride (BaCl2)",
    sourceBook: "Hóa học 11 - Kết nối tri thức - Bài 7: Sulfuric acid và muối sulfate",
    ruleOrLaw: "Tích số tan của BaSO₄ cực nhỏ (Ksp ≈ 1.1 × 10⁻¹⁰), kết tủa không tan trong axit mạnh.",
    keywords: ["baso4", "bacl2", "so4", "kết tủa trắng", "sulfate", "barium", "nhận biết"],
    explanation: "Phương trình ion rút gọn: Ba²⁺ + SO₄²⁻ → BaSO₄↓ (kết tủa màu trắng). Dấu hiệu đặc trưng: Kết tủa trắng này không tan trong dung dịch axit HCl hoặc HNO₃, giúp phân biệt với BaCO₃ hay BaSO₃.",
  },
  {
    id: "chem-11-03",
    subject: "chemistry",
    grade: 11,
    topic: "Phản ứng Thủy phân và Cân bằng Sự điện li (pH & Chỉ thị)",
    sourceBook: "Hóa học 11 - Cánh Diều - Bài 2: Cân bằng trong dung dịch nước",
    ruleOrLaw: "Thuyết acid-base của Brønsted - Lowry: Acid cho proton (H⁺), base nhận proton (H⁺).",
    keywords: ["ph", "chỉ thị", "quỳ tím", "phenolphthalein", "axit", "bazo", "h+", "oh-"],
    explanation: "Chỉ thị màu: Phenolphthalein không màu trong môi trường axit/trung tính (pH < 8.3) và chuyển sang màu hồng tím khi gặp base (pH > 8.3). Quỳ tím hóa đỏ khi pH < 6 và hóa xanh khi pH > 8.",
  },

  // ─── 3. KIM LOẠI & DÃY HOẠT ĐỘNG HÓA HỌC (KHTN 9 & HÓA 12) ───
  {
    id: "chem-09-01",
    subject: "chemistry",
    grade: 9,
    topic: "Kim loại kiềm (Na, K) tác dụng với Nước",
    sourceBook: "KHTN 9 - Kết nối tri thức - Bài 15: Tính chất kim loại",
    ruleOrLaw: "Kim loại nhóm IA có tính khử rất mạnh, thế điện cực chuẩn E° rất âm.",
    safetyWarning: "Kim loại Na phản ứng nổ nguy hiểm nếu dùng lượng lớn. Chỉ dùng mẩu nhỏ cỡ hạt đậu xanh, thấm khô dầu trước khi cho vào chậu nước có che mặt kính đồng hồ.",
    keywords: ["na", "natri", "nước", "kim loại kiềm", "nổ", "h2", "nóng chảy", "chạy tròn"],
    explanation: "Hiện tượng: Mẩu natri nóng chảy thành giọt tròn, chạy lượn trên mặt nước, có tiếng xèo xèo, bốc cháy ngọn lửa màu vàng và sinh khí H₂: 2Na + 2H₂O → 2NaOH + H₂↑. Dung dịch thu được làm quỳ tím hóa xanh / phenolphthalein hóa hồng.",
  },
  {
    id: "chem-12-01",
    subject: "chemistry",
    grade: 12,
    topic: "Phản ứng tráng bạc của Glucose (Aldehyde)",
    sourceBook: "Hóa học 12 - Kết nối tri thức - Bài 4: Carbohydrate",
    ruleOrLaw: "Nhóm chức -CHO trong glucose bị oxi hóa bởi phức chất [Ag(NH₃)₂]OH thành muối ammonium gluconate.",
    keywords: ["glucose", "tráng bạc", "ag", "kết tủa bạc", "tollens", "gương", "nh3", "agno3"],
    explanation: "Hiện tượng: Thành ống nghiệm sáng bóng như gương do lớp kim loại bạc (Ag) kim loại bám vào: CH₂OH[CHOH]₄CHO + 2[Ag(NH₃)₂]OH → CH₂OH[CHOH]₄COONH₄ + 2Ag↓ + 3NH₃ + H₂O (đun nóng cách thủy nhẹ 60-70°C).",
  },

  // ─── 4. VẬT LÝ & SINH HỌC TÍCH HỢP ───
  {
    id: "phy-10-01",
    subject: "physics",
    grade: 10,
    topic: "Định luật Bảo toàn Năng lượng & Nhiệt động lực học",
    sourceBook: "Vật lý 10 - Kết nối tri thức - Bài 25: Năng lượng và công",
    ruleOrLaw: "Độ biến thiên nội năng: ΔU = A + Q. Nhiệt lượng tự phát truyền từ vật có nhiệt độ cao sang vật có nhiệt độ thấp.",
    keywords: ["nhiệt lượng", "năng lượng", "bảo toàn", "nhiệt độ", "truyền nhiệt"],
    explanation: "Trong phản ứng tỏa nhiệt (Exothermic, ΔH < 0), hóa năng biến đổi thành nhiệt năng làm tăng nhiệt độ của hệ xung quanh. Cần kiểm soát tản nhiệt khi nhiệt độ vượt ngưỡng an toàn.",
  },
  {
    id: "bio-10-01",
    subject: "biology",
    grade: 10,
    topic: "Hiện tượng Co nguyên sinh và Phản co nguyên sinh ở Tế bào",
    sourceBook: "Sinh học 10 - Cánh Diều - Bài 10: Trao đổi chất qua màng sinh chất",
    ruleOrLaw: "Thẩm thấu: Nước di chuyển từ nơi có thế nước cao (dung dịch nhược trương) sang nơi có thế nước thấp (dung dịch ưu trương).",
    keywords: ["co nguyên sinh", "thẩm thấu", "tế bào", "ưu trương", "nhược trương", "màng tế bào"],
    explanation: "Khi đặt tế bào vào dung dịch ưu trương (nồng độ chất tan cao hơn trong tế bào), nước thẩm thấu ra ngoài làm tế bào chất co lại, màng sinh chất tách rời khỏi thành cellulose.",
  },
];

/**
 * Thuật toán RAG Tối ưu Token:
 * Tìm kiếm các đoạn SGK chuẩn GDPT 2018 khớp nhất với câu hỏi / ngữ cảnh thí nghiệm hiện tại
 * Giúp prompt truyền vào LLM cực kỳ ngắn gọn (chỉ 100-200 tokens), tiết kiệm 80% token so với nạp toàn bộ sách.
 */
export function retrieveSGKKnowledge(query: string, limit = 2): SGKChunk[] {
  const cleanQ = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = cleanQ.split(/\s+/).filter((w) => w.length > 1);

  const scored = SGK_CURRICULUM_DATA.map((chunk) => {
    let score = 0;
    const textBlob = `${chunk.topic} ${chunk.ruleOrLaw} ${chunk.explanation} ${chunk.keywords.join(" ")}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    for (const w of words) {
      if (textBlob.includes(w)) {
        score += 2;
      }
    }

    for (const kw of chunk.keywords) {
      if (cleanQ.includes(kw.toLowerCase())) {
        score += 4;
      }
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topResults = scored.filter((s) => s.score > 0).slice(0, limit);
  if (topResults.length === 0) {
    // Nếu không khớp từ khóa cụ thể, trả về quy tắc an toàn cơ bản
    return [SGK_CURRICULUM_DATA[0]];
  }

  return topResults.map((s) => s.chunk);
}
