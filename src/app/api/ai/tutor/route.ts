import { NextRequest, NextResponse } from "next/server";
import { callGroqChat, ChatMessage } from "@/lib/groqClient";
import { retrieveSGKKnowledge } from "@/lib/sgkKnowledgeBase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, labContext, history = [], isVoice = false } = body;

    const trimmedQuery = (query || "").trim();
    const hasLabActivity =
      Boolean(labContext?.chemical1) ||
      Boolean(labContext?.chemical2) ||
      Boolean(labContext?.reactionResult) ||
      Boolean(labContext?.recentMistake) ||
      Boolean(labContext?.physicsTopic) ||
      Boolean(labContext?.organName);

    if (!trimmedQuery && !hasLabActivity) {
      return NextResponse.json(
        { error: "Thiếu nội dung câu hỏi hoặc thao tác" },
        { status: 400 }
      );
    }

    // 1. RAG: Lấy kiến thức SGK GDPT 2018 liên quan nếu khớp
    const searchQuery = `${trimmedQuery} ${labContext?.chemical1?.name || ""} ${
      labContext?.chemical2?.name || ""
    } ${labContext?.physicsTopic || ""} ${labContext?.organName || ""} ${labContext?.recentMistake || ""}`;

    const sgkChunks = retrieveSGKKnowledge(searchQuery, 2);

    let sgkContextSection = "";
    if (sgkChunks.length > 0) {
      const snippets = sgkChunks
        .map(
          (c) =>
            `[${c.sourceBook}] (${c.subject.toUpperCase()}): ${c.ruleOrLaw}. Nội dung: ${c.explanation}`
        )
        .join("\n");
      sgkContextSection = `\nKiến thức chuẩn SGK GDPT 2018 tham chiếu:\n${snippets}\n`;
    }

    // 2. System prompt sư phạm đa môn toàn diện
    const voiceInstruction = isVoice
      ? "\nLƯU Ý ĐẶC BIỆT VỀ GIỌNG NÓI (VOICE TUTOR): Bạn đang đối thoại trực tiếp bằng giọng nói (TTS) với học sinh trong phòng Lab 3D. Hãy trả lời cực kỳ súc tích, ấm áp, truyền cảm hứng bằng 2 đến 3 câu văn tự nhiên (dưới 60 từ). Tuyệt đối không dùng dấu sao (**), bullet point, hay các ký tự markdown để giọng đọc phát âm mượt mà nhất."
      : "";

    const systemPrompt = `Bạn là Trợ lý AI SimLab Edu (Cô Giáo Mai AI), chuyên gia sư phạm đồng hành cùng học sinh Việt Nam theo chuẩn Chương trình GDPT 2018.

QUY TẮC PHẠM VI MÔN HỌC & GIẢI ĐÁP:
Bạn có khả năng trả lời xuất sắc TẤT CẢ các môn học và thắc mắc học tập:
1. Toán học: Trình bày từng bước tư duy logic, công thức rõ ràng, định lý, ví dụ áp dụng cụ thể.
2. Vật lý: Giải thích hiện tượng thực tế (con lắc đơn T = 2π√(l/g), định luật Ôm I = U/R, thấu kính hội tụ 1/f = 1/d + 1/d'), bản chất lực/năng lượng, công thức và đơn vị chuẩn SI.
3. Hóa học: Mô tả chi tiết hiện tượng quan sát (màu sắc, kết tủa, khí thoát ra), viết phương trình phản ứng cân bằng chính xác, giải thích bản chất ion/oxi hóa-khử và lưu ý an toàn.
4. Sinh học: Giải thích cấu tạo giải phẫu 3D các cơ quan (Tim, Não, Phổi, Gan...), chức năng tuần hoàn, tế bào, di truyền theo sinh học hiện đại.
5. Phương pháp học tập & Hướng dẫn SimLab: Giải đáp thắc mắc cách sử dụng phòng thí nghiệm ảo, cách tương tác với cử chỉ bàn tay hoặc điện thoại.
${sgkContextSection}
QUY TẮC TRÌNH BÀY:${voiceInstruction}
- Giọng điệu thân thiện, mô phạm, vui tươi, khích lệ tinh thần học tập của học sinh.`;

    // 3. Chuẩn bị nội dung câu hỏi
    let userPromptContent = "";

    if (hasLabActivity) {
      userPromptContent = `[Ngữ cảnh phòng Lab 3D SimLab]
- Môn học: ${labContext?.subject || "Khoa học"}
${labContext?.chemical1 ? `- Hóa chất 1: ${labContext.chemical1.name} (${labContext.chemical1.formula || ""}) [${labContext.chemical1.state || "dung dịch"}]\n` : ""}${labContext?.chemical2 ? `- Hóa chất 2 / Trong cốc: ${labContext.chemical2.name} (${labContext.chemical2.formula || ""}) [${labContext.chemical2.state || "dung dịch"}]\n` : ""}${labContext?.reactionResult ? `- Hiện tượng phản ứng: ${labContext.reactionResult.equation || ""} - ${labContext.reactionResult.description || ""}\n` : ""}${labContext?.physicsTopic ? `- Bài thí nghiệm Vật lý: ${labContext.physicsTopic} (Chi tiết: ${labContext.physicsDetail || ""})\n` : ""}${labContext?.organName ? `- Cơ quan Sinh học đang xem: ${labContext.organName}\n` : ""}${labContext?.recentMistake ? `- Thao tác: ${labContext.recentMistake}\n` : ""}
Câu hỏi của học sinh: "${trimmedQuery || "Giải thích hiện tượng và hướng dẫn thao tác tiếp theo cho em."}"`;
    } else {
      userPromptContent = trimmedQuery;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-3),
      { role: "user", content: userPromptContent },
    ];

    const reply = await callGroqChat({
      messages,
      model: "qwen/qwen3.8-27b",
      temperature: isVoice ? 0.28 : 0.35,
      max_tokens: isVoice ? 250 : 1200,
      useCache: true,
    });

    return NextResponse.json({
      reply,
      answer: reply,
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
