import { NextResponse } from "next/server";
import { remoteRoomManager } from "@/lib/remoteRoomManager";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomId, sensorData, action } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Thiếu mã phòng" }, { status: 400 });
    }

    const success = remoteRoomManager.updateSensorData(
      roomId,
      sensorData || {},
      action
    );

    if (!success) {
      return NextResponse.json({ error: "Phòng không tồn tại" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

