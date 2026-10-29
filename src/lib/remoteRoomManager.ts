import os from "os";

export interface RemoteRoomState {
  roomId: string;
  createdAt: number;
  lastActive: number;
  phoneConnected: boolean;
  phoneDeviceName?: string;
  sensorData: {
    pitch: number;
    roll: number;
    yaw: number;
    isPourTilted: boolean;
    pourIntensity: number;
    isShaking: boolean;
    motionMagnitude: number;
    lastUpdated: number;
  };
  actions: {
    type: "pour" | "shake" | "switch_item" | "clean";
    timestamp: number;
  }[];
}

type RoomListener = (state: RemoteRoomState) => void;

class RemoteRoomManager {
  private rooms: Map<string, RemoteRoomState> = new Map();
  private listeners: Map<string, Set<RoomListener>> = new Map();

  constructor() {
    // Tự động dọn dẹp các phòng hết hạn sau mỗi 10 phút
    if (typeof setInterval !== "undefined") {
      setInterval(() => {
        this.cleanupExpiredRooms();
      }, 10 * 60 * 1000);
    }
  }

  public getLanIpAddress(): string {
    try {
      const interfaces = os.networkInterfaces();
      const candidates: { address: string; score: number }[] = [];

      for (const name of Object.keys(interfaces)) {
        const lowerName = name.toLowerCase();
        const isVirtual = /radmin|hamachi|virtualbox|vmware|vethernet|tailscale|zerotier|docker|vbox|tap|tun/i.test(lowerName);

        const netList = interfaces[name];
        if (!netList) continue;
        for (const net of netList) {
          if (net.family === "IPv4" && !net.internal) {
            // Loại bỏ hoàn toàn IP Link-Local (169.254.x.x) không thể truy cập
            if (net.address.startsWith("169.254.")) continue;

            let score = 0;
            // Ưu tiên dải mạng chuẩn gia đình / lớp học (192.168.x.x)
            if (net.address.startsWith("192.168.")) score += 100;
            else if (net.address.startsWith("10.")) score += 80;
            else if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(net.address)) score += 60;
            else score -= 50;

            // Ưu tiên adapter Wi-Fi và Ethernet vật lý
            if (/wi-fi|wifi|wlan|wireless/i.test(lowerName)) score += 50;
            if (/ethernet|lan|eth/i.test(lowerName)) score += 40;

            if (isVirtual) score -= 200;

            candidates.push({ address: net.address, score });
          }
        }
      }

      candidates.sort((a, b) => b.score - a.score);
      if (candidates.length > 0 && candidates[0].score > 0) {
        return candidates[0].address;
      }
      return candidates[0]?.address || "localhost";
    } catch (e) {
      // ignore
    }
    return "localhost";
  }

  public createRoom(): RemoteRoomState {
    // Tạo mã PIN 6 chữ số ngẫu nhiên dễ nhớ (VD: 482195)
    let roomId = "";
    do {
      roomId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(roomId));

    const room: RemoteRoomState = {
      roomId,
      createdAt: Date.now(),
      lastActive: Date.now(),
      phoneConnected: false,
      sensorData: {
        pitch: 0,
        roll: 0,
        yaw: 0,
        isPourTilted: false,
        pourIntensity: 0,
        isShaking: false,
        motionMagnitude: 0,
        lastUpdated: Date.now(),
      },
      actions: [],
    };

    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): RemoteRoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room;
  }

  public connectPhone(roomId: string, deviceName?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.phoneConnected = true;
    room.phoneDeviceName = deviceName || "Điện thoại thông minh";
    room.lastActive = Date.now();
    this.notify(roomId);
    return true;
  }

  public updateSensorData(
    roomId: string,
    data: Partial<RemoteRoomState["sensorData"]>,
    action?: RemoteRoomState["actions"][0]
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.sensorData = {
      ...room.sensorData,
      ...data,
      lastUpdated: Date.now(),
    };
    room.lastActive = Date.now();

    if (action) {
      room.actions.push(action);
      // Giữ tối đa 10 action gần nhất
      if (room.actions.length > 10) {
        room.actions.shift();
      }
    }

    this.notify(roomId);
    return true;
  }

  public subscribe(roomId: string, listener: RoomListener): () => void {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    const set = this.listeners.get(roomId)!;
    set.add(listener);

    const room = this.getRoom(roomId);
    if (room) {
      listener(room);
    }

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(roomId);
      }
    };
  }

  private notify(roomId: string) {
    const set = this.listeners.get(roomId);
    const room = this.rooms.get(roomId);
    if (set && room) {
      set.forEach((listener) => {
        try {
          listener(room);
        } catch (e) {
          // ignore
        }
      });
    }
  }

  private cleanupExpiredRooms() {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    this.rooms.forEach((room, roomId) => {
      if (now - room.lastActive > TWO_HOURS) {
        this.rooms.delete(roomId);
        this.listeners.delete(roomId);
      }
    });
  }
}

// Global singleton instance for Next.js hot-reloading
const globalForRemote = globalThis as unknown as {
  __remoteRoomManager?: RemoteRoomManager;
};

export const remoteRoomManager =
  globalForRemote.__remoteRoomManager || new RemoteRoomManager();

if (process.env.NODE_ENV !== "production") {
  globalForRemote.__remoteRoomManager = remoteRoomManager;
}
