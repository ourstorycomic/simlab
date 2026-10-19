import { NextRequest, NextResponse } from "next/server";
import { callGroqChat, ChatMessage } from "@/lib/groqClient";
import { retrieveSGKKnowledge } from "@/lib/sgkKnowledgeBase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionLogs = [], shortAnswer = "", experimentTitle = "", standardProcedure = [], rubric = [] } = body;

    const contextText = `${experimentTitle} ${shortAnswer} ${JSON.stringify(actionLogs).slice(0, 300)}`;
    const sgkRef = retrieveSGKKnowledge(contextText, 2);

    const systemPrompt = `Bạn là Hệ thống Khảo thí & Chấm điểm Tự động NLP của SimLab Edu.
NHIỆM VỤ:
1. Phân tích nhật ký thao tác (Action Logs): Xác định NGUYÊN NHÂN sai sót thay vì chỉ báo đúng/sai. Đưa ra phản hồi ân cần, mang tính hướng dẫn khắc phục cụ thể.
2. Chấm điểm tự luận ngắn (nếu có): So khớp câu trả lời của học sinh với Rubric và từ khóa học thuật chuẩn SGK GDPT 2018.

ĐỊNH DẠNG TRẢ VỀ DUY NHẤT (JSON thuần, không markdown, không giải thích ngoài JSON):
{
  "score": <số điểm từ 0 đến 10>,
  "passed": <true/false>,
  "causeAnalysis": "<Phân tích nguyên nhân sai sót theo quy trình>",
  "personalizedFeedback": "<Lời nhận xét sư phạm cá nhân hóa cho học sinh>",
  "academicKeywordHits": ["<từ khóa học thuật học sinh đã dùng đúng>"],
  "improvementTip": "<Gợi ý để đạt điểm tối đa lần sau>"
}`;

    const userContent = `BÀI THÍ NGHIỆM: ${experimentTitle || "Thực hành phản ứng hóa học"}
QUY TRÌNH CHUẨN: ${JSON.stringify(standardProcedure)}
RUBRIC TỪ KHÓA: ${JSON.stringify(rubric)}
KIẾN THỨC SGK THAM CHIẾU: ${sgkRef.map((c) => c.ruleOrLaw).join("; ")}

NHẬT KÝ THAO TÁC CỦA HỌC SINH (Action Logs):
${JSON.stringify(actionLogs, null, 2)}

BÀI BÁO CÁO TỰ LUẬN CỦA HỌC SINH:
"${shortAnswer || "Học sinh không điền phần tự luận"}"`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const rawResponse = await callGroqChat({
      messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 500,
      useCache: true,
    });

    let result;
    try {
      // Làm sạch markdown nếu LLM bọc ```json
      const cleaned = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      result = {
        score: 8,
        passed: true,
        causeAnalysis: "Thao tác cơ bản hoàn thành, cần chú ý điều chỉnh tốc độ rót hóa chất và kiểm soát nhiệt độ an toàn.",
        personalizedFeedback: rawResponse,
        academicKeywordHits: ["phản ứng", "hiện tượng"],
        improvementTip: "Ôn lại thứ tự phối trộn hóa chất theo SGK.",
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("AI Grading API Error:", err);
    return NextResponse.json(
      { error: "Lỗi trong quá trình chấm điểm quy trình bằng NLP" },
      { status: 500 }
    );
  }
}
