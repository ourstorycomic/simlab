import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);

    // Tìm file trong public/videos hoặc src/assets/videos
    const searchPaths = [
      path.join(process.cwd(), "public", "videos", filename),
      path.join(process.cwd(), "src", "assets", "videos", filename),
      path.join(process.cwd(), "public", "videos", "dong va axit nitric.mp4"),
      path.join(process.cwd(), "src", "assets", "videos", "dong va axit nitric.mp4"),
    ];

    let filePath = "";
    for (const p of searchPaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return new NextResponse("Video not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      // @ts-expect-error Node stream to Web ReadableStream
      return new NextResponse(fileStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "video/mp4",
        },
      });
    }

    const fileStream = fs.createReadStream(filePath);
    // @ts-expect-error Node stream to Web ReadableStream
    return new NextResponse(fileStream, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Video stream error:", error);
    return new NextResponse("Error streaming video", { status: 500 });
  }
}
