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

  // 1. Toán học
  if (lastUserMsg.includes("pythagor") || lastUserMsg.includes("pitago") || lastUserMsg.includes("tam giác vuông")) {
    return `### ĐỊNH LÝ PYTHAGORAS (TOÁN 8 - GDPT 2018):
Trong một tam giác vuông, bình phương của cạnh huyền bằng tổng bình phương hai cạnh góc vuông:
$$a^2 + b^2 = c^2$$

- **Trong đó:** $c$ là độ dài cạnh huyền; $a$ và $b$ là độ dài hai cạnh góc vuông.
- **Ví dụ áp dụng:** Cho tam giác vuông có hai cạnh góc vuông là 3 cm và 4 cm. Độ dài cạnh huyền là:
  $$c = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = 5\\text{ (cm)}$$
- **Định lý đảo:** Nếu một tam giác thỏa mãn $a^2 + b^2 = c^2$ thì đó chắc chắn là một tam giác vuông.`;
  }

  if (lastUserMsg.includes("đạo hàm") || lastUserMsg.includes("tiếp tuyến")) {
    return `### Ý NGHĨA & CÔNG THỨC ĐẠO HÀM (TOÁN 11):
- **Ý nghĩa hình học:** Đạo hàm $f'(x_0)$ chính là **hệ số góc $k$** của tiếp tuyến với đồ thị hàm số tại tiếp điểm $M_0(x_0; y_0)$:
  $$y - y_0 = f'(x_0)(x - x_0)$$
- **Bảng đạo hàm cơ bản:**
  - $(x^n)' = n \\cdot x^{n-1}$
  - $(\\sin x)' = \\cos x$ ; $(\\cos x)' = -\\sin x$
  - $(e^x)' = e^x$ ; $(\\ln x)' = \\frac{1}{x}$`;
  }

  // 2. Vật lý
  if (lastUserMsg.includes("newton") || lastUserMsg.includes("định luật 2") || lastUserMsg.includes("f=ma")) {
    return `### ĐỊNH LUẬT II NEWTON (VẬT LÝ 10):
- **Nội dung định luật:** Gia tốc của một vật cùng hướng với lực tác dụng. Độ lớn gia tốc tỉ lệ thuận với lực tác dụng và tỉ lệ nghịch với khối lượng của vật:
  $$\\vec{a} = \\frac{\\vec{F}}{m} \\iff \\vec{F} = m \\cdot \\vec{a}$$
- **Đơn vị chuẩn:** Lực $F$ đo bằng Newton (N), khối lượng $m$ đo bằng kilogram (kg), gia tốc $a$ đo bằng $m/s^2$.`;
  }

  // 3. Sinh học
  if (lastUserMsg.includes("quang hợp") || lastUserMsg.includes("pha sáng") || lastUserMsg.includes("pha tối")) {
    return `### BẢN CHẤT QUÁ TRÌNH QUANG HỢP (SINH HỌC 10):
Quang hợp diễn ra tại **lục lạp** ở lá cây với phương trình tổng quát:
$$6CO_2 + 12H_2O + \\text{Ánh sáng} \\rightarrow C_6H_{12}O_6 + 6O_2 + 6H_2O$$

- **Pha sáng:** Diễn ra tại màng thylakoid, quang phân ly nước giải phóng $O_2$ và tạo năng lượng ATP, NADPH.
- **Pha tối (Chu trình Calvin):** Diễn ra tại chất nền stroma, cố định $CO_2$ thành glucose.`;
  }

  // 4. Ngữ văn
  if (lastUserMsg.includes("tây tiến") || lastUserMsg.includes("quang dũng")) {
    return `### PHÂN TÍCH THI TƯỢNG BÀI THƠ TÂY TIẾN (QUANG DŨNG):
- **Cảm hứng chủ đạo:** Kết hợp nhuần nhuyễn giữa **bút pháp lãng mạn** và **tinh thần bi tráng**.
- **Hình tượng người lính:** Hiện lên với vẻ đẹp kiêu hùng, hào hoa nhưng sẵn sàng cống hiến tuổi xuân cho đất nước:
  > *"Chiến trường đi chẳng tiếc đời xanh / Áo bào thay chiếu anh về đất / Sông Mã gầm lên khúc độc hành"*
- Cái chết không hề bi lụy mà được nâng lên tầm vóc sử thi bất tử.`;
  }

  // 5. Hóa học
  if (lastUserMsg.includes("nước vào axit") || lastUserMsg.includes("h2so4")) {
    return `### CẢNH BÁO AN TOÀN SGK HÓA 10 (GDPT 2018):
Tuyệt đối không rót nước vào axit sunfuric đặc ($H_2SO_4$)!

- **Nguyên nhân khoa học:** Axit $H_2SO_4$ đặc háo nước cực mạnh và tỏa lượng nhiệt khổng lồ ($\\Delta H < 0$). Nước nhẹ hơn sẽ nổi lên trên, sôi đột ngột và bắn tung tóe axit gây bỏng nghiêm trọng.
- **Quy tắc thao tác chuẩn:** Luôn rót **từ từ axit vào nước** dọc theo đũa thủy tinh và khuấy nhẹ.`;
  }

  if (lastUserMsg.includes("cu") && (lastUserMsg.includes("hno3") || lastUserMsg.includes("axit nitric"))) {
    return `### HIỆN TƯỢNG PHẢN ỨNG (HÓA HỌC 11):
Phản ứng giữa đồng kim loại (Cu) và axit nitric đặc ($HNO_3$):
- **Hiện tượng quan sát:** Mảnh đồng tan dần, sủi bọt khí màu **nâu đỏ** ($NO_2$), dung dịch chuyển sang **màu xanh lam** của ion $Cu^{2+}$.
- **Phương trình hóa học:**
  $$Cu + 4HNO_3 \\text{ (đặc)} \\rightarrow Cu(NO_3)_2 + 2NO_2\\uparrow + 2H_2O$$
- **Lưu ý an toàn:** Khí $NO_2$ rất độc, cần làm thí nghiệm trong tủ hút hoặc nút bông tẩm kiềm NaOH.`;
  }

  return `**SimLab AI Mentor:** Câu hỏi của bạn đã được tiếp nhận! Dù là kiến thức **Toán học, Vật lý, Hóa học, Sinh học, Ngữ văn** hay phương pháp thực hành trên SimLab, mình luôn sẵn sàng đồng hành và giải thích chi tiết từng bước cho bạn.`;
}
