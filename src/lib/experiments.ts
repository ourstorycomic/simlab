// ─── Thí nghiệm mẫu (Sample Experiments) ───
// Mỗi thí nghiệm mô tả cách bố trí hóa chất, hiện tượng quan sát được,
// metadata chương trình SGK và bộ câu hỏi đánh giá.

export type QuizQuestion = {
  question: string;
  options: string[];
  /** Chỉ số đáp án đúng (bắt đầu từ 0) */
  correctIndex: number;
  explanation: string;
};

export interface Experiment {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** ID các hóa chất cần cho vào (theo thứ tự) */
  chemicalIds: string[];
  /** Nhãn hiển thị cho từng hóa chất trong hướng dẫn */
  stepLabels: string[];
  /** Hiện tượng mong đợi */
  expected: string;
  /** Ghi chú an toàn / lưu ý */
  note?: string;
  /** Loại hiệu ứng nổi bật để gắn badge */
  badge: "gas" | "precipitate" | "flame" | "color" | "heat";
  /** Môn học */
  subject: "chemistry" | "physics" | "biology";
  // ─── Metadata chương trình (SGK GDPT 2018) ───
  /** Lớp học (8, 9, 10, 11, 12) */
  grade: number;
  /** Tên chương trong SGK */
  chapter: string;
  /** Tên bài học cụ thể */
  lesson: string;
  /** Mục tiêu học tập */
  objectives: string[];
  /** Phương trình hóa học của thí nghiệm (hiển thị dạng chữ) */
  equations: string[];
  /** Giải thích khoa học hiện tượng quan sát */
  theory: string;
  /** Các bước tiến hành chi tiết */
  steps: string[];
  /** Bộ câu hỏi đánh giá sau khi làm thí nghiệm */
  quiz: QuizQuestion[];
}

