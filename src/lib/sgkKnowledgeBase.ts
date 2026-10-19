/**
 * Cơ sở Tri thức Số Hóa Sách Giáo Khoa GDPT 2018 (SimLab Multi-Subject Knowledge Base)
 * Hỗ trợ toàn diện các môn học: Hóa học, Vật lý, Sinh học, Toán học, Ngữ văn và Kỹ năng học tập
 * Nguồn dữ liệu tham chiếu: Bộ sách Kết nối tri thức với cuộc sống & Cánh Diều (NXB Giáo Dục Việt Nam)
 */

export interface SGKChunk {
  id: string;
  subject: "chemistry" | "physics" | "biology" | "math" | "literature" | "general";
  grade: number; // 6 - 12
  topic: string;
  sourceBook: string; // VD: "Toán 10 - Kết nối tri thức - Bài 3"
  ruleOrLaw: string; // Định luật / Nguyên lý khoa học / Định lý / Khái niệm
  safetyWarning?: string; // Cảnh báo an toàn (nếu có)
  keywords: string[];
  explanation: string;
}

export const SGK_CURRICULUM_DATA: SGKChunk[] = [
  // ─── 1. TOÁN HỌC (MATH) ───
  {
    id: "math-08-01",
    subject: "math",
    grade: 8,
    topic: "Định lý Pythagoras (Pi-ta-go) trong tam giác vuông",
    sourceBook: "Toán 8 - Kết nối tri thức - Bài 9: Định lí Pythagore",
    ruleOrLaw: "Trong một tam giác vuông, bình phương của cạnh huyền bằng tổng các bình phương của hai cạnh góc vuông: a² + b² = c².",
    keywords: ["pythagoras", "pitago", "tam giác vuông", "cạnh huyền", "a^2+b^2=c^2", "toán 8"],
    explanation: "Nếu tam giác ABC vuông tại A với BC là cạnh huyền thì BC² = AB² + AC². Định lý đảo: Nếu một tam giác có bình phương một cạnh bằng tổng bình phương hai cạnh kia thì tam giác đó là tam giác vuông.",
  },
  {
    id: "math-11-01",
    subject: "math",
    grade: 11,
    topic: "Đạo hàm và Ý nghĩa hình học của đạo hàm",
    sourceBook: "Toán 11 - Kết nối tri thức - Chương VII: Đạo hàm",
    ruleOrLaw: "Đạo hàm f'(x₀) là hệ số góc của tiếp tuyến của đồ thị hàm số y = f(x) tại điểm M₀(x₀; f(x₀)). Phương trình tiếp tuyến: y - y₀ = f'(x₀)(x - x₀).",
    keywords: ["đạo hàm", "tiếp tuyến", "hệ số góc", "vi phân", "đạo hàm lượng giác", "toán 11"],
    explanation: "Các quy tắc đạo hàm cơ bản: (x^n)' = n·x^(n-1); (sin x)' = cos x; (cos x)' = -sin x; (e^x)' = e^x; (ln x)' = 1/x. Đạo hàm hàm hợp: [f(u)]' = f'(u) · u'.",
  },
  {
    id: "math-10-01",
    subject: "math",
    grade: 10,
    topic: "Bất đẳng thức AM-GM (Cauchy) cho các số thực không âm",
    sourceBook: "Toán 10 - Cánh Diều - Chuyên đề Bất đẳng thức",
    ruleOrLaw: "Trung bình cộng của n số thực không âm luôn lớn hơn hoặc bằng trung bình nhân của chúng: (a₁ + a₂ + ... + a_n)/n ≥ ⁿ√(a₁a₂...a_n).",
    keywords: ["cauchy", "am-gm", "bất đẳng thức", "cực trị", "giá trị lớn nhất", "nhỏ nhất"],
    explanation: "Dấu đẳng thức xảy ra khi và chỉ khi a₁ = a₂ = ... = a_n. Với 2 số a, b ≥ 0: (a + b)/2 ≥ √(ab), dấu bằng xảy ra khi a = b.",
  },

  // ─── 2. VẬT LÝ (PHYSICS) ───
  {
    id: "phy-10-01",
    subject: "physics",
    grade: 10,
    topic: "Định luật II Newton và Khái niệm Lực quán tính",
    sourceBook: "Vật lý 10 - Kết nối tri thức - Bài 15: Định luật II Newton",
    ruleOrLaw: "Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật: F = m·a.",
    keywords: ["newton", "định luật 2 newton", "f=ma", "gia tốc", "khối lượng", "lực"],
    explanation: "Trong hệ SI, đơn vị của lực là Newton (N): 1 N = 1 kg·m/s². Định luật II là nền tảng của cơ học cổ điển mô tả chuyển động của chất điểm dưới tác dụng của ngoại lực.",
  },
  {
    id: "phy-10-02",
    subject: "physics",
    grade: 10,
    topic: "Định luật Bảo toàn Cơ năng",
    sourceBook: "Vật lý 10 - Cánh Diều - Bài 17: Động năng và Thế năng",
    ruleOrLaw: "Khi một vật chỉ chịu tác dụng của trọng lực hoặc lực đàn hồi (lực thế), cơ năng của vật là một đại lượng bảo toàn: W = Wđ + Wt = const.",
    keywords: ["cơ năng", "động năng", "thế năng", "bảo toàn cơ năng", "1/2mv^2", "mgh"],
    explanation: "Động năng: Wđ = 1/2·m·v². Thế năng trọng trường: Wt = m·g·h. Khi vật rơi tự do, thế năng giảm bao nhiêu thì động năng tăng bấy nhiêu và ngược lại.",
  },
  {
    id: "phy-11-01",
    subject: "physics",
    grade: 11,
    topic: "Hiện tượng Khúc xạ Ánh sáng & Định luật Snell",
    sourceBook: "Vật lý 11 - Kết nối tri thức - Bài 13: Hiện tượng khúc xạ ánh sáng",
    ruleOrLaw: "Tia khúc xạ nằm trong mặt phẳng tới và ở phía bên kia pháp tuyến so với tia tới: n₁·sin(i) = n₂·sin(r).",
    keywords: ["khúc xạ", "ánh sáng", "chiết suất", "snell", "sin i", "sin r", "phản xạ toàn phần"],
    explanation: "Khi ánh sáng truyền từ môi trường có chiết suất n₁ sang môi trường n₂ (n₁ > n₂), nếu góc tới i vượt quá góc giới hạn igh (sin igh = n₂/n₁) thì xảy ra hiện tượng phản xạ toàn phần.",
  },

  // ─── 3. SINH HỌC (BIOLOGY) ───
  {
    id: "bio-10-01",
    subject: "biology",
    grade: 10,
    topic: "Quá trình Quang hợp ở Thực vật (Pha sáng và Pha tối)",
    sourceBook: "Sinh học 10 - Kết nối tri thức - Bài 14: Quang hợp ở thực vật",
    ruleOrLaw: "Quang hợp là quá trình lục lạp hấp thụ năng lượng ánh sáng mặt trời để tổng hợp chất hữu cơ (glucose) từ CO₂ và H₂O, đồng thời giải phóng O₂: 6CO₂ + 12H₂O + Ánh sáng → C₆H₁₂O₆ + 6O₂ + 6H₂O.",
    keywords: ["quang hợp", "pha sáng", "pha tối", "calvin", "lục lạp", "diệp lục", "co2", "o2"],
    explanation: "Pha sáng diễn ra ở màng thylakoid biến quang năng thành hóa năng (ATP, NADPH) và giải phóng O₂ từ quang phân ly nước. Pha tối (chu trình Calvin) diễn ra ở chất nền stroma sử dụng ATP và NADPH để khử CO₂ thành carbohydrate.",
  },
  {
    id: "bio-10-02",
    subject: "biology",
    grade: 10,
    topic: "Cơ chế Nhân đôi ADN (Tái bản theo nguyên tắc bán bảo tồn)",
    sourceBook: "Sinh học 10 - Cánh Diều - Bài 6: Nucleic acid và sự nhân đôi ADN",
    ruleOrLaw: "ADN nhân đôi theo 2 nguyên tắc then chốt: Nguyên tắc bổ sung (A-T, G-X) và Nguyên tắc bán bảo tồn (mỗi phân tử con chứa một mạch cũ và một mạch mới tổng hợp).",
    keywords: ["adn", "nhân đôi", "bán bảo tồn", "nguyên tắc bổ sung", "helicase", "dna polymerase"],
    explanation: "Enzyme DNA polymerase xúc tác kéo dài mạch mới theo chiều 5' → 3'. Mạch khuôn 3' → 5' được tổng hợp liên tục; mạch khuôn 5' → 3' được tổng hợp ngắt quãng tạo các đoạn Okazaki sau đó nối lại nhờ enzyme ligase.",
  },

  // ─── 4. NGỮ VĂN & KHOA HỌC XÃ HỘI (LITERATURE) ───
  {
    id: "lit-12-01",
    subject: "literature",
    grade: 12,
    topic: "Hình tượng người lính Tây Tiến trong thơ Quang Dũng",
    sourceBook: "Ngữ văn 12 - Kết nối tri thức - Bài 1: Vẻ đẹp người lính thời kháng chiến",
    ruleOrLaw: "Bút pháp lãng mạn kết hợp cảm hứng bi tráng khắc họa vẻ đẹp hào hoa, dũng cảm, sẵn sàng hy sinh vì Tổ quốc của đoàn quân Tây Tiến giữa thiên nhiên miền Tây hùng vĩ, dữ dội.",
    keywords: ["tây tiến", "quang dũng", "người lính", "hào hoa", "bi tráng", "ngữ văn 12"],
    explanation: "Nét đặc sắc: Thiên nhiên miền Tây Bắc hiểm trở (Dốc lên khúc khuỷu, dốc thăm thẳm) làm tôn lên ý chí phi thường và nét lãng mạn hào hoa (Mắt trừng gửi mộng qua biên giới / Đêm mơ Hà Nội dáng kiều thơm). Cái chết không bi lụy mà bất tử hóa (Áo bào thay chiếu anh về đất / Sông Mã gầm lên khúc độc hành).",
  },
  {
    id: "lit-12-02",
    subject: "literature",
    grade: 12,
    topic: "Hình tượng Sóng và Khát vọng tình yêu trong thơ Xuân Quỳnh",
    sourceBook: "Ngữ văn 12 - Cánh Diều - Bài 2: Tiếng nói tình yêu và khát vọng",
    ruleOrLaw: "Hình tượng 'sóng' là sự ẩn dụ, hóa thân của cái tôi trữ tình người phụ nữ trong tình yêu: vừa dữ dội vừa dịu êm, vừa bồn chồn nhớ nhung vừa thủy chung, khát khao vươn tới sự vĩnh hằng.",
    keywords: ["sóng", "xuân quỳnh", "tình yêu", "dữ dội", "dịu êm", "nhớ nhung", "thủy chung"],
    explanation: "Cấu trúc tương đồng giữa sóng biển và tâm hồn người phụ nữ: 'Dữ dội và dịu êm / Ồn ào và lặng lẽ'. Khát vọng vượt qua giới hạn thời gian (trăm năm) để hòa vào biển lớn tình yêu nhân loại.",
  },

  // ─── 5. HÓA HỌC & AN TOÀN PHÒNG THÍ NGHIỆM (CHEMISTRY) ───
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
];

/**
 * Thuật toán RAG Tối ưu Token:
 * Tìm kiếm các đoạn SGK chuẩn GDPT 2018 khớp với câu hỏi.
 * Nếu không có chủ đề liên quan trực tiếp, trả về danh sách rỗng [] để tránh làm loãng ngữ cảnh.
 */
export function retrieveSGKKnowledge(query: string, limit = 2): SGKChunk[] {
  if (!query || query.trim().length < 3) return [];

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
      const cleanKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (cleanQ.includes(cleanKw)) {
        score += 5;
      }
    }

    return { chunk, score };
  });

  // Chỉ lấy các kết quả có điểm liên quan thực tế (score >= 4)
  const topResults = scored.filter((s) => s.score >= 4).sort((a, b) => b.score - a.score).slice(0, limit);

  return topResults.map((s) => s.chunk);
}
