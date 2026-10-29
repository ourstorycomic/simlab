import { NextResponse } from "next/server";
import { remoteRoomManager } from "@/lib/remoteRoomManager";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");

  const lanIp = remoteRoomManager.getLanIpAddress();

  if (roomId) {
    const room = remoteRoomManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Phòng không tồn tại" }, { status: 404 });
    }
    return NextResponse.json({
      room,
      lanIp,
      lanUrl: `http://${lanIp}:3000/remote?room=${roomId}`,
    });
  }

  return NextResponse.json({
    lanIp,
    lanPort: 3000,
    baseUrl: `http://${lanIp}:3000`,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, roomId, deviceName } = body;

    const lanIp = remoteRoomManager.getLanIpAddress();

    if (action === "join" && roomId) {
      const room = remoteRoomManager.getRoom(roomId);
      if (!room) {
        return NextResponse.json(
          { error: "Mã phòng không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại!" },
          { status: 404 }
        );
      }
      remoteRoomManager.connectPhone(roomId, deviceName);
      return NextResponse.json({
        success: true,
        room: remoteRoomManager.getRoom(roomId),
      });
    }

    // Mặc định: Tạo phòng mới cho Laptop
    const newRoom = remoteRoomManager.createRoom();
    return NextResponse.json({
      success: true,
      room: newRoom,
      lanIp,
      lanUrl: `http://${lanIp}:3000/remote?room=${newRoom.roomId}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

