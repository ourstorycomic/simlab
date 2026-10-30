import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Tách văn bản thành các đoạn nhỏ dưới 190 ký tự (giới hạn an toàn của Google Translate TTS là 200 ký tự)
 */
function splitTextIntoChunks(text: string, maxLen = 190): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^.!?\n,;]+[.!?\n,;]*/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if ((current + " " + trimmed).trim().length <= maxLen) {
      current = (current + " " + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxLen) {
        // Nếu một câu quá dài thì chia theo từ
        const words = trimmed.split(/\s+/);
        let sub = "";
        for (const w of words) {
          if ((sub + " " + w).trim().length <= maxLen) {
            sub = (sub + " " + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 8); // Tối đa 8 đoạn (~40s thoại)
}

/**
 * Tải đoạn âm thanh MP3 từ Google Translate TTS (Giọng Nữ Chuẩn Tiếng Việt - Bắc)
 * và cắt bỏ phần đệm 0xAA cuối mỗi đoạn để khi ghép các đoạn không làm hỏng bitstream MP3.
 */
async function fetchGoogleTTSChunk(chunkText: string): Promise<Buffer> {
  const urls = [
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(
      chunkText
    )}`,
    `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=vi&q=${encodeURIComponent(
      chunkText
    )}`,
  ];

  let lastError: any = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/",
        },
      });

      if (!res.ok) {
        throw new Error(`Google TTS error: ${res.status} ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);

      // Loại bỏ byte đệm 0xAA cuối file để khi ghép nhiều chunk MP3 không bị dừng sớm
      let end = buf.length;
      while (end > 0 && buf[end - 1] === 0xaa) {
        end--;
      }
      return buf.subarray(0, end);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Không thể tải âm thanh TTS từ Google");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text") || "";
    const cleanText = text
      .replace(/[*#_`~>\[\]\(\)]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: "Thiếu văn bản cần đọc" }, { status: 400 });
    }

    const chunks = splitTextIntoChunks(cleanText, 190);

    // Tải song song tất cả các đoạn âm thanh để tối đa hóa tốc độ phản hồi (< 500ms)
    const audioBuffers = await Promise.all(
      chunks.map((chunk) =>
        fetchGoogleTTSChunk(chunk).catch((err) => {
          console.error("Lỗi khi tải đoạn TTS:", chunk, err);
          return null;
        })
      )
    );

    const validBuffers = audioBuffers.filter(
      (b): b is Buffer => b !== null && b.length > 0
    );

    if (validBuffers.length === 0) {
      return NextResponse.json({ error: "Không thể tạo âm thanh" }, { status: 500 });
    }

    // Ghép các buffer MPEG Audio chuẩn
    const combined = Buffer.concat(validBuffers);

    return new Response(combined, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": combined.length.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS API GET Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi hệ thống TTS" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const cleanText = text
      .replace(/[*#_`~>\[\]\(\)]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: "Thiếu văn bản cần đọc" }, { status: 400 });
    }

    const chunks = splitTextIntoChunks(cleanText, 190);

    const audioBuffers = await Promise.all(
      chunks.map((chunk) =>
        fetchGoogleTTSChunk(chunk).catch((err) => {
          console.error("Lỗi khi tải đoạn TTS:", chunk, err);
          return null;
        })
      )
    );

    const validBuffers = audioBuffers.filter(
      (b): b is Buffer => b !== null && b.length > 0
    );

    if (validBuffers.length === 0) {
      return NextResponse.json({ error: "Không thể tạo âm thanh" }, { status: 500 });
    }

    const combined = Buffer.concat(validBuffers);

    return new Response(combined, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": combined.length.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS API POST Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi hệ thống TTS" }, { status: 500 });
  }
}
