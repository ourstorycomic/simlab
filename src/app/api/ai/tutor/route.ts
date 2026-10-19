import { NextRequest, NextResponse } from "next/server";
import { callGroqChat, ChatMessage } from "@/lib/groqClient";
import { retrieveSGKKnowledge } from "@/lib/sgkKnowledgeBase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, labContext, history = [] } = body;

    const trimmedQuery = (query || "").trim();
    const hasLabActivity =
      Boolean(labContext?.chemical1) ||
      Boolean(labContext?.chemical2) ||
      Boolean(labContext?.reactionResult) ||
      Boolean(labContext?.recentMistake);

    if (!trimmedQuery && !hasLabActivity) {
      return NextResponse.json(
        { error: "Thiếu nội dung câu hỏi hoặc thao tác" },
        { status: 400 }
      );
    }

    // 1. RAG: Lấy kiến thức SGK GDPT 2018 liên quan nếu khớp
    const searchQuery = `${trimmedQuery} ${labContext?.chemical1?.name || ""} ${
      labContext?.chemical2?.name || ""
    } ${labContext?.recentMistake || ""}`;

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
    const systemPrompt = `Bạn là Trợ lý AI SimLab Edu (SimLab Multi-Subject AI Tutor & Mentor), chuyên gia sư phạm đồng hành cùng học sinh Việt Nam theo chuẩn Chương trình GDPT 2018.

QUY TẮC PHẠM VI MÔN HỌC & GIẢI ĐÁP:
Bạn có khả năng trả lời xuất sắc TẤT CẢ các môn học và thắc mắc học tập, không chỉ giới hạn ở Hóa học:
1. 📐 Toán học: Trình bày từng bước tư duy logic, công thức rõ ràng, định lý, ví dụ áp dụng cụ thể.
2. ⚡ Vật lý: Giải thích hiện tượng thực tế, định luật vật lý, bản chất lực/năng lượng, công thức và đơn vị chuẩn SI.
3. 🧪 Hóa học: Mô tả chi tiết hiện tượng quan sát (màu sắc, kết tủa, khí thoát ra), viết phương trình phản ứng cân bằng chính xác, giải thích bản chất ion/oxi hóa-khử và lưu ý an toàn.
4. 🧬 Sinh học: Giải thích cơ chế tế bào, di truyền, quang hợp, hô hấp, hệ sinh thái theo sinh học hiện đại.
5. 📖 Ngữ văn & Xã hội: Phân tích chiều sâu tác phẩm, vẻ đẹp thi ảnh, biện pháp tu từ, tư tưởng nhân đạo, kỹ năng viết bài nghị luận truyền cảm hứng.
6. 💡 Phương pháp học tập & Hướng dẫn SimLab: Giải đáp thắc mắc cách sử dụng phòng thí nghiệm ảo, cách cân bằng phương trình, chiến lược thi đấu minigame.
${sgkContextSection}
QUY TẮC TRÌNH BÀY (ĐẢM BẢO CHỮ ĐẬM NHẠT HỢP LÝ & RÕ RÀNG):
- Sử dụng độ tương phản hợp lý: In đậm (**từ khóa quan trọng, tên chất, định lý, kết quả then chốt**) để nổi bật; phần giải thích để chữ thường êm mắt.
- Sử dụng các đề mục nhỏ (ví dụ: ### 🔬 Hiện tượng quan sát, ### 🧪 Phương trình, ### 💡 Phân tích bản chất, ### 📐 Hướng dẫn giải, ### 📖 Giá trị nghệ thuật...).
- Dùng gạch đầu dòng (-) hoặc số thứ tự (1, 2, 3) để người đọc dễ theo dõi, không viết một đoạn văn dồn cục quá dài.
- CÔNG THỨC TOÁN VÀ KHOA HỌC: Ưu tiên dùng ký tự số mũ và chỉ số dưới Unicode tự nhiên (VD: a² + b² = c², H₂SO₄, Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O), tránh dùng các thẻ LaTeX thô như \\[, \\], \\(, \\) không cần thiết để học sinh dễ đọc nhất.
- Giọng điệu thân thiện, mô phạm, truyền cảm hứng và khích lệ tinh thần học tập của học sinh.`;

    // 3. Chuẩn bị nội dung câu hỏi
    let userPromptContent = "";

    if (hasLabActivity) {
      userPromptContent = `[Ngữ cảnh phòng Lab SimLab]
- Hóa chất 1: ${labContext?.chemical1?.name || "Chưa có"} (${labContext?.chemical1?.formula || ""})
- Hóa chất 2: ${labContext?.chemical2?.name || "Chưa có"} (${labContext?.chemical2?.formula || ""})
- Trạng thái phản ứng: ${labContext?.reactionResult?.phenomenon || "Chưa phản ứng"}
- Thao tác: ${labContext?.recentMistake || "Thao tác trên bàn thí nghiệm"}

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
      temperature: 0.35,
      max_tokens: 1200,
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
