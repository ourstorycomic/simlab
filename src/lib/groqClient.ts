/**
 * Groq AI Client & Token Optimization Engine cho SimLab Edu
 * Tối ưu tốc độ siêu tốc (~800-1000 tokens/s) và tiết kiệm token tối đa (Tier 1: Free & Token-saving)
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// In-memory LRU Cache để tiết kiệm 100% token cho các câu hỏi trùng lặp hoặc tương đương
const responseCache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 giờ

export async function callGroqChat({
  messages,
  model = "llama-3.1-8b-instant",
  temperature = 0.3,
  max_tokens = 450,
  useCache = true,
}: {
  messages: ChatMessage[];
  model?: "llama-3.1-8b-instant" | "llama-3.3-70b-versatile" | "mixtral-8x7b-32768";
  temperature?: number;
  max_tokens?: number;
  useCache?: boolean;
}): Promise<string> {
  const cacheKey = JSON.stringify({ model, messages });

  // 1. Kiểm tra Cache để đạt 0 token
  if (useCache && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.reply;
    }
  }

  const apiKey = process.env.GROQ_API_KEY;

  // 2. Nếu chưa cấu hình GROQ_API_KEY, kích hoạt chế độ Fallback Giả lập Thông minh
  if (!apiKey || apiKey.trim() === "" || apiKey === "gsk_your_groq_api_key_here") {
    return generateSmartFallback(messages);
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn("Groq API error, falling back to local rule-based response:", errJson);
      return generateSmartFallback(messages);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "";

    // Lưu cache để lần sau tốn 0 token
    if (useCache && reply) {
      responseCache.set(cacheKey, { reply, timestamp: Date.now() });
      if (responseCache.size > 200) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) responseCache.delete(firstKey);
      }
    }

    return reply;
  } catch (error) {
    console.error("Lỗi kết nối Groq API:", error);
    return generateSmartFallback(messages);
  }
}

/**
 * Fallback thông minh dựa trên quy tắc chuyên môn phòng thí nghiệm
 * Giúp hệ thống hoạt động mượt mà 100% ngay cả khi chưa có API Key hoặc mạng chập chờn
 */
function generateSmartFallback(messages: ChatMessage[]): string {
  const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || "";

  if (lastUserMsg.includes("nước vào axit") || lastUserMsg.includes("h2so4")) {
    return "⚠️ CẢNH BÁO AN TOÀN SGK GDPT 2018 (Hóa 10): Tuyệt đối không rót nước vào axit sunfuric đặc! Axit H₂SO₄ đặc háo nước mạnh và tỏa nhiệt cực lớn làm nước sôi đột ngột bắn tung tóe kèm axit gây bỏng nặng. Nguyên tắc đúng: Rót từ từ axit vào nước dọc theo đũa thủy tinh và khuấy đều.";
  }

  if (lastUserMsg.includes("cu") && (lastUserMsg.includes("hno3") || lastUserMsg.includes("axit nitric"))) {
    return "📘 GIẢI THÍCH SGK HÓA 11 (GDPT 2018): Phản ứng Cu + 4HNO₃(đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O. Khí thoát ra có màu nâu đỏ là khí Nitrogen dioxide (NO₂), rất độc. Dung dịch chuyển dần từ không màu sang xanh lam do tạo phức ion đồng [Cu(H₂O)₄]²⁺.";
  }

  if (lastUserMsg.includes("baso4") || (lastUserMsg.includes("ba2+") && lastUserMsg.includes("so4"))) {
    return "📘 ĐỊNH LUẬT SGK HÓA 11: Ba²⁺ + SO₄²⁻ → BaSO₄↓ (kết tủa trắng mịn, bền trong môi trường axit mạnh như HCl, HNO₃). Đây là phản ứng đặc trưng trong chuẩn kiến thức để nhận biết ion sulfate.";
  }

  if (lastUserMsg.includes("đun") || lastUserMsg.includes("nhiệt độ") || lastUserMsg.includes("trào")) {
    return "💡 GỢI Ý THAO TÁC PTN (KHTN 8 & Hóa 10): Khi đun dung dịch, phải hơ đều đáy ống nghiệm trước khi đun tập trung tại điểm có hóa chất. Đặt nghiêng ống nghiệm 45 độ, miệng không hướng về phía người khác để tránh dung dịch sôi cục bộ trào ra ngoài.";
  }

  return "💡 Gợi ý AI Tutor SimLab: Thao tác của em đang được đối chiếu với chuẩn kiến thức GDPT 2018. Hãy chú ý quy tắc an toàn, kiểm tra nồng độ mol và nhiệt độ phản ứng trước khi phối trộn.";
}
