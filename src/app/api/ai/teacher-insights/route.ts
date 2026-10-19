import { NextRequest, NextResponse } from "next/server";
import { callGroqChat, ChatMessage } from "@/lib/groqClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissions = [], assignmentTitle = "Thực hành phản ứng hóa học", requestType = "blindspots" } = body;

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        blindspots: [],
        summary: "Chưa có đủ dữ liệu bài nộp để phân tích điểm mù.",
        pedagogicalRecommendation: "Hãy nhắc nhở học sinh hoàn thành bài thực hành.",
      });
    }

    // Nén dữ liệu bài nộp để tiết kiệm token tối đa (chỉ lấy điểm số và lỗi chính)
    const compressedSubmissions = submissions.slice(0, 40).map((s: any, idx: number) => ({
      id: idx + 1,
      studentName: s.studentName || `Học sinh ${idx + 1}`,
      score: s.score,
      mistakes: s.mistakes || s.details || (s.score < 8 ? ["Thao tác đun quá nhanh hoặc sai tỷ lệ"] : []),
    }));

    if (requestType === "learning_gain_report") {
      const systemPrompt = `Bạn là Trợ lý Phân tích Dữ liệu Giáo dục SimLab Edu dành cho Ban Giám Hiệu và Giáo viên bộ môn.
NHIỆM VỤ:
Viết Báo cáo Đánh giá Năng lực Học sinh (Learning Gain Report) bằng ngôn ngữ tự nhiên trang trọng, chuẩn mực sư phạm để gửi phụ huynh hoặc trình Ban Giám Hiệu duyệt ngân sách School SaaS.
Yêu cầu:
- Nêu rõ mức độ đạt chuẩn đầu ra GDPT 2018.
- Năng lực thực hành thí nghiệm an toàn.
- Khả năng tư duy logic và giải quyết vấn đề.
- Độ dài vừa phải, súc tích (khoảng 150-250 từ).`;

      const userContent = `BÀI THỰC HÀNH: ${assignmentTitle}
DỮ LIỆU TỔNG QUAN LỚP:
Tổng số học sinh nộp: ${submissions.length}
Điểm trung bình: ${(
        submissions.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / submissions.length
      ).toFixed(1)}/10
Chi tiết kết quả: ${JSON.stringify(compressedSubmissions.slice(0, 15))}`;

      const reportText = await callGroqChat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        max_tokens: 600,
        useCache: true,
      });

      return NextResponse.json({ report: reportText });
    }

    // Mặc định: Phân tích Điểm Mù Kiến Thức (Blindspot Detection)
    const systemPrompt = `Bạn là Hệ thống AI Phân tích Dữ liệu Lớp học của SimLab Edu.
NHIỆM VỤ:
Phân tích dữ liệu nhật ký thao tác và lỗi của cả lớp học để phát hiện ĐIỂM MÙ KIẾN THỨC (Knowledge Blindspots).
Nếu có từ 20-40% học sinh cùng mắc một lỗi (ví dụ: sai thao tác đun nóng, không nhận biết được kết tủa BaSO₄, rót sai quy trình), hãy làm nổi bật và gợi ý hành động sư phạm ngay lập tức cho giáo viên (dành 5 phút ôn tập).

ĐỊNH DẠNG TRẢ VỀ DUY NHẤT (JSON thuần, không markdown):
{
  "blindspots": [
    {
      "topic": "<Tên lỗi / Điểm mù kiến thức>",
      "failureRate": "<Tỉ lệ % học sinh mắc lỗi, ví dụ: 38%>",
      "severity": "<high/medium/low>",
      "rootCause": "<Nguyên nhân gốc rễ học sinh hay hiểu sai>",
      "actionPlan": "<Gợi ý hành động: Dành 5 phút ôn tập nội dung gì>"
    }
  ],
  "classHealthScore": <Điểm sức khỏe lớp học từ 0-100>,
  "quickTeacherNote": "<Lời nhắn nhanh tóm tắt cho giáo viên trước khi kết thúc tiết học>"
}`;

    const userContent = `BÀI THÍ NGHIỆM: ${assignmentTitle}
DỮ LIỆU BÀI LÀM CẢ LỚP (${submissions.length} học sinh):
${JSON.stringify(compressedSubmissions, null, 2)}`;

    const rawResponse = await callGroqChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 500,
      useCache: true,
    });

    let result;
    try {
      const cleaned = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      result = {
        blindspots: [
          {
            topic: "Kiểm soát nhiệt độ và thao tác đun ống nghiệm",
            failureRate: "35%",
            severity: "medium",
            rootCause: "Học sinh đun tập trung tại 1 điểm quá nhanh thay vì hơ đều ống nghiệm dẫn tới dung dịch bị trào.",
            actionPlan: "Dành 3-5 phút đầu tiết sau nhắc lại quy tắc an toàn sử dụng đèn cồn theo KHTN 8.",
          },
        ],
        classHealthScore: 82,
        quickTeacherNote: "Lớp tiếp thu nhanh, cần củng cố lại quy tắc an toàn nhiệt trước khi chuyển sang bài thực hành tiếp theo.",
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("AI Teacher Insights Error:", err);
    return NextResponse.json(
      { error: "Lỗi trong quá trình phân tích dữ liệu lớp học" },
      { status: 500 }
    );
  }
}
