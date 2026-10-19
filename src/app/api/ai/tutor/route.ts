import { NextRequest, NextResponse } from "next/server";
import { callGroqChat, ChatMessage } from "@/lib/groqClient";
import { retrieveSGKKnowledge } from "@/lib/sgkKnowledgeBase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, labContext, history = [] } = body;

    if (!query && !labContext?.recentMistake) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi hoặc thao tác" }, { status: 400 });
    }

    const searchQuery = `${query || ""} ${labContext?.chemical1?.name || ""} ${labContext?.chemical2?.name || ""} ${
      labContext?.recentMistake || ""
    } ${labContext?.reactionResult?.phenomenon || ""}`;

    // 1. RAG: Lấy 1-2 đoạn chuẩn SGK GDPT 2018 liên quan nhất (Siêu tiết kiệm token)
    const sgkChunks = retrieveSGKKnowledge(searchQuery, 2);

    const sgkSnippets = sgkChunks
      .map((c) => `[${c.sourceBook}]: ${c.ruleOrLaw}. Hiện tượng/Giải thích: ${c.explanation}`)
      .join("\n");

    // 2. System prompt sư phạm, trả lời đầy đủ, chuẩn xác theo SGK GDPT 2018
    const systemPrompt = `Bạn là Trợ lý ảo AI Tutor SimLab Edu, chuyên gia sư phạm Hóa học/Vật lý/Sinh học theo chuẩn SGK GDPT 2018 (Việt Nam).
HƯỚNG DẪN TRẢ LỜI CHO HỌC SINH:
1. Kiến thức SGK tham chiếu cốt lõi:
${sgkSnippets}
2. Trả lời đầy đủ, sư phạm, có định dạng Markdown trực quan rõ ràng, bao gồm:
   - 🔬 **Hiện tượng quan sát được:** Mô tả chi tiết màu sắc, sủi bọt khí, kết tủa hoặc biến đổi nhiệt.
   - 🧪 **Phương trình hóa học:** Viết phương trình đầy đủ, cân bằng chuẩn (VD: Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O).
   - 💡 **Bản chất khoa học theo SGK:** Giải thích vì sao hiện tượng xảy ra dựa vào kiến thức SGK GDPT 2018.
   - ⚠️ **Lưu ý an toàn (nếu có):** Cảnh báo nếu thao tác sai hoặc độc hại.
3. Giọng văn thân thiện, chuẩn mực nhà giáo, động viên tinh thần khám phá khoa học của học sinh.`;

    const userMessageContent = `Ngữ cảnh phòng Lab:
- Hóa chất 1: ${labContext?.chemical1?.name || "Chưa có"} (${labContext?.chemical1?.formula || ""})
- Hóa chất 2: ${labContext?.chemical2?.name || "Chưa có"} (${labContext?.chemical2?.formula || ""})
- Nhiệt độ hiện tại: ${labContext?.temperature || 25}°C
- Hiện tượng: ${labContext?.reactionResult?.phenomenon || "Chưa có phản ứng"}
- Thao tác vừa làm: ${labContext?.recentMistake || query || "Quan sát"}

Câu hỏi của học sinh: "${query || "Giải thích hiện tượng và kiểm tra thao tác an toàn cho em."}"`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-2), // Giữ ngữ cảnh gần nhất
      { role: "user", content: userMessageContent },
    ];

    const reply = await callGroqChat({
      messages,
      model: "qwen/qwen3.8-27b",
      temperature: 0.3,
      max_tokens: 650,
      useCache: true,
    });

    return NextResponse.json({
      reply,
      sgkReferences: sgkChunks.map((c) => ({
        sourceBook: c.sourceBook,
        ruleOrLaw: c.ruleOrLaw,
        safetyWarning: c.safetyWarning,
      })),
    });
  } catch (err) {
    console.error("AI Tutor API Error:", err);
    return NextResponse.json(
      { error: "Không thể kết nối đến Trợ lý AI Tutor" },
      { status: 500 }
    );
  }
}
