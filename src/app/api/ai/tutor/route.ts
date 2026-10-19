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

    // 2. System prompt súc tích, quy định không quá 3-4 câu, bám 100% SGK, không bịa đặt
    const systemPrompt = `Bạn là Trợ lý ảo AI Tutor SimLab Edu, chuyên gia sư phạm Hóa học/Vật lý/Sinh học theo chuẩn SGK GDPT 2018 (Việt Nam).
QUY TẮC BẮT BUỘC ĐỂ TIẾT KIỆM TOKEN VÀ CHÍNH XÁC 100%:
1. Dựa DUY NHẤT vào định luật và kiến thức SGK sau:
${sgkSnippets}
2. Trả lời cực kỳ súc tích, dễ hiểu (tối đa 3-4 câu). Trích dẫn tên bài/SGK nếu có.
3. Nếu học sinh có thao tác sai/nguy hiểm: Cảnh báo ngay lập tức, nêu hậu quả và hướng dẫn thao tác đúng.
4. Trình bày công thức hóa học bằng định dạng chuẩn (VD: H₂SO₄, Cu(NO₃)₂, NO₂↑).`;

    const userMessageContent = `Ngữ cảnh phòng Lab:
- Hóa chất 1: ${labContext?.chemical1?.name || "Chưa có"} (${labContext?.chemical1?.formula || ""})
- Hóa chất 2: ${labContext?.chemical2?.name || "Chưa có"} (${labContext?.chemical2?.formula || ""})
- Nhiệt độ hiện tại: ${labContext?.temperature || 25}°C
- Hiện tượng: ${labContext?.reactionResult?.phenomenon || "Chưa có phản ứng"}
- Thao tác vừa làm: ${labContext?.recentMistake || query || "Quan sát"}

Câu hỏi của học sinh: "${query || "Giải thích hiện tượng và kiểm tra thao tác an toàn cho em."}"`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-2), // Chỉ giữ 2 tin nhắn gần nhất để tiết kiệm token
      { role: "user", content: userMessageContent },
    ];

    const reply = await callGroqChat({
      messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.2, // Nhiệt độ thấp để zero hallucination
      max_tokens: 350,
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
