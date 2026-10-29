import { remoteRoomManager } from "@/lib/remoteRoomManager";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return new Response("Thiếu mã phòng roomId", { status: 400 });
  }

  const room = remoteRoomManager.getRoom(roomId);
  if (!room) {
    return new Response("Phòng không tồn tại", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Gửi trạng thái ban đầu
      const initialPayload = JSON.stringify(room);
      controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));

      // Lắng nghe cập nhật cảm biến từ điện thoại
      const unsubscribe = remoteRoomManager.subscribe(roomId, (updatedRoom) => {
        try {
          const payload = JSON.stringify(updatedRoom);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (e) {
          // ignore
        }
      });

      // Keep-alive ping mỗi 15s để không bị ngắt kết nối
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(pingInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