export const experiments: Experiment[] = [
  // ════════════════════════════════════════════
  // VẬT LÝ (Physics)
  // ════════════════════════════════════════════
  {
    id: "exp-optics-lens",
    name: "Khảo sát thấu kính hội tụ",
    emoji: "🔍",
    subject: "physics",
    description: "Khảo sát sự tạo ảnh của vật qua thấu kính hội tụ, xác định tiêu cự bằng công thức thấu kính mỏng.",
    chemicalIds: ["lens", "screen", "light-source"],
    stepLabels: ["Bố trí giá quang học", "Đặt nguồn sáng", "Di chuyển vật", "Điều chỉnh màn hứng ảnh"],
    expected: "Thu được ảnh rõ nét trên màn, đo d và d' để tính f. Khi d > 2f: ảnh thật, ngược chiều, nhỏ hơn vật.",
    note: "Giữ trục quang học thẳng. Mắt không nhìn trực tiếp vào nguồn sáng.",
    badge: "color",
    grade: 11,
    chapter: "Chương 7: Mắt và các dụng cụ quang học",
    lesson: "Bài 29: Thấu kính mỏng",
    objectives: [
      "Xác định tiêu cự của thấu kính hội tụ bằng thực nghiệm",
      "Vẽ ảnh của vật qua thấu kính ở các vị trí khác nhau",
      "Hiểu mối quan hệ giữa vị trí vật, ảnh và tiêu cự",
    ],
    equations: [
      "Công thức thấu kính: 1/f = 1/d + 1/d'",
      "Độ phóng đại: k = d'/d = -f/(d-f)",
      "Độ tụ: D = 1/f (đơn vị: diop, f tính bằng mét)",
    ],
    theory: "Thấu kính hội tụ làm hội tụ chùm tia sáng song song vào tiêu điểm F. Công thức thấu kính mỏng liên hệ khoảng cách từ vật (d) đến thấu kính, khoảng cách từ ảnh (d') đến thấu kính và tiêu cự f. Dấu của d' xác định ảnh thật (d' > 0) hay ảnh ảo (d' < 0). Khi d > 2f: ảnh thật, ngược chiều, nhỏ hơn vật. Khi f < d < 2f: ảnh thật, ngược chiều, lớn hơn vật. Khi d < f: ảnh ảo, cùng chiều, lớn hơn vật.",
    steps: [
      "Bố trí giá quang học nằm ngang, đặt theo thứ tự: nguồn sáng → vật → thấu kính → màn hứng ảnh.",
      "Đặt vật ở khoảng cách d = 30 cm trước thấu kính (d > 2f với f = 10 cm).",
      "Di chuyển màn hứng ảnh ra xa thấu kính cho đến khi thu được ảnh rõ nét nhất.",
      "Đọc và ghi lại giá trị d (khoảng cách vật–thấu kính) và d' (khoảng cách thấu kính–màn).",
      "Áp dụng công thức 1/f = 1/d + 1/d' để tính tiêu cự f.",
      "Lặp lại thí nghiệm với d = 25 cm, 20 cm, 15 cm. So sánh kết quả.",
    ],
    quiz: [
      {
        question: "Công thức thấu kính mỏng là:",
        options: ["1/f = 1/d - 1/d'", "1/f = 1/d + 1/d'", "f = d × d'", "f = d + d'"],
        correctIndex: 1,
        explanation: "Công thức thấu kính mỏng: 1/f = 1/d + 1/d', trong đó f là tiêu cự, d là khoảng vật, d' là khoảng ảnh.",
      },
      {
        question: "Khi vật đặt ở khoảng cách d > 2f so với thấu kính hội tụ, ảnh thu được có đặc điểm:",
        options: [
          "Ảnh ảo, cùng chiều, lớn hơn vật",
          "Ảnh thật, ngược chiều, nhỏ hơn vật",
          "Ảnh thật, cùng chiều, nhỏ hơn vật",
          "Ảnh ảo, ngược chiều, lớn hơn vật",
        ],
        correctIndex: 1,
        explanation: "Khi d > 2f: cho ảnh thật (hứng được trên màn), ngược chiều và nhỏ hơn vật. Ứng dụng: máy ảnh.",
      },
      {
        question: "Tiêu cự f của thấu kính được tính từ thí nghiệm với d = 30 cm, d' = 15 cm là:",
        options: ["f = 10 cm", "f = 45 cm", "f = 15 cm", "f = 7,5 cm"],
        correctIndex: 0,
        explanation: "1/f = 1/30 + 1/15 = 1/30 + 2/30 = 3/30 = 1/10 → f = 10 cm.",
      },
      {
        question: "Đơn vị của độ tụ (D) là:",
        options: ["Mét (m)", "Diop (dp)", "Héc (Hz)", "Độ (°)"],
        correctIndex: 1,
        explanation: "Độ tụ D = 1/f (f tính bằng mét). Đơn vị là diop (dp). Ví dụ: kính lão +2 dp có f = 0,5 m.",
      },
    ],
  },
  {
    id: "exp-pendulum",
    name: "Con lắc đơn — Chu kỳ dao động",
    emoji: "⏱️",
    subject: "physics",
    description: "Đo chu kỳ dao động của con lắc đơn và kiểm chứng công thức T = 2π√(L/g).",
    chemicalIds: ["pendulum", "ruler", "stopwatch"],
    stepLabels: ["Lắp con lắc", "Đo chiều dài dây", "Thả con lắc", "Bấm giờ chu kỳ"],
    expected: "Chu kỳ T tỉ lệ với căn bậc hai chiều dài dây và không phụ thuộc khối lượng quả nặng.",
    note: "Góc lệch nhỏ (< 10°) để đảm bảo con lắc dao động điều hòa.",
    badge: "color",
    grade: 10,
    chapter: "Chương 3: Dao động cơ",
    lesson: "Bài 11: Con lắc đơn",
    objectives: [
      "Đo chu kỳ dao động của con lắc đơn bằng thực nghiệm",
      "Kiểm chứng công thức chu kỳ con lắc đơn",
      "Xác định gia tốc trọng trường g tại địa phương",
    ],
    equations: [
      "Chu kỳ: T = 2π√(L/g)",
      "Tần số: f = 1/T = (1/2π)√(g/L)",
      "Gia tốc trọng trường: g = 4π²L/T²",
    ],
    theory: "Con lắc đơn là một vật nặng (quả cầu) treo vào một đầu dây nhẹ không co giãn. Khi góc lệch nhỏ (< 10°), con lắc thực hiện dao động điều hòa với chu kỳ T = 2π√(L/g). Đặc điểm quan trọng: chu kỳ phụ thuộc vào chiều dài dây L và gia tốc trọng trường g, nhưng không phụ thuộc vào khối lượng quả nặng và biên độ dao động (khi biên độ nhỏ).",
    steps: [
      "Buộc chặt một đầu dây vào giá đỡ cố định, đầu kia buộc quả nặng.",
      "Đo chính xác chiều dài dây L từ điểm treo đến tâm quả nặng (ví dụ L = 50 cm).",
      "Kéo quả nặng lệch một góc nhỏ (khoảng 5°) rồi thả nhẹ nhàng.",
      "Dùng đồng hồ bấm giây, đo thời gian t cho 20 dao động toàn phần liên tiếp.",
      "Tính chu kỳ: T = t/20. Lặp lại 3 lần, lấy giá trị trung bình.",
      "Thay đổi chiều dài dây (30 cm, 70 cm, 100 cm) và lặp lại. So sánh kết quả.",
      "Tính g = 4π²L/T² và so sánh với g = 9,8 m/s² (giá trị chuẩn tại Việt Nam).",
    ],
    quiz: [
      {
        question: "Chu kỳ dao động của con lắc đơn phụ thuộc vào yếu tố nào?",
        options: [
          "Khối lượng quả nặng",
          "Biên độ dao động (khi lớn)",
          "Chiều dài dây treo",
          "Cả khối lượng và chiều dài dây",
        ],
        correctIndex: 2,
        explanation: "T = 2π√(L/g). Chu kỳ chỉ phụ thuộc L và g, không phụ thuộc khối lượng (khi biên độ nhỏ).",
      },
      {
        question: "Một con lắc đơn dài L = 1 m dao động tại nơi có g = 9,8 m/s². Chu kỳ xấp xỉ là:",
        options: ["T ≈ 1 s", "T ≈ 2 s", "T ≈ 3 s", "T ≈ 0,5 s"],
        correctIndex: 1,
        explanation: "T = 2π√(1/9,8) = 2π × 0,319 ≈ 2,007 ≈ 2 s. Con lắc dài 1 m có chu kỳ xấp xỉ 2 giây.",
      },
      {
        question: "Để chu kỳ con lắc tăng gấp đôi, cần thay đổi chiều dài dây như thế nào?",
        options: ["Tăng gấp đôi (×2)", "Tăng gấp 4 (×4)", "Giảm một nửa (÷2)", "Giữ nguyên"],
        correctIndex: 1,
        explanation: "T ∝ √L. Muốn T' = 2T thì √L' = 2√L → L' = 4L. Cần tăng chiều dài lên gấp 4 lần.",
      },
    ],
  },
  {
    id: "exp-ohm-law",
    name: "Định luật Ohm — Mạch điện",
    emoji: "⚡",
    subject: "physics",
    description: "Khảo sát mối quan hệ giữa hiệu điện thế U, cường độ dòng điện I và điện trở R trong mạch điện một chiều.",
    chemicalIds: ["battery", "resistor", "ammeter", "voltmeter"],
    stepLabels: ["Lắp mạch điện", "Mắc vôn kế", "Mắc ampe kế", "Thay đổi điện trở"],
    expected: "U tỉ lệ thuận với I khi R không đổi. Đồ thị U–I là đường thẳng qua gốc tọa độ.",
    note: "Mắc ampe kế nối tiếp, vôn kế song song. Chú ý chiều dương của dòng điện.",
    badge: "color",
    grade: 9,
    chapter: "Chương 1: Điện học",
    lesson: "Bài 1: Sự phụ thuộc của cường độ dòng điện vào hiệu điện thế giữa hai đầu dây dẫn",
    objectives: [
      "Xác định mối quan hệ U–I qua thực nghiệm",
      "Vẽ đồ thị U–I và xác định điện trở từ đồ thị",
      "Hiểu ý nghĩa và ứng dụng của định luật Ohm",
    ],
    equations: [
      "Định luật Ohm: U = I × R",
      "Điện trở: R = U/I (đơn vị: Ω)",
      "Mạch nối tiếp: R_tổng = R₁ + R₂ + ...",
      "Mạch song song: 1/R_tổng = 1/R₁ + 1/R₂ + ...",
    ],
    theory: "Định luật Ohm phát biểu: Cường độ dòng điện I chạy qua một đoạn mạch tỉ lệ thuận với hiệu điện thế U đặt vào hai đầu đoạn mạch đó và tỉ lệ nghịch với điện trở R của đoạn mạch: I = U/R. Điện trở R đặc trưng cho tính cản trở dòng điện của vật dẫn, phụ thuộc vào vật liệu, chiều dài, tiết diện dây và nhiệt độ.",
    steps: [
      "Lắp mạch điện gồm: nguồn điện → biến trở (R = 10Ω) → ampe kế → trở về nguồn.",
      "Mắc vôn kế song song với hai đầu điện trở cần đo.",
      "Đặt hiệu điện thế U = 2V. Đọc số chỉ ampe kế I₁. Ghi vào bảng.",
      "Tăng dần U: 4V, 6V, 8V, 10V. Ghi lại I tương ứng mỗi lần.",
      "Tính R = U/I cho mỗi cặp giá trị. So sánh kết quả.",
      "Vẽ đồ thị U (trục tung) và I (trục hoành). Nhận xét dạng đồ thị.",
      "Thay điện trở bằng R = 20Ω. Lặp lại và so sánh độ dốc đồ thị.",
    ],
    quiz: [
      {
        question: "Một điện trở R = 5Ω được mắc vào nguồn U = 10V. Cường độ dòng điện là:",
        options: ["I = 0,5 A", "I = 2 A", "I = 50 A", "I = 15 A"],
        correctIndex: 1,
        explanation: "I = U/R = 10/5 = 2 A. Đây là ứng dụng trực tiếp của định luật Ohm.",
      },
      {
        question: "Khi giữ nguyên điện trở, tăng hiệu điện thế lên gấp 3, cường độ dòng điện:",
        options: ["Giảm 3 lần", "Tăng gấp 9 lần", "Tăng gấp 3 lần", "Không thay đổi"],
        correctIndex: 2,
        explanation: "I = U/R. R không đổi, U tăng 3 lần → I tăng 3 lần. Đây là mối quan hệ tuyến tính.",
      },
      {
        question: "Ampe kế và Vôn kế được mắc vào mạch như thế nào?",
        options: [
          "Ampe kế song song, Vôn kế nối tiếp",
          "Ampe kế nối tiếp, Vôn kế song song",
          "Cả hai đều nối tiếp",
          "Cả hai đều song song",
        ],
        correctIndex: 1,
        explanation: "Ampe kế có điện trở rất nhỏ, mắc nối tiếp để đo dòng. Vôn kế có điện trở rất lớn, mắc song song để đo điện áp.",
      },
    ],
  },
  
  {
    id: "exp-mg-hcl",
    name: "Kim loại + Axit (Mg + HCl)",
    emoji: "🔥",
    subject: "chemistry",
    description: "Cho dải Magie (Mg) vào dung dịch axit clohidric (HCl).",
    chemicalIds: ["hcl", "mg"],
    stepLabels: ["Axit Clohidric (HCl)", "Dải Magie (Mg)"],
    expected: "Magie tan dần, sủi bọt khí H₂ mãnh liệt, dung dịch nóng lên.",
    note: "Phản ứng tỏa nhiều nhiệt và thoát khí dễ cháy.",
    badge: "gas",
    grade: 10,
    chapter: "Chương 4: Phản ứng oxi hóa - khử",
    lesson: "Bài 15: Phản ứng oxi hóa - khử",
    objectives: [
      "Quan sát kim loại hoạt động mạnh tác dụng với axit",
      "Xác định sự thay đổi số oxi hóa",
    ],
    equations: ["Mg + 2HCl → MgCl₂ + H₂↑"],
    theory: "Magie là kim loại hoạt động mạnh (đứng trước H trong dãy điện hóa). Mg khử ion H⁺ trong axit thành khí hidro (H₂) và bị oxi hóa thành Mg²⁺.",
    steps: [
      "Cho 5 ml dung dịch HCl vào ống nghiệm.",
      "Thả một dải Magie nhỏ vào ống nghiệm.",
      "Quan sát bọt khí nổi lên mãnh liệt."
    ],
    quiz: [
      {
        question: "Khí thoát ra trong phản ứng này là?",
        options: ["O₂", "CO₂", "Cl₂", "H₂"],
        correctIndex: 3,
        explanation: "Kim loại Mg khử H⁺ thành H₂."
      },
      {
        question: "Trong phản ứng giữa Mg và HCl, chất nào đóng vai trò là chất oxi hóa?",
        options: ["Mg", "HCl", "H₂", "MgCl₂"],
        correctIndex: 1,
        explanation: "Ion H⁺ trong dung dịch HCl nhận electron và bị khử thành H₂. Do đó HCl là chất oxi hóa."
      },
      {
        question: "Dấu hiệu dễ nhận biết nhất khi cho dải Magie vào dung dịch HCl là gì?",
        options: ["Xuất hiện kết tủa trắng", "Dung dịch chuyển sang màu xanh", "Sủi bọt khí mãnh liệt", "Có khói nâu đỏ thoát ra"],
        correctIndex: 2,
        explanation: "Phản ứng giải phóng khí Hidro (H₂) nên tạo ra hiện tượng sủi bọt khí mãnh liệt."
      }
    ]
  },
  {
    id: "exp-hcl-zn",
    name: "Kẽm + Axit Clohidric",
    emoji: "🫧",
    subject: "chemistry",
    description: "Cho kẽm vào dung dịch axit clohidric, quan sát bọt khí thoát ra.",
    chemicalIds: ["hcl", "zn"],
    stepLabels: ["Axit Clohidric (HCl)", "Kẽm (Zn)"],
    expected: "Sủi bọt khí H₂ mạnh, kẽm tan dần. Đưa que đóm đang cháy vào miệng ống nghiệm, khí cháy kèm tiếng nổ nhỏ.",
    note: "Phản ứng tỏa nhiệt. Không chạm tay vào dung dịch axit.",
    badge: "gas",
    grade: 9,
    chapter: "Chương 2: Kim loại",
    lesson: "Bài 16: Tính chất hóa học của kim loại",
    objectives: [
      "Quan sát hiện tượng kim loại tác dụng với dung dịch axit",
      "Viết được phương trình hóa học của phản ứng",
      "Giải thích được vai trò của dãy hoạt động hóa học",
    ],
    equations: ["Zn + 2HCl → ZnCl₂ + H₂↑"],
    theory:
      "Kẽm đứng trước hidro trong dãy hoạt động hóa học nên đẩy được hidro ra khỏi dung dịch axit. Khí H₂ thoát ra tạo bọt khí; đưa que đóm đang cháy vào, khí cháy với ngọn lửa màu xanh nhạt kèm tiếng nổ nhỏ đặc trưng.",
    steps: [
      "Cho khoảng 3 ml dung dịch HCl loãng vào ống nghiệm.",
      "Thả một viên kẽm nhỏ vào ống nghiệm.",
      "Quan sát hiện tượng sủi bọt khí và sự tan dần của kẽm.",
      "Đưa que đóm đang cháy vào miệng ống nghiệm để nhận biết khí H₂.",
    ],
    quiz: [
      {
        question: "Khí thoát ra khi cho Zn vào dung dịch HCl là khí gì?",
        options: ["O₂", "H₂", "CO₂", "Cl₂"],
        correctIndex: 1,
        explanation: "Zn đẩy hidro ra khỏi axit, tạo khí H₂ thoát ra dưới dạng bọt khí.",
      },
      {
        question: "Phản ứng Zn + HCl thuộc loại phản ứng nào?",
        options: ["Phản ứng phân hủy", "Phản ứng hóa hợp", "Phản ứng thế", "Phản ứng trung hòa"],
        correctIndex: 2,
        explanation: "Nguyên tử Zn thay thế nguyên tử H trong HCl, đây là phản ứng thế.",
      },
      {
        question: "Muốn nhận biết khí H₂, ta dùng cách nào?",
        options: [
          "Que đóm còn tàn đỏ — khí làm bùng cháy",
          "Đưa que đóm đang cháy vào — khí cháy kèm tiếng nổ nhỏ",
          "Dung dịch nước vôi trong",
          "Giấy quỳ tím ẩm",
        ],
        correctIndex: 1,
        explanation: "H₂ cháy trong không khí với ngọn lửa xanh nhạt và tiếng nổ nhỏ.",
      },
    ],
  },
  {
    id: "exp-cuso4-naoh",
    name: "Đồng(II) Sunfat + NaOH",
    emoji: "🩵",
    subject: "chemistry",
    description: "Nhỏ dung dịch natri hidroxit vào dung dịch đồng(II) sunfat màu xanh.",
    chemicalIds: ["cuso4", "naoh"],
    stepLabels: ["Đồng(II) Sunfat (CuSO₄)", "Natri Hidroxit (NaOH)"],
    expected: "Xuất hiện kết tủa xanh lam Cu(OH)₂ không tan trong nước.",
    note: "NaOH ăn mòn da, tránh tiếp xúc trực tiếp.",
    badge: "precipitate",
    grade: 9,
    chapter: "Chương 1: Các hợp chất vô cơ",
    lesson: "Bài 8: Một số bazơ quan trọng",
    objectives: [
      "Quan sát phản ứng giữa dung dịch bazơ và dung dịch muối",
      "Viết phương trình hóa học tạo kết tủa",
      "Nhận biết được kết tủa Cu(OH)₂ màu xanh lam",
    ],
    equations: ["2NaOH + CuSO₄ → Na₂SO₄ + Cu(OH)₂↓"],
    theory:
      "Dung dịch muối tác dụng với dung dịch bazơ tạo thành muối mới và bazơ mới. Cu(OH)₂ là bazơ không tan, kết tủa màu xanh lam, là dấu hiệu nhận biết ion Cu²⁺.",
    steps: [
      "Cho khoảng 2 ml dung dịch CuSO₄ vào ống nghiệm.",
      "Nhỏ từ từ dung dịch NaOH vào.",
      "Quan sát kết tủa xanh lam xuất hiện.",
    ],
    quiz: [
      {
        question: "Kết tủa tạo thành trong thí nghiệm có màu gì?",
        options: ["Trắng", "Vàng", "Xanh lam", "Đỏ nâu"],
        correctIndex: 2,
        explanation: "Cu(OH)₂ là bazơ không tan có màu xanh lam đặc trưng.",
      },
      {
        question: "Công thức của kết tủa tạo thành là gì?",
        options: ["NaOH", "Na₂SO₄", "Cu(OH)₂", "CuO"],
        correctIndex: 2,
        explanation: "2NaOH + CuSO₄ → Na₂SO₄ + Cu(OH)₂↓, kết tủa là Cu(OH)₂.",
      },
    ],
  },
  {
    id: "exp-caco3-hcl",
    name: "Đá vôi + Axit Clohidric",
    emoji: "💨",
    subject: "chemistry",
    description: "Cho mẩu đá vôi (CaCO₃) vào dung dịch axit clohidric.",
    chemicalIds: ["caco3", "hcl"],
    stepLabels: ["Canxi Cacbonat (CaCO₃)", "Axit Clohidric (HCl)"],
    expected: "Sủi bọt khí CO₂ mạnh, mẩu đá vôi tan dần.",
    note: "Khí CO₂ làm đục nước vôi trong — dùng để nhận biết.",
    badge: "gas",
    grade: 9,
    chapter: "Chương 1: Các hợp chất vô cơ",
    lesson: "Bài 4: Một số axit quan trọng",
    objectives: [
      "Quan sát phản ứng của muối cacbonat với axit",
      "Nhận biết khí CO₂ bằng nước vôi trong",
      "Viết phương trình hóa học của phản ứng",
    ],
    equations: ["CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O"],
    theory:
      "Muối cacbonat tác dụng với axit mạnh giải phóng khí CO₂. Khí CO₂ làm đục nước vôi trong vì tạo kết tủa CaCO₃ không tan.",
    steps: [
      "Cho một mẩu đá vôi nhỏ vào ống nghiệm.",
      "Nhỏ từ từ dung dịch HCl vào.",
      "Quan sát bọt khí và sự tan dần của đá vôi.",
      "Dẫn khí qua nước vôi trong để nhận biết CO₂.",
    ],
    quiz: [
      {
        question: "Khí sinh ra khi cho CaCO₃ tác dụng với HCl là gì?",
        options: ["H₂", "O₂", "CO₂", "Cl₂"],
        correctIndex: 2,
        explanation: "Muối cacbonat + axit → muối mới + CO₂↑ + H₂O.",
      },
      {
        question: "Khí CO₂ được nhận biết bằng cách nào?",
        options: [
          "Que đóm bùng cháy",
          "Làm đục nước vôi trong",
          "Cháy với tiếng nổ",
          "Làm quỳ tím hóa đỏ",
        ],
        correctIndex: 1,
        explanation: "CO₂ + Ca(OH)₂ → CaCO₃↓ (trắng đục) + H₂O.",
      },
    ],
  },
  {
    id: "exp-agno3-nacl",
    name: "Bạc Nitrat + Natri Clorua",
    emoji: "🤍",
    subject: "chemistry",
    description: "Nhỏ dung dịch bạc nitrat vào dung dịch natri clorua.",
    chemicalIds: ["agno3", "nacl"],
    stepLabels: ["Bạc Nitrat (AgNO₃)", "Natri Clorua (NaCl)"],
    expected: "Xuất hiện kết tủa trắng AgCl, không tan trong axit.",
    note: "Dùng để nhận biết ion clorua Cl⁻.",
    badge: "precipitate",
    grade: 9,
    chapter: "Chương 1: Các hợp chất vô cơ",
    lesson: "Bài 9: Tính chất hóa học của muối",
    objectives: [
      "Quan sát phản ứng trao đổi tạo kết tủa",
      "Nhận biết ion clorua bằng AgNO₃",
      "Viết phương trình ion rút gọn",
    ],
    equations: ["AgNO₃ + NaCl → AgCl↓ + NaNO₃"],
    theory:
      "Dung dịch muối tác dụng với dung dịch muối tạo hai muối mới. AgCl là kết tủa trắng không tan trong nước và không tan trong axit — dùng để nhận biết ion Cl⁻.",
    steps: [
      "Cho khoảng 2 ml dung dịch NaCl vào ống nghiệm.",
      "Nhỏ vài giọt dung dịch AgNO₃.",
      "Quan sát kết tủa trắng AgCl xuất hiện.",
    ],
    quiz: [
      {
        question: "Kết tủa AgCl có đặc điểm gì?",
        options: [
          "Màu vàng, tan trong axit",
          "Màu trắng, không tan trong axit",
          "Màu xanh, tan trong nước",
          "Màu đỏ nâu",
        ],
        correctIndex: 1,
        explanation: "AgCl kết tủa trắng, không tan trong nước và không tan trong axit.",
      },
      {
        question: "Thuốc thử dùng để nhận biết ion Cl⁻ là gì?",
        options: ["NaOH", "CuSO₄", "AgNO₃", "BaCl₂"],
        correctIndex: 2,
        explanation: "AgNO₃ tạo kết tủa trắng AgCl với ion Cl⁻.",
      },
    ],
  },
  {
    id: "exp-bacl2-na2so4",
    name: "Bari Clorua + Natri Sunfat",
    emoji: "⚪",
    subject: "chemistry",
    description: "Nhỏ dung dịch bari clorua vào dung dịch natri sunfat.",
    chemicalIds: ["bacl2", "na2so4"],
    stepLabels: ["Bari Clorua (BaCl₂)", "Natri Sunfat (Na₂SO₄)"],
    expected: "Xuất hiện kết tủa trắng BaSO₄ không tan trong axit.",
    note: "Dùng để nhận biết ion sunfat SO₄²⁻.",
    badge: "precipitate",
    grade: 9,
    chapter: "Chương 1: Các hợp chất vô cơ",
    lesson: "Bài 9: Tính chất hóa học của muối",
    objectives: [
      "Quan sát phản ứng tạo kết tủa BaSO₄",
      "Nhận biết ion sunfat bằng dung dịch muối bari",
    ],
    equations: ["BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl"],
    theory:
      "Ion Ba²⁺ kết hợp với ion SO₄²⁻ tạo kết tủa trắng BaSO₄ không tan trong nước và axit — phản ứng dùng để nhận biết ion sunfat.",
    steps: [
      "Cho khoảng 2 ml dung dịch Na₂SO₄ vào ống nghiệm.",
      "Nhỏ vài giọt dung dịch BaCl₂.",
      "Quan sát kết tủa trắng BaSO₄ xuất hiện.",
    ],
    quiz: [
      {
        question: "Kết tủa trắng tạo thành có công thức là gì?",
        options: ["BaCl₂", "Na₂SO₄", "BaSO₄", "NaCl"],
        correctIndex: 2,
        explanation: "Ba²⁺ + SO₄²⁻ → BaSO₄↓ (trắng, không tan).",
      },
      {
        question: "Dung dịch nào dùng để nhận biết ion SO₄²⁻?",
        options: ["AgNO₃", "NaOH", "CuSO₄", "BaCl₂"],
        correctIndex: 3,
        explanation: "BaCl₂ tạo kết tủa trắng BaSO₄ với ion SO₄²⁻.",
      },
    ],
  },
  {
    id: "exp-feso4-kmno4",
    name: "FeSO₄ + KMnO₄ trong H₂SO₄",
    emoji: "🟣",
    subject: "chemistry",
    description: "Nhỏ dung dịch KMnO₄ loãng vào dung dịch FeSO₄ có mặt H₂SO₄.",
    chemicalIds: ["feso4", "kmno4"],
    stepLabels: ["Sắt(II) Sunfat (FeSO₄)", "Kali Pemanganat (KMnO₄)"],
    expected: "Màu tím của KMnO₄ nhạt dần — chứng tỏ Fe²⁺ bị oxi hóa thành Fe³⁺.",
    note: "Phản ứng oxi hóa khử cần môi trường axit (H₂SO₄).",
    badge: "color",
    grade: 10,
    chapter: "Chương 4: Phản ứng oxi hóa – khử",
    lesson: "Bài 15: Phản ứng oxi hóa – khử",
    objectives: [
      "Nhận biết chất khử, chất oxi hóa trong phản ứng",
      "Quan sát sự thay đổi màu của KMnO₄ trong môi trường axit",
      "Hiểu vai trò của môi trường axit trong phản ứng",
    ],
    equations: ["2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O"],
    theory:
      "Trong môi trường axit, ion MnO₄⁻ (màu tím) bị khử thành Mn²⁺ (không màu) đồng thời Fe²⁺ bị oxi hóa thành Fe³⁺. Màu tím nhạt dần chứng tỏ phản ứng oxi hóa – khử đã xảy ra.",
    steps: [
      "Cho khoảng 2 ml dung dịch FeSO₄ và vài giọt H₂SO₄ loãng vào ống nghiệm.",
      "Nhỏ từ từ dung dịch KMnO₄ loãng.",
      "Quan sát màu tím nhạt dần đến khi mất màu.",
    ],
    quiz: [
      {
        question: "Trong phản ứng trên, Fe²⁺ đóng vai trò gì?",
        options: ["Chất oxi hóa", "Chất khử", "Chất xúc tác", "Môi trường"],
        correctIndex: 1,
        explanation: "Fe²⁺ nhường electron (bị oxi hóa thành Fe³⁺) nên là chất khử.",
      },
      {
        question: "Màu tím của KMnO₄ nhạt dần vì sao?",
        options: [
          "MnO₄⁻ bị khử thành Mn²⁺ không màu",
          "KMnO₄ bị pha loãng",
          "H₂SO₄ làm mất màu",
          "FeSO₄ kết tủa",
        ],
        correctIndex: 0,
        explanation: "Ion MnO₄⁻ màu tím nhận electron chuyển thành Mn²⁺ không màu.",
      },
    ],
  },
  {
    id: "exp-fecl3-kscn",
    name: "Sắt(III) + KSCN",
    emoji: "🔴",
    subject: "chemistry",
    description: "Nhỏ dung dịch kali thioxyanat vào dung dịch sắt(III) clorua.",
    chemicalIds: ["fecl3", "kscn"],
    stepLabels: ["Sắt(III) Clorua (FeCl₃)", "Kali Thioxyanat (KSCN)"],
    expected: "Dung dịch chuyển sang màu đỏ máu do tạo phức [Fe(SCN)]²⁺.",
    note: "Phản ứng đặc trưng dùng để nhận biết ion Fe³⁺.",
    badge: "color",
    grade: 12,
    chapter: "Chương 7: Sắt và một số kim loại quan trọng",
    lesson: "Bài 25: Sắt và hợp chất của sắt",
    objectives: [
      "Quan sát phản ứng tạo phức đặc trưng của Fe³⁺",
      "Nhận biết ion Fe³⁺ bằng dung dịch KSCN",
    ],
    equations: ["FeCl₃ + 3KSCN → [Fe(SCN)₃] (đỏ máu) + 3KCl"],
    theory:
      "Ion Fe³⁺ tác dụng với ion SCN⁻ tạo phức [Fe(SCN)]²⁺ (hoặc Fe(SCN)₃) có màu đỏ máu. Đây là phản ứng đặc trưng dùng để nhận biết ion Fe³⁺.",
    steps: [
      "Cho khoảng 2 ml dung dịch FeCl₃ vào ống nghiệm.",
      "Nhỏ vài giọt dung dịch KSCN.",
      "Quan sát dung dịch chuyển sang màu đỏ máu.",
    ],
    quiz: [
      {
        question: "Dung dịch KSCN dùng để nhận biết ion nào?",
        options: ["Fe²⁺", "Fe³⁺", "Cu²⁺", "Al³⁺"],
        correctIndex: 1,
        explanation: "Fe³⁺ + SCN⁻ tạo phức đỏ máu — phản ứng đặc trưng của Fe³⁺.",
      },
      {
        question: "Hiện tượng quan sát được khi nhỏ KSCN vào FeCl₃ là gì?",
        options: [
          "Kết tủa trắng",
          "Sủi bọt khí",
          "Dung dịch chuyển màu đỏ máu",
          "Không có hiện tượng",
        ],
        correctIndex: 2,
        explanation: "Tạo phức [Fe(SCN)]²⁺ màu đỏ máu đặc trưng.",
      },
    ],
  },
  {
    id: "exp-pbno32-ki",
    name: "Chì(II) Nitrat + Kali Iodua",
    emoji: "🟡",
    subject: "chemistry",
    description: "Nhỏ dung dịch kali iodua vào dung dịch chì(II) nitrat.",
    chemicalIds: ["pbno32", "ki"],
    stepLabels: ["Chì(II) Nitrat (Pb(NO₃)₂)", "Kali Iodua (KI)"],
    expected: "Xuất hiện kết tủa vàng tươi PbI₂.",
    note: "Hợp chất chì độc — rửa tay sau khi thao tác.",
    badge: "precipitate",
    grade: 10,
    chapter: "Chương 5: Nhóm halogen",
    lesson: "Bài 22: Clo và hợp chất của clo",
    objectives: [
      "Quan sát phản ứng tạo kết tủa vàng PbI₂",
      "Nhận biết ion I⁻ bằng dung dịch muối chì",
    ],
    equations: ["Pb(NO₃)₂ + 2KI → PbI₂↓ (vàng) + 2KNO₃"],
    theory:
      "Ion Pb²⁺ kết hợp với ion I⁻ tạo kết tủa PbI₂ màu vàng tươi — dùng để nhận biết ion I⁻.",
    steps: [
      "Cho khoảng 2 ml dung dịch Pb(NO₃)₂ vào ống nghiệm.",
      "Nhỏ vài giọt dung dịch KI.",
      "Quan sát kết tủa vàng tươi PbI₂ xuất hiện.",
    ],
    quiz: [
      {
        question: "Kết tủa PbI₂ có màu gì?",
        options: ["Trắng", "Xanh lam", "Vàng tươi", "Đỏ nâu"],
        correctIndex: 2,
        explanation: "PbI₂ là kết tủa màu vàng tươi đặc trưng.",
      },
      {
        question: "Thí nghiệm này dùng để nhận biết ion nào?",
        options: ["Cl⁻", "SO₄²⁻", "I⁻", "CO₃²⁻"],
        correctIndex: 2,
        explanation: "Ion I⁻ tạo kết tủa vàng PbI₂ với Pb²⁺.",
      },
    ],
  },
  {
    id: "exp-h2o2-mno2",
    name: "Điều chế Oxi từ H₂O₂",
    emoji: "🫧",
    subject: "chemistry",
    description: "Cho mangan dioxit (chất xúc tác) vào dung dịch hidro peroxit.",
    chemicalIds: ["h2o2", "mno2"],
    stepLabels: ["Hidro Peroxit (H₂O₂)", "Mangan Dioxit (MnO₂)"],
    expected: "Sủi bọt khí O₂ mạnh. Que đóm còn tàn đỏ bùng cháy — nhận biết O₂.",
    note: "MnO₂ đóng vai trò chất xúc tác, không bị biến đổi sau phản ứng.",
    badge: "gas",
    grade: 8,
    chapter: "Chương 4: Oxi – Không khí",
    lesson: "Bài 24: Tính chất của oxi",
    objectives: [
      "Điều chế khí oxi trong phòng thí nghiệm",
      "Nhận biết khí oxi bằng que đóm còn tàn đỏ",
      "Hiểu vai trò của chất xúc tác",
    ],
    equations: ["2H₂O₂ →(MnO₂) 2H₂O + O₂↑"],
    theory:
      "Hidro peroxit phân hủy chậm thành nước và oxi. MnO₂ làm tăng tốc độ phân hủy nhưng không bị biến đổi sau phản ứng nên là chất xúc tác. Que đóm còn tàn đỏ bùng cháy là cách nhận biết khí O₂.",
    steps: [
      "Cho khoảng 3 ml dung dịch H₂O₂ vào ống nghiệm.",
      "Thêm một ít bột MnO₂.",
      "Quan sát bọt khí O₂ thoát ra mạnh.",
      "Đưa que đóm còn tàn đỏ vào miệng ống nghiệm — que bùng cháy.",
    ],
    quiz: [
      {
        question: "Trong thí nghiệm này, MnO₂ đóng vai trò gì?",
        options: ["Chất tham gia", "Chất xúc tác", "Sản phẩm", "Chất oxi hóa"],
        correctIndex: 1,
        explanation: "MnO₂ làm tăng tốc độ phản ứng nhưng không bị biến đổi — chất xúc tác.",
      },
      {
        question: "Nhận biết khí O₂ bằng cách nào?",
        options: [
          "Que đóm còn tàn đỏ bùng cháy",
          "Làm đục nước vôi trong",
          "Cháy với tiếng nổ",
          "Làm quỳ tím hóa xanh",
        ],
        correctIndex: 0,
        explanation: "O₂ duy trì sự cháy — que đóm tàn đỏ bùng cháy.",
      },
    ],
  },
  {
    id: "exp-etanol-heat",
    name: "Đốt cháy Etanol",
    emoji: "🔥",
    subject: "chemistry",
    description: "Cho etanol vào ống nghiệm rồi dùng đèn cồn đốt nóng.",
    chemicalIds: ["etanol"],
    stepLabels: ["Etanol (C₂H₅OH)"],
    expected: "Etanol cháy với ngọn lửa màu xanh, tỏa nhiều nhiệt.",
    note: "Etanol dễ cháy — tránh xa nguồn lửa khi chưa đốt nóng.",
    badge: "flame",
    grade: 9,
    chapter: "Chương 5: Dẫn xuất của hidrocacbon",
    lesson: "Bài 44: Rượu etylic",
    objectives: [
      "Quan sát sự cháy của rượu etylic",
      "Viết phương trình đốt cháy etanol",
      "Nêu ứng dụng của etanol làm nhiên liệu",
    ],
    equations: ["C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O + Q"],
    theory:
      "Etanol là chất lỏng dễ cháy, khi cháy tỏa nhiều nhiệt, ngọn lửa màu xanh, sản phẩm là CO₂ và H₂O. Vì dễ cháy nên etanol được dùng làm nhiên liệu (xăng sinh học E5).",
    steps: [
      "Cho khoảng 1 ml etanol vào chén sứ nhỏ.",
      "Dùng đèn cồn đốt nóng (bấm nút Đốt nóng).",
      "Quan sát ngọn lửa màu xanh và nhiệt tỏa ra.",
    ],
    quiz: [
      {
        question: "Sản phẩm của phản ứng đốt cháy etanol gồm những chất nào?",
        options: [
          "CO và H₂O",
          "CO₂ và H₂O",
          "C và H₂O",
          "CO₂ và H₂",
        ],
        correctIndex: 1,
        explanation: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O.",
      },
      {
        question: "Vì sao etanol được dùng làm nhiên liệu?",
        options: [
          "Dễ cháy, tỏa nhiều nhiệt",
          "Không cháy",
          "Rẻ hơn nước",
          "Có màu xanh",
        ],
        correctIndex: 0,
        explanation: "Etanol cháy dễ, tỏa nhiệt lớn nên dùng trong xăng sinh học.",
      },
    ],
  },
  {
    id: "exp-mg-burn",
    name: "Đốt cháy Magie",
    emoji: "✨",
    subject: "chemistry",
    description: "Đưa dải magie vào ngọn lửa đèn cồn.",
    chemicalIds: ["mg"],
    stepLabels: ["Magie (Mg)"],
    expected: "Magie cháy sáng chói với ngọn lửa trắng, tạo chất bột trắng MgO.",
    note: "Không nhìn trực tiếp vào ngọn lửa magie cháy để tránh hại mắt.",
    badge: "flame",
    grade: 8,
    chapter: "Chương 4: Oxi – Không khí",
    lesson: "Bài 24: Tính chất của oxi",
    objectives: [
      "Quan sát sự cháy sáng chói của magie trong oxi",
      "Viết phương trình hóa học tạo MgO",
    ],
    equations: ["2Mg + O₂ → 2MgO"],
    theory:
      "Magie cháy trong oxi với ngọn lửa trắng sáng chói, tạo magie oxit MgO (bột trắng). Phản ứng tỏa nhiều nhiệt và ánh sáng.",
    steps: [
      "Kẹp dải magie bằng kẹp sắt.",
      "Đưa vào ngọn lửa đèn cồn (bấm nút Đốt nóng).",
      "Quan sát ngọn lửa trắng sáng chói và chất bột trắng tạo thành.",
    ],
    quiz: [
      {
        question: "Sản phẩm của phản ứng đốt cháy magie là gì?",
        options: ["Mg(OH)₂", "MgO", "MgCl₂", "MgCO₃"],
        correctIndex: 1,
        explanation: "2Mg + O₂ → 2MgO, MgO là bột trắng.",
      },
      {
        question: "Hiện tượng đặc trưng khi magie cháy là gì?",
        options: [
          "Ngọn lửa màu xanh",
          "Sáng chói, ngọn lửa trắng",
          "Sủi bọt khí",
          "Kết tủa vàng",
        ],
        correctIndex: 1,
        explanation: "Mg cháy sáng chói với ngọn lửa trắng đặc trưng.",
      },
    ],
  },
  {
    id: "exp-quytim-naoh",
    name: "Quỳ tím + NaOH",
    emoji: "💙",
    subject: "chemistry",
    description: "Nhúng giấy quỳ tím vào dung dịch natri hidroxit.",
    chemicalIds: ["quytim", "naoh"],
    stepLabels: ["Giấy Quỳ Tím", "Natri Hidroxit (NaOH)"],
    expected: "Giấy quỳ tím chuyển sang màu xanh — chứng tỏ dung dịch có tính bazơ.",
    note: "NaOH ăn mòn da.",
    badge: "color",
    grade: 8,
    chapter: "Chương 1: Chất – Nguyên tử – Phân tử",
    lesson: "Bài 4: Nguyên tử",
    objectives: [
      "Nhận biết dung dịch bazơ bằng giấy quỳ tím",
      "Phân biệt tính chất của dung dịch bazơ",
    ],
    equations: ["NaOH → Na⁺ + OH⁻ (phân li trong nước)"],
    theory:
      "Dung dịch bazơ làm quỳ tím chuyển sang màu xanh do có chứa ion OH⁻. Đây là cách đơn giản nhất để nhận biết dung dịch bazơ.",
    steps: [
      "Cho khoảng 2 ml dung dịch NaOH vào ống nghiệm.",
      "Nhúng giấy quỳ tím vào dung dịch.",
      "Quan sát quỳ tím chuyển sang màu xanh.",
    ],
    quiz: [
      {
        question: "Dung dịch bazơ làm quỳ tím chuyển màu gì?",
        options: ["Đỏ", "Xanh", "Không đổi màu", "Vàng"],
        correctIndex: 1,
        explanation: "Bazơ làm quỳ tím hóa xanh do có ion OH⁻.",
      },
      {
        question: "Dung dịch NaOH có môi trường gì?",
        options: ["Axit", "Trung tính", "Bazơ", "Lưỡng tính"],
        correctIndex: 2,
        explanation: "NaOH phân li tạo OH⁻ nên có môi trường bazơ.",
      },
    ],
  },
  {
    id: "exp-nh3-hcl",
    name: "Amoniac + Axit Clohidric",
    emoji: "☁️",
    subject: "chemistry",
    description: "Trộn dung dịch amoniac với dung dịch axit clohidric.",
    chemicalIds: ["nh3", "hcl"],
    stepLabels: ["Amoniac (NH₃)", "Axit Clohidric (HCl)"],
    expected: "Tạo thành khói trắng NH₄Cl (amoni clorua) — dùng nhận biết NH₃.",
    note: "Amoniac có mùi khai, gây cay mắt — thao tác nhẹ nhàng.",
    badge: "gas",
    grade: 11,
    chapter: "Chương 2: Nitơ – Photpho",
    lesson: "Bài 8: Amoniac và muối amoni",
    objectives: [
      "Quan sát phản ứng giữa NH₃ và HCl tạo khói trắng",
      "Nhận biết khí NH₃ bằng HCl đặc",
    ],
    equations: ["NH₃ + HCl → NH₄Cl"],
    theory:
      "Khí NH₃ tác dụng với khí HCl tạo amoni clorua NH₄Cl — các hạt tinh thể nhỏ li ti bay trong không khí tạo thành khói trắng. Phản ứng dùng để nhận biết khí NH₃.",
    steps: [
      "Cho dung dịch NH₃ vào ống nghiệm.",
      "Nhỏ vài giọt dung dịch HCl đặc gần miệng ống.",
      "Quan sát khói trắng NH₄Cl hình thành.",
    ],
    quiz: [
      {
        question: "Hiện tượng khi trộn NH₃ và HCl là gì?",
        options: ["Kết tủa vàng", "Khói trắng NH₄Cl", "Ngọn lửa xanh", "Sủi bọt mạnh"],
        correctIndex: 1,
        explanation: "NH₃ + HCl → NH₄Cl, tinh thể nhỏ li ti tạo khói trắng.",
      },
      {
        question: "NH₃ có tính chất gì nổi bật?",
        options: ["Tính axit", "Tính bazơ yếu", "Tính oxi hóa mạnh", "Không phản ứng"],
        correctIndex: 1,
        explanation: "NH₃ là bazơ yếu, tác dụng với axit tạo muối amoni.",
      },
    ],
  },
  {
    id: "exp-fe-cuso4",
    name: "Sắt + Đồng(II) Sunfat",
    emoji: "🟠",
    subject: "chemistry",
    description: "Thả đinh sắt vào dung dịch đồng(II) sunfat màu xanh.",
    chemicalIds: ["fe", "cuso4"],
    stepLabels: ["Sắt (Fe)", "Đồng(II) Sunfat (CuSO₄)"],
    expected: "Sắt tan dần, màu xanh của dung dịch nhạt đi, đồng đỏ bám trên đinh sắt.",
    note: "Phản ứng thế: Fe hoạt động hơn Cu.",
    badge: "precipitate",
    grade: 9,
    chapter: "Chương 2: Kim loại",
    lesson: "Bài 17: Dãy hoạt động hóa học của kim loại",
    objectives: [
      "Quan sát kim loại hoạt động hơn đẩy kim loại yếu hơn ra khỏi dung dịch muối",
      "So sánh mức độ hoạt động của Fe và Cu",
    ],
    equations: ["Fe + CuSO₄ → FeSO₄ + Cu↓"],
    theory:
      "Sắt đứng trước đồng trong dãy hoạt động hóa học nên đẩy đồng ra khỏi dung dịch muối. Đồng màu đỏ bám trên đinh sắt, dung dịch nhạt màu dần do tạo FeSO₄.",
    steps: [
      "Cho khoảng 3 ml dung dịch CuSO₄ vào ống nghiệm.",
      "Thả đinh sắt sạch vào.",
      "Để một lúc, quan sát đồng đỏ bám trên đinh sắt và màu xanh nhạt dần.",
    ],
    quiz: [
      {
        question: "Hiện tượng quan sát được khi cho Fe vào CuSO₄ là gì?",
        options: [
          "Kết tủa trắng xuất hiện",
          "Đồng đỏ bám trên đinh sắt, dung dịch nhạt màu",
          "Sủi bọt khí mạnh",
          "Dung dịch chuyển màu đỏ máu",
        ],
        correctIndex: 1,
        explanation: "Fe + CuSO₄ → FeSO₄ + Cu↓, đồng đỏ bám trên đinh sắt.",
      },
      {
        question: "So sánh mức độ hoạt động của Fe và Cu?",
        options: [
          "Cu hoạt động hơn Fe",
          "Fe hoạt động hơn Cu",
          "Bằng nhau",
          "Không so sánh được",
        ],
        correctIndex: 1,
        explanation: "Fe đứng trước Cu trong dãy hoạt động hóa học.",
      },
    ],
  },
  {
    id: "exp-caco3-heat",
    name: "Nhiệt phân CaCO₃",
    emoji: "🔥",
    subject: "chemistry",
    description: "Nung nóng canxi cacbonat ở nhiệt độ cao.",
    chemicalIds: ["caco3"],
    stepLabels: ["Canxi Cacbonat (CaCO₃)"],
    expected: "CaCO₃ phân hủy thành CaO và khí CO₂.",
    note: "Phản ứng thu nhiệt, cần đốt nóng lâu.",
    badge: "heat",
    grade: 9,
    chapter: "Chương 3: Phi kim – Sơ lược về bảng tuần hoàn",
    lesson: "Bài 30: Silic và hợp chất của silic",
    objectives: [
      "Quan sát phản ứng nhiệt phân muối cacbonat",
      "Hiểu ứng dụng của CaCO₃ trong sản xuất vôi",
    ],
    equations: ["CaCO₃ →(t°) CaO + CO₂↑"],
    theory:
      "Canxi cacbonat bị phân hủy ở nhiệt độ cao (~900°C) tạo canxi oxit (vôi sống) và khí CO₂. Đây là phản ứng quan trọng trong công nghiệp sản xuất vôi.",
    steps: [
      "Cho một lượng CaCO₃ vào ống nghiệm.",
      "Đốt nóng mạnh (bấm nút Đốt nóng).",
      "Quan sát sự phân hủy thành vôi sống CaO.",
    ],
    quiz: [
      {
        question: "Nhiệt phân CaCO₃ tạo ra những sản phẩm nào?",
        options: ["CaO và CO₂", "Ca và O₂", "Ca(OH)₂ và CO₂", "CaCl₂ và H₂O"],
        correctIndex: 0,
        explanation: "CaCO₃ →(t°) CaO + CO₂↑.",
      },
      {
        question: "Phản ứng nhiệt phân CaCO₃ thuộc loại phản ứng nào?",
        options: ["Hóa hợp", "Phân hủy", "Thế", "Trao đổi"],
        correctIndex: 1,
        explanation: "Một chất phân hủy thành hai chất — phản ứng phân hủy.",
      },
    ],
  },
  {
    id: "exp-iot-tinhbot",
    name: "Nhận biết Hồ tinh bột",
    emoji: "🍠",
    subject: "chemistry",
    description: "Dùng dung dịch iot để nhận biết hồ tinh bột.",
    chemicalIds: ["i2", "tinh_bot"],
    stepLabels: ["Iot (I₂)", "Hồ tinh bột"],
    expected: "Dung dịch chuyển sang màu xanh tím đặc trưng.",
    note: "Phản ứng rất nhạy, có thể dùng để nhận biết một lượng nhỏ tinh bột hoặc iot.",
    badge: "color",
    grade: 9,
    chapter: "Chương 4: Hiđrocacbon. Nhiên liệu",
    lesson: "Bài 52: Tinh bột và xenlulozơ",
    objectives: [
      "Thực hiện phản ứng nhận biết tinh bột",
      "Quan sát sự thay đổi màu sắc đặc trưng",
    ],
    equations: ["I₂ + Tinh bột → Hợp chất màu xanh tím"],
    theory:
      "Tinh bột có cấu trúc xoắn lò xo. Các phân tử iot chui vào trong ống lò xo này tạo thành hợp chất màu xanh tím. Khi đun nóng, lò xo duỗi ra, iot thoát ra làm mất màu xanh. Để nguội màu xanh lại xuất hiện.",
    steps: [
      "Cho một ít hồ tinh bột vào ống nghiệm.",
      "Nhỏ vài giọt dung dịch iot vào ống nghiệm.",
      "Quan sát sự xuất hiện màu xanh tím.",
    ],
    quiz: [
      {
        question: "Hiện tượng khi nhỏ dung dịch iot vào hồ tinh bột là gì?",
        options: ["Sủi bọt khí", "Xuất hiện màu xanh tím", "Kết tủa trắng", "Không có hiện tượng"],
        correctIndex: 1,
        explanation: "Iot tạo hợp chất màu xanh tím với tinh bột.",
      },
      {
        question: "Có thể dùng iot để phân biệt chất nào sau đây?",
        options: ["Glucozơ", "Rượu etylic", "Tinh bột", "Axit axetic"],
        correctIndex: 2,
        explanation: "Chỉ có tinh bột mới có phản ứng tạo màu xanh tím với iot.",
      },
    ],
  },
];
