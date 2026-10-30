"use client";

import { supabase } from "@/lib/supabase";

export interface RemoteMotionPayload {
  pitch: number;
  roll: number;
  yaw?: number;
  isPourTilted: boolean;
  pourIntensity: number;
  isShaking: boolean;
  chemicalName?: string;
  chemicalFormula?: string;
  liquidColor?: string;
}

export interface RemoteActionPayload {
  type: "pour" | "shake" | "switch_item" | "clean";
  timestamp: number;
}

class RemoteSyncService {
  private activeLaptopChannel: any = null;
  private activePhoneChannel: any = null;
  private currentRoomId: string | null = null;

  /**
   * Laptop: Bắt đầu lắng nghe tín hiệu từ Điện thoại thông qua Supabase Realtime Broadcast.
   * Kênh này sẽ tiếp tục chạy ngầm ngay cả khi đóng cửa sổ QR Modal!
   */
  public listenOnLaptop(
    roomId: string,
    callbacks: {
      onPhoneConnected?: (deviceName: string) => void;
      onMotion?: (motion: RemoteMotionPayload) => void;
      onAction?: (action: RemoteActionPayload) => void;
    }
  ) {
    if (this.activeLaptopChannel && this.currentRoomId === roomId) {
      return () => {}; // Đã đang lắng nghe phòng này rồi
    }

    // Đóng kênh cũ nếu có
    if (this.activeLaptopChannel) {
      try {
        this.activeLaptopChannel.unsubscribe();
      } catch (e) {}
      this.activeLaptopChannel = null;
    }

    this.currentRoomId = roomId;

    const channelName = `simlab-remote-${roomId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "phone-connected" }, ({ payload }: any) => {
        const name = payload?.deviceName || "Điện thoại";
        callbacks.onPhoneConnected?.(name);
      })
      .on("broadcast", { event: "motion" }, ({ payload }: any) => {
        if (payload) {
          callbacks.onMotion?.(payload);
        }
      })
      .on("broadcast", { event: "action" }, ({ payload }: any) => {
        if (payload) {
          callbacks.onAction?.(payload);
        }
      })
      .subscribe((status: string) => {
        console.log(`[Laptop] Supabase Realtime Channel ${channelName} status:`, status);
      });

    this.activeLaptopChannel = channel;

    return () => {
      // Giữ kết nối ngầm cho cả phiên làm việc phòng Lab
    };
  }

  /**
   * Phone: Kết nối vào phòng để gửi dữ liệu cảm biến thời gian thực lên Laptop
   */
  public connectFromPhone(
    roomId: string,
    deviceName: string,
    callbacks?: {
      onSubscribed?: () => void;
    }
  ) {
    if (this.activePhoneChannel) {
      try {
        this.activePhoneChannel.unsubscribe();
      } catch (e) {}
      this.activePhoneChannel = null;
    }

    const channelName = `simlab-remote-${roomId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel.subscribe((status: string) => {
      console.log(`[Phone] Supabase Realtime Channel ${channelName} status:`, status);
      if (status === "SUBSCRIBED") {
        callbacks?.onSubscribed?.();
        // Thông báo cho Laptop biết điện thoại đã kết nối
        channel.send({
          type: "broadcast",
          event: "phone-connected",
          payload: { deviceName, timestamp: Date.now() },
        });
      }
    });

    this.activePhoneChannel = channel;

    return {
      sendMotion: (motion: RemoteMotionPayload) => {
        try {
          channel.send({
            type: "broadcast",
            event: "motion",
            payload: motion,
          });
        } catch (e) {
          // ignore
        }
      },
      sendAction: (action: RemoteActionPayload) => {
        try {
          channel.send({
            type: "broadcast",
            event: "action",
            payload: action,
          });
        } catch (e) {
          // ignore
        }
      },
      disconnect: () => {
        try {
          channel.unsubscribe();
        } catch (e) {}
        this.activePhoneChannel = null;
      },
    };
  }

  public getActiveRoomId(): string | null {
    return this.currentRoomId;
  }
}

export const remoteSyncService = new RemoteSyncService();
