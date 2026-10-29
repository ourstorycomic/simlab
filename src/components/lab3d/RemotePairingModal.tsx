"use client";

import React, { useState, useEffect, useRef } from "react";
import { deviceSensors } from "@/lib/deviceSensors";
import { playLabSound } from "./ChemistryRealisticModels";
import {
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Wifi,
  X,
  RefreshCw,
} from "lucide-react";

interface RemotePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneConnected?: (deviceName: string) => void;
}

export default function RemotePairingModal({
  isOpen,
  onClose,
  onPhoneConnected,
}: RemotePairingModalProps) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [lanUrl, setLanUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Tạo mã phòng khi modal mở ra
  useEffect(() => {
    if (!isOpen) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    createRoom();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen]);

  const createRoom = async () => {
    setLoading(true);
    setConnectedDevice(null);

    try {
      const res = await fetch("/api/remote/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();

      if (data.success && data.room) {
        const id = data.room.roomId;
        setRoomId(id);

        const currentHost =
          typeof window !== "undefined"
            ? `${window.location.protocol}//${data.lanIp || window.location.hostname}:${
                window.location.port || "3000"
              }`
            : data.baseUrl;

        const targetUrl = `${currentHost}/remote?room=${id}`;
        setLanUrl(targetUrl);

        // Mở kết nối thời gian thực Server-Sent Events (SSE) để nhận dữ liệu từ điện thoại
        startListeningToPhone(id);
      }
    } catch (e) {
      console.error("Lỗi tạo phòng ghép nối:", e);
    } finally {
      setLoading(false);
    }
  };

  const startListeningToPhone = (id: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/remote/stream?roomId=${id}`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const room = JSON.parse(event.data);
        if (room.phoneConnected && !connectedDevice) {
          const name = room.phoneDeviceName || "Điện thoại";
          setConnectedDevice(name);
          playLabSound("pick");
          if (onPhoneConnected) onPhoneConnected(name);
        }

        // Bơm trực tiếp dữ liệu cảm biến từ điện thoại vào bộ quản lý cảm biến thiết bị của Laptop
        if (room.sensorData) {
          const s = room.sensorData;
          if (s.isPourTilted) {
            deviceSensors.simulatePour(s.pourIntensity || 0.8);
          } else {
            deviceSensors.simulatePour(0);
          }

          if (s.isShaking) {
            deviceSensors.simulateShake();
          }
        }

        // Xử lý các hành động dứt khoát
        if (room.actions && room.actions.length > 0) {
          const lastAction = room.actions[room.actions.length - 1];
          const now = Date.now();
          if (now - lastAction.timestamp < 1200) {
            if (lastAction.type === "pour") {
              deviceSensors.simulatePour(0.9);
            } else if (lastAction.type === "shake") {
              deviceSensors.simulateShake();
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };

    sse.onerror = () => {
      // Tự động thử lại
    };
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && lanUrl) {
      navigator.clipboard.writeText(lanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const qrCodeUrl = lanUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        lanUrl
      )}&color=ffffff&bgcolor=0f172a&margin=1`
    : "";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-md w-full p-5 max-h-[88vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 shadow-2xl text-slate-100 ring-1 ring-white/10 relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tiêu đề */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              Kết Nối Điện Thoại Làm Tay Cầm Cảm Biến
            </h2>
            <p className="text-xs text-slate-400">
              Cầm điện thoại nghiêng rót & lắc trộn • Đồng bộ tức thì lên Laptop
            </p>
          </div>
        </div>

        {/* Trạng thái kết nối */}
        <div className="my-4">
          {connectedDevice ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 text-emerald-300 flex items-center gap-3 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">
                  Đã kết nối thành công với: {connectedDevice}
                </p>
                <p className="text-[11px] text-emerald-400">
                  Bây giờ bạn có thể cầm điện thoại nghiêng rót và lắc trộn trên màn hình này!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Đang chờ điện thoại kết nối vào phòng...</span>
              </div>
              <button
                onClick={createRoom}
                disabled={loading}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Tạo mã PIN mới"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                <span>Đổi mã</span>
              </button>
            </div>
          )}
        </div>

        {/* Nội dung kết nối: Mã PIN 6 Chữ Số & Mã QR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-4">
          {/* Cột 1: Mã PIN Lớn */}
          <div className="flex flex-col items-center justify-center text-center p-3 border-b sm:border-b-0 sm:border-r border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
              Mã PIN Ghép Nối
            </span>
            <div className="text-4xl font-black font-mono tracking-widest text-emerald-400 bg-slate-900 px-4 py-2 rounded-2xl border border-emerald-500/40 shadow-inner my-1">
              {roomId ? `${roomId.slice(0, 3)} ${roomId.slice(3)}` : "------"}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Nhập mã này trên điện thoại tại trang <strong>/remote</strong>
            </p>
          </div>

          {/* Cột 2: Quét Mã QR */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">
              Hoặc Quét Mã QR
            </span>
            {qrCodeUrl ? (
              <div className="p-2 bg-slate-900 rounded-2xl border border-slate-700 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="QR Code kết nối điện thoại"
                  className="w-28 h-28 rounded-lg"
                />
              </div>
            ) : (
              <div className="w-28 h-28 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-600 text-xs">
                Đang tạo QR...
              </div>
            )}
            <span className="text-[10px] text-slate-500 mt-1.5">
              Mở Camera điện thoại quét mã là xong
            </span>
          </div>
        </div>

        {/* Link kết nối trực tiếp & Copy */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 mb-5 text-xs">
          <input
            type="text"
            readOnly
            value={lanUrl}
            className="flex-1 bg-transparent px-2 text-slate-400 font-mono text-[11px] outline-none truncate"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép link</span>
              </>
            )}
          </button>
        </div>

        {/* Nút đóng / hoàn tất */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>{connectedDevice ? "Bắt đầu làm thí nghiệm" : "Đóng cửa sổ (Chạy ngầm)"}</span>
        </button>
      </div>
    </div>
  );
}

