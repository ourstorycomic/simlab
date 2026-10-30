import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function splitTextIntoChunks(text: string, maxLen = 170): string[] {
  // Tách câu theo dấu chấm, chấm than, chấm hỏi, xuống dòng
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
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
        // Nếu một câu quá dài thì chia nhỏ theo từ
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
  return chunks.slice(0, 6); // Tối đa 6 câu (~30s thoại) để đảm bảo tốc độ phản hồi tức thì
}

async function fetchGoogleTTSChunk(chunkText: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(
    chunkText
  )}`;

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
  return Buffer.from(arrayBuffer);
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

    const chunks = splitTextIntoChunks(cleanText, 170);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      try {
        const buf = await fetchGoogleTTSChunk(chunk);
        audioBuffers.push(buf);
      } catch (err) {
        console.error("Lỗi khi tải đoạn TTS:", chunk, err);
      }
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json({ error: "Không thể tạo âm thanh" }, { status: 500 });
    }

    const combined = Buffer.concat(audioBuffers);

    return new Response(combined, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": combined.length.toString(),
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

    const chunks = splitTextIntoChunks(cleanText, 170);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      try {
        const buf = await fetchGoogleTTSChunk(chunk);
        audioBuffers.push(buf);
      } catch (err) {
        console.error("Lỗi khi tải đoạn TTS:", chunk, err);
      }
    }

    if (audioBuffers.length === 0) {
      return NextResponse.json({ error: "Không thể tạo âm thanh" }, { status: 500 });
    }

    const combined = Buffer.concat(audioBuffers);

    return new Response(combined, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": combined.length.toString(),
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS API POST Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi hệ thống TTS" }, { status: 500 });
  }
}

