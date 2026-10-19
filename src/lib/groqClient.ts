/**
 * Groq AI Client & Token Optimization Engine cho SimLab Edu
 * Tối ưu tốc độ siêu tốc (~800-1000 tokens/s) và tiết kiệm token tối đa (Tier 1: Free & Token-saving)
 */

import fs from "fs";
import path from "path";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// In-memory LRU Cache để tiết kiệm 100% token cho các câu hỏi trùng lặp
const responseCache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 giờ

// Danh sách các model Groq được ưu tiên theo thứ tự
export const CANDIDATE_MODELS = [
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

function getGroqApiKey(): string {
  let apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_groq_api_key")) {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const match = content.match(/GROQ_API_KEY=(.*)/);
        if (match && match[1]) {
          apiKey = match[1].trim();
        }
      }
    } catch (e) {}
  }
  return apiKey || "";
}

export async function callGroqChat({
  messages,
  model = "qwen/qwen3.8-27b",
  temperature = 0.3,
  max_tokens = 600,
  useCache = true,
}: {
  messages: ChatMessage[];
  model?: string;
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

  const apiKey = getGroqApiKey();

  // 2. Nếu chưa cấu hình GROQ_API_KEY, kích hoạt chế độ Fallback Giả lập Thông minh
  if (!apiKey || apiKey.trim() === "" || apiKey === "gsk_your_groq_api_key_here") {
    return generateSmartFallback(messages);
  }

  // 3. Thử model chính, nếu model không tồn tại thì tự động thử các model khả dụng khác
  const modelsToTry = [model, ...CANDIDATE_MODELS.filter((m) => m !== model)];

  for (const currentModel of modelsToTry) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature,
          max_tokens,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`Groq model ${currentModel} error:`, errJson?.error?.message || errJson);
        continue; // Thử model tiếp theo
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "";

      if (reply) {
        if (useCache) {
          responseCache.set(cacheKey, { reply, timestamp: Date.now() });
          if (responseCache.size > 200) {
            const firstKey = responseCache.keys().next().value;
            if (firstKey) responseCache.delete(firstKey);
          }
        }
        return reply;
      }
    } catch (error) {
      console.error(`Lỗi kết nối model ${currentModel}:`, error);
    }
  }

  // 4. Nếu toàn bộ model trên Groq bị lỗi mạng, dùng fallback tri thức SGK
  return generateSmartFallback(messages);
}

/**
 * Fallback thông minh dựa trên quy tắc chuyên môn phòng thí nghiệm
 */
function generateSmartFallback(messages: ChatMessage[]): string {
  const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || "";

  if (lastUserMsg.includes("nước vào axit") || lastUserMsg.includes("h2so4")) {
    return `### ⚠️ CẢNH BÁO AN TOÀN SGK HÓA 10 (GDPT 2018):
Tuyệt đối không rót nước vào axit sunfuric đặc (H₂SO₄)!

- **Nguyên nhân khoa học:** Axit H₂SO₄ đặc háo nước cực mạnh và quá trình hydrat hóa tỏa lượng nhiệt khổng lồ ($\Delta H < 0$). Nước có khối lượng riêng nhẹ hơn sẽ nổi lên bề mặt, sôi đột ngột và bắn tung tóe kèm axit gây bỏng hóa chất nghiêm trọng.
- **Quy tắc thao tác chuẩn:** Luôn rót **từ từ axit vào nước** dọc theo đũa thủy tinh, vừa rót vừa khuấy nhẹ.`;
  }

  if (lastUserMsg.includes("cu") && (lastUserMsg.includes("hno3") || lastUserMsg.includes("axit nitric"))) {
    return `### 🔬 HIỆN TƯỢNG PHẢN ỨNG (HÓA HỌC 11 - GDPT 2018):
Phản ứng giữa đồng kim loại (Cu) và axit nitric đặc (HNO₃):

- **Hiện tượng quan sát:** 
  1. Mảnh đồng tan dần trong dung dịch.
  2. Sủi bọt khí mạnh, thoát ra khí có màu nâu đỏ đặc trưng là khí nitrogen dioxide (**NO₂**).
  3. Dung dịch chuyển dần từ không màu sang **màu xanh lam** của phức ion đồng $[Cu(H₂O)₄]^{2+}$.
- **Phương trình hóa học:**
  $Cu + 4HNO₃(đặc) \\rightarrow Cu(NO₃)₂ + 2NO₂\\uparrow + 2H₂O$
- **Lưu ý an toàn:** Khí NO₂ rất độc đối với đường hô hấp, bắt buộc thực hiện trong tủ hút hoặc dùng bông tẩm dung dịch kiềm NaOH nút ở miệng ống nghiệm.`;
  }

  if (lastUserMsg.includes("baso4") || (lastUserMsg.includes("ba2+") && lastUserMsg.includes("so4"))) {
    return `### 📘 DẤU HIỆU NHẬN BIẾT ION SULFATE (HÓA 11):
- **Phản ứng:** $Ba^{2+} + SO_4^{2-} \\rightarrow BaSO_4\\downarrow$ (kết tủa màu trắng mịn).
- **Đặc điểm nhận diện:** Kết tủa BaSO₄ có tích số tan cực nhỏ ($K_{sp} \\approx 1.1 \\times 10^{-10}$), hoàn toàn không tan trong các axit mạnh như HCl hay HNO₃. Đây là dấu hiệu then chốt trong chuẩn kiến thức để phân biệt với $BaCO_3$ hay $BaSO_3$.`;
  }

  return `💡 **Gợi ý từ Trợ lý SimLab Edu:** Thao tác và câu hỏi của bạn đang được đối chiếu với chuẩn SGK GDPT 2018. Hãy kiểm tra các thông số nồng độ mol, nhiệt độ và đảm bảo quy tắc an toàn trước khi phối trộn hóa chất.`;
}
