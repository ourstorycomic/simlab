"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDeviceSensors } from "@/hooks/useDeviceSensors";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Droplets,
  RotateCcw,
  Zap,
  Flame,
  ArrowDown,
  Layers,
} from "lucide-react";

function RemoteControllerContent() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("room") || "";

  const [roomIdInput, setRoomIdInput] = useState(initialRoom);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    isSupported,
    permissionGranted,
    requestPermission,
    pitch,
    roll,
    isPourTilted,
    pourIntensity,
    isShaking,
    triggerHaptic,
    simulatePour,
    simulateShake,
  } = useDeviceSensors();

  const lastSentRef = useRef<number>(0);

  // Tự động kết nối nếu có mã phòng trong URL
  useEffect(() => {
    if (initialRoom && initialRoom.length === 6 && !connected) {
      handleConnect(initialRoom);
    }
  }, [initialRoom]);

  const handleConnect = async (roomToJoin: string) => {
    const cleanRoom = roomToJoin.trim();
    if (cleanRoom.length !== 6) {
      setErrorMessage("Mã PIN phòng phải gồm 6 chữ số.");
      return;
    }

    setConnecting(true);
    setErrorMessage(null);

    // Kích hoạt quyền cảm biến điện thoại
    await requestPermission();

    try {
      const deviceName =
        typeof navigator !== "undefined"
          ? /iPhone|iPad/i.test(navigator.userAgent)
            ? "Apple iPhone"
            : /Android/i.test(navigator.userAgent)
            ? "Android Phone"
            : "Thiết bị di động"
          : "Điện thoại";

      const res = await fetch("/api/remote/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          roomId: cleanRoom,
          deviceName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể kết nối tới phòng này.");
      }

      setActiveRoomId(cleanRoom);
      setConnected(true);
      triggerHaptic([40, 60, 40]);
    } catch (e: any) {
      setErrorMessage(e.message || "Lỗi kết nối tới Laptop. Hãy kiểm tra lại mã PIN.");
    } finally {
      setConnecting(false);
    }
  };

  // Gửi dữ liệu con quay hồi chuyển & gia tốc từ điện thoại lên phòng của Laptop
  useEffect(() => {
    if (!connected || !activeRoomId) return;

    const now = Date.now();
    // Giới hạn tần số gửi 25 lần/giây (40ms) để siêu mượt và không nghẽn mạng
    if (now - lastSentRef.current < 40) return;
    lastSentRef.current = now;

    fetch("/api/remote/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: activeRoomId,
        sensorData: {
          pitch,
          roll,
          isPourTilted,
          pourIntensity,
          isShaking,
        },
      }),
    }).catch(() => {});
  }, [connected, activeRoomId, pitch, roll, isPourTilted, pourIntensity, isShaking]);

  // Gửi lệnh hành động đặc biệt (Rót dứt khoát, Lắc trộn)
  const sendAction = (type: "pour" | "shake" | "switch_item" | "clean") => {
    if (!connected || !activeRoomId) return;

    if (type === "pour") triggerHaptic([50, 70]);
    if (type === "shake") triggerHaptic([40, 60, 40]);

    fetch("/api/remote/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: activeRoomId,
        action: { type, timestamp: Date.now() },
        sensorData: {
          pitch,
          roll,
          isPourTilted: type === "pour" ? true : isPourTilted,
          pourIntensity: type === "pour" ? 1.0 : pourIntensity,
          isShaking: type === "shake" ? true : isShaking,
        },
      }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none font-sans overflow-hidden">
      {/* ─── Top Bar: Trạng thái & Tiêu đề ─── */}
      <header className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wide">
              SimLab Wand Remote
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Tay cầm cảm biến Phòng thí nghiệm ảo
            </p>
          </div>
        </div>

        {connected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Phòng: {activeRoomId}</span>
          </div>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono">
            Chưa kết nối
          </span>
        )}
      </header>

      {/* ─── MAIN CONTENT ─── */}
      {!connected ? (
        // ── Form Ghép nối 6 Chữ Số ──
        <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center mb-5 ring-1 ring-white/10">
            <Zap className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">
            Ghép Nối Với Laptop / PC
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Nhập mã PIN 6 chữ số đang hiển thị trên màn hình Laptop của bạn để kết nối điện thoại làm tay cầm cảm biến.
          </p>

          <div className="w-full space-y-3">
            <div className="relative">
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.replace(/\D/g, ""))}
                placeholder="482 195"
                className="w-full text-center text-3xl font-black font-mono tracking-widest bg-slate-900/90 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl py-3 text-white placeholder-slate-600 outline-none transition-all shadow-inner"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={() => handleConnect(roomIdInput)}
              disabled={connecting || roomIdInput.length !== 6}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {connecting ? (
                <span>Đang kết nối tới Laptop...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kết Nối Ngay</span>
                </>
              )}
            </button>
          </div>
        </main>
      ) : (
        // ── Giao diện Tay Cầm Điều Khiển Chân Thật (Connected Controller) ──
        <main className="flex-1 flex flex-col justify-around py-4 max-w-sm mx-auto w-full text-center">
          {/* Mô phỏng Góc Nghiêng Trọng Lực 3D của Ống Nghiệm */}
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            {/* Vòng hào quang góc nghiêng */}
            <div
              className={`absolute inset-0 rounded-full border-2 transition-all duration-100 ${
                isPourTilted
                  ? "border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-105"
                  : isShaking
                  ? "border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.35)] scale-105"
                  : "border-slate-800"
              }`}
            />

            {/* Bình / Ống nghiệm ảo nghiêng đồng bộ theo điện thoại */}
            <div
              className="relative w-20 h-28 border-3 border-white/60 rounded-b-2xl rounded-t-sm flex flex-col justify-end p-1 transition-transform duration-75 shadow-2xl backdrop-blur-md bg-white/5"
              style={{
                transform: `rotate(${Math.max(-75, Math.min(75, -roll * 1.1))}deg) scale(${
                  isShaking ? 1.1 : 1.0
                })`,
              }}
            >
              {/* Dung dịch lỏng tự động dốc theo trọng lực */}
              <div
                className={`w-full rounded-b-xl transition-all duration-150 ${
                  isPourTilted
                    ? "bg-gradient-to-t from-emerald-500 to-cyan-400 h-3/4"
                    : "bg-gradient-to-t from-blue-600 to-cyan-500 h-1/2"
                }`}
              />
              {/* Bong bóng khí khi lắc */}
              {isShaking && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                </div>
              )}
            </div>

            {/* Dòng suối rót nước phun ra khi nghiêng */}
            {isPourTilted && (
              <div className="absolute top-2 -right-4 flex flex-col items-center animate-bounce">
                <span className="text-[10px] font-bold text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Đang rót!
                </span>
                <div className="w-1.5 h-12 bg-gradient-to-b from-cyan-400 to-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Dữ liệu góc nghiêng thời gian thực */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">Độ chúc rót (Pitch)</span>
              <span className="font-bold text-white font-mono text-sm">
                {pitch}° {isPourTilted && "💧"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">Nghiêng lắc (Roll)</span>
              <span className="font-bold text-white font-mono text-sm">
                {roll}° {isShaking && "🌀"}
              </span>
            </div>
          </div>

          {/* ── Bộ Phím Xúc Giác Lớn Dễ Bấm (Tactile Haptic Action Buttons) ── */}
          <div className="space-y-2.5 w-full">
            {/* Phím Rót Lớn */}
            <button
              onClick={() => sendAction("pour")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-400/30"
            >
              <Droplets className="w-5 h-5 text-emerald-300" />
              <span>RÓT VÀO CỐC (POUR)</span>
            </button>

            {/* Phím Lắc Trộn Lớn */}
            <button
              onClick={() => sendAction("shake")}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>LẮC TRỘN PHẢN ỨNG (SHAKE)</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-500 leading-tight">
            💡 Bạn có thể <strong>cầm nghiêng điện thoại</strong> hoặc <strong>lắc điện thoại thật</strong>, màn hình Laptop sẽ đồng bộ chuyển động tức thì!
          </p>
        </main>
      )}

      {/* ─── Footer ─── */}
      <footer className="text-center py-2 text-[10px] text-slate-600">
        SimLab Edu • Multi-Device Laboratory Wand
      </footer>
    </div>
  );
}

export default function RemoteControllerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] text-white p-6">Đang tải tay cầm...</div>}>
      <RemoteControllerContent />
    </Suspense>
  );
}

