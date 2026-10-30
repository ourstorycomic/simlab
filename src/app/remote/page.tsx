"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDeviceSensors } from "@/hooks/useDeviceSensors";
import { remoteSyncService } from "@/lib/remoteSyncService";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
} from "lucide-react";

function RemoteControllerContent() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("room") || "";

  const [roomIdInput, setRoomIdInput] = useState(initialRoom);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mức chất lỏng trong bình trên điện thoại (100% -> giảm dần khi dốc đổ)
  const [fillPercent, setFillPercent] = useState<number>(85);
  const [beakerFillPercent, setBeakerFillPercent] = useState<number>(0);
  const [chemicalName, setChemicalName] = useState<string>("Đồng(II) Sunfat");
  const [chemicalFormula, setChemicalFormula] = useState<string>("CuSO4");
  const [liquidColor, setLiquidColor] = useState<string>("#38bdf8");

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
  } = useDeviceSensors();

  const phoneSenderRef = useRef<any>(null);
  const lastSentRef = useRef<number>(0);
  const pourIntervalRef = useRef<any>(null);

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

    // Kích hoạt cảm biến chuyển động điện thoại
    await requestPermission();

    const deviceName =
      typeof navigator !== "undefined"
        ? /iPhone|iPad/i.test(navigator.userAgent)
          ? "Apple iPhone"
          : /Android/i.test(navigator.userAgent)
          ? "Android Phone"
          : "Thiết bị di động"
        : "Điện thoại";

    try {
      // 1. Kênh chính: Supabase Realtime Broadcast (WebSockets tức thì < 20ms)
      const sender = remoteSyncService.connectFromPhone(cleanRoom, deviceName, {
        onSubscribed: () => {
          setActiveRoomId(cleanRoom);
          setConnected(true);
          triggerHaptic([40, 60, 40]);
        },
      });
      phoneSenderRef.current = sender;

      // 2. Kênh phụ: HTTP join route để lưu session
      fetch("/api/remote/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          roomId: cleanRoom,
          deviceName,
        }),
      }).catch(() => {});

      setActiveRoomId(cleanRoom);
      setConnected(true);
      triggerHaptic([40, 60, 40]);
    } catch (e: any) {
      setErrorMessage(e.message || "Lỗi kết nối tới Laptop. Hãy kiểm tra lại mã PIN.");
    } finally {
      setConnecting(false);
    }
  };

  // Xác định góc nghiêng thực tế: Nghiêng trái dốc trái, nghiêng phải dốc phải
  // Đảo lại dấu: roll dương = nghiêng phải, roll âm = nghiêng trái
  const tiltDeg = Math.max(-85, Math.min(85, roll * 1.15));

  // Kiểm tra điều kiện đang dốc bình rót ngoài đời thực:
  // 1. Nghiêng trái quá 22° HOẶC nghiêng phải quá 22°
  // 2. HOẶC dốc đầu điện thoại chúc xuống (pitch < 48° hoặc isPourTilted)
  const isActualPouring = (Math.abs(tiltDeg) > 22 || isPourTilted) && fillPercent > 5;
  const pourDirection = tiltDeg < 0 ? "left" : "right";

  // Khi đang dốc bình: Nước chảy ra ngoài, mức nước giảm dần và rung haptic
  useEffect(() => {
    if (isActualPouring && connected) {
      triggerHaptic([25, 35]);

      if (!pourIntervalRef.current) {
        pourIntervalRef.current = setInterval(() => {
          setFillPercent((prev) => {
            if (prev <= 5) return 0;
            return Math.max(0, prev - 4);
          });
          setBeakerFillPercent((prev) => Math.min(85, prev + 4));
          triggerHaptic(30);
        }, 120);
      }
    } else {
      if (pourIntervalRef.current) {
        clearInterval(pourIntervalRef.current);
        pourIntervalRef.current = null;
      }
    }

    return () => {
      if (pourIntervalRef.current) {
        clearInterval(pourIntervalRef.current);
        pourIntervalRef.current = null;
      }
    };
  }, [isActualPouring, connected, triggerHaptic]);

  // Gửi dữ liệu con quay hồi chuyển & gia tốc từ điện thoại lên Laptop liên tục (25fps)
  useEffect(() => {
    if (!connected || !activeRoomId) return;

    const now = Date.now();
    if (now - lastSentRef.current < 40) return;
    lastSentRef.current = now;

    const motionPayload = {
      pitch,
      roll: tiltDeg,
      isPourTilted: isActualPouring,
      pourIntensity: isActualPouring ? Math.max(pourIntensity, Math.min(1.0, Math.abs(tiltDeg) / 50)) : 0,
      isShaking,
      chemicalName,
      chemicalFormula,
      liquidColor,
    };

    // 1. Gửi qua Supabase Realtime Broadcast (Tức thì < 20ms)
    if (phoneSenderRef.current) {
      phoneSenderRef.current.sendMotion(motionPayload);
    }

    // 2. Gửi qua HTTP Sync (Fallback)
    fetch("/api/remote/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: activeRoomId,
        sensorData: motionPayload,
      }),
    }).catch(() => {});
  }, [connected, activeRoomId, pitch, tiltDeg, isActualPouring, pourIntensity, isShaking, chemicalName, chemicalFormula, liquidColor]);

  // Làm đầy lại bình (Reset bình khi muốn đổ lại)
  const handleRefillBottle = () => {
    setFillPercent(90);
    setBeakerFillPercent(0);
    triggerHaptic([40, 50]);
    if (phoneSenderRef.current) {
      phoneSenderRef.current.sendAction({ type: "clean", timestamp: Date.now() });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 select-none font-sans overflow-hidden">
      {/* ─── Top Bar: Trạng thái & Tiêu đề ─── */}
      <header className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-wide">
              SimLab Wand Remote
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Tay cầm cảm biến • Thao tác như đời thật
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
        // ── Giao diện Bình Hóa Chất Chân Thật (Nghiêng Là Đổ, Lắc Là Trộn) ──
        <main className="flex-1 flex flex-col justify-between py-2 max-w-sm mx-auto w-full text-center">
          {/* Hướng dẫn thao tác tự nhiên */}
          <div className="px-3 py-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-slate-300 text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <span>📱</span>
              <span>Cầm nghiêng để rót • Lắc để trộn</span>
            </span>
            <button
              onClick={handleRefillBottle}
              className="text-[10px] text-sky-400 hover:text-white px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-800 flex items-center gap-1"
              title="Lấy lại đầy bình hóa chất"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Đổ đầy lại</span>
            </button>
          </div>

          {/* ── KHU VỰC BÌNH HÓA CHẤT 3D CHUẨN XÁC ── */}
          <div className="relative w-full h-72 flex items-center justify-center my-auto">
            {/* Vòng định vị góc nghiêng */}
            <div
              className={`absolute w-56 h-56 rounded-full border transition-all duration-150 ${
                isActualPouring
                  ? "border-cyan-400/80 shadow-[0_0_35px_rgba(56,189,248,0.4)] scale-105"
                  : isShaking
                  ? "border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.4)] scale-105 animate-pulse"
                  : "border-slate-800/80"
              }`}
            />

            {/* MÔ HÌNH BÌNH THỦY TINH CHUYÊN DỤNG (Reagent Flask) */}
            <div
              className="relative transition-transform duration-75 ease-out select-none"
              style={{
                transform: `rotate(${tiltDeg}deg) scale(${isShaking ? 1.08 : 1.0})`,
                transformOrigin: "50% 75%",
              }}
            >
              {/* Thân bình thủy tinh dáng chuẩn phòng thí nghiệm */}
              <div className="relative w-32 h-44 flex flex-col items-center">
                {/* Vành miệng bình rót (Rim / Spout) */}
                <div className="w-14 h-4 bg-slate-200/40 border-2 border-white/80 rounded-t-lg shadow-sm" />

                {/* Cổ bình thon dài (Neck) */}
                <div className="w-10 h-10 bg-slate-200/20 border-x-2 border-white/70 relative overflow-hidden backdrop-blur-sm" />

                {/* Thân bình bầu bĩnh (Flask Body) */}
                <div className="w-32 h-30 bg-slate-200/15 border-2 border-t-0 border-white/80 rounded-b-3xl rounded-t-sm relative overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-end p-1">
                  {/* Vạch chia độ ml màu trắng trên thân bình */}
                  <div className="absolute left-2 top-4 flex flex-col gap-3 text-[8px] text-white/70 font-mono select-none">
                    <span>- 150ml</span>
                    <span>- 100ml</span>
                    <span>- 50ml</span>
                  </div>

                  {/* Tem nhãn dán hóa chất trên thân bình */}
                  <div className="absolute inset-x-4 top-10 bg-white/95 rounded-lg py-1 px-1.5 shadow-md border border-slate-300 text-slate-900 text-center pointer-events-none z-20">
                    <div className="text-xs font-black tracking-wider text-slate-900">
                      {chemicalFormula}
                    </div>
                    <div className="text-[8px] font-semibold text-slate-600 truncate">
                      {chemicalName}
                    </div>
                  </div>

                  {/* Dung dịch lỏng bên trong bình (Tự cân bằng mặt thoáng theo trọng lực) */}
                  <div
                    className="w-full rounded-b-2xl transition-all duration-100 relative overflow-hidden shadow-inner"
                    style={{
                      height: `${fillPercent}%`,
                      backgroundColor: liquidColor,
                      opacity: 0.88,
                    }}
                  >
                    {/* Mặt thoáng dung dịch nghiêng ngược góc để luôn nằm ngang theo trọng lực */}
                    <div
                      className="absolute inset-x-0 -top-2 h-4 bg-white/40 rounded-full blur-[1px] transition-transform duration-75"
                      style={{
                        transform: `rotate(${-tiltDeg}deg) scaleX(1.4)`,
                      }}
                    />

                    {/* Bọt khí sủi bọt khi lắc */}
                    {isShaking && (
                      <div className="absolute inset-0 flex items-center justify-around">
                        <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-white/80 animate-ping delay-100" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Vết sáng phản chiếu thủy tinh (Glass Reflection Highlight) */}
                <div className="absolute right-4 top-14 w-2 h-24 bg-gradient-to-b from-white/40 to-transparent rounded-full pointer-events-none blur-[0.5px]" />
              </div>

              {/* DÒNG NƯỚC RÓT CHẢY XUỐNG KHI ĐANG DỐC BÌNH (Pour Stream) */}
              {isActualPouring && (
                <div
                  className={`absolute top-0 pointer-events-none z-30 flex flex-col items-center ${
                    pourDirection === "left" ? "-left-6" : "-right-6"
                  }`}
                  style={{
                    transform: `rotate(${-tiltDeg}deg)`,
                  }}
                >
                  {/* Tia nước chảy từ miệng bình xuống */}
                  <div
                    className="w-2.5 h-36 rounded-full shadow-lg animate-pulse"
                    style={{
                      background: `linear-gradient(to bottom, ${liquidColor}, rgba(255,255,255,0.8), ${liquidColor})`,
                      boxShadow: `0 0 12px ${liquidColor}`,
                    }}
                  />
                  {/* Giọt nước rơi lách tách */}
                  <div className="flex gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* CỐC NHẬN BÊN DƯỚI (Receiving Beaker) HỨNG DÒNG NƯỚC */}
            <div className="absolute -bottom-2 right-4 w-20 h-22 border-2 border-white/60 rounded-b-xl flex flex-col justify-end p-0.5 bg-white/5 backdrop-blur-sm shadow-xl">
              <span className="absolute -top-4 text-[9px] text-slate-400 font-bold">Cốc hứng</span>
              <div
                className="w-full rounded-b-lg transition-all duration-150"
                style={{
                  height: `${beakerFillPercent}%`,
                  backgroundColor: liquidColor,
                  opacity: 0.85,
                }}
              />
            </div>
          </div>

          {/* Dữ liệu góc nghiêng & Trạng thái con quay hồi chuyển */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-[10px]">Góc dốc bình (Roll)</span>
              <span className="font-bold text-white font-mono text-base flex items-center gap-1">
                <span>{Math.round(tiltDeg)}°</span>
                {isActualPouring && <span className="text-cyan-400 animate-bounce">💧</span>}
              </span>
              <span className="text-[9px] text-slate-500">
                {tiltDeg < -15 ? "👈 Dốc sang trái" : tiltDeg > 15 ? "👉 Dốc sang phải" : "Thẳng đứng"}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-[10px]">Lượng chất trong bình</span>
              <span className="font-bold text-emerald-400 font-mono text-base">
                {Math.round(fillPercent)}%
              </span>
              <span className="text-[9px] text-slate-500">
                {fillPercent <= 5 ? "⚠️ Đã hết (bấm Đổ đầy)" : isActualPouring ? "Đang rót..." : "Sẵn sàng"}
              </span>
            </div>
          </div>

          {/* Thông báo tương tác thời gian thực với Laptop */}
          <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-[11px]">
              Đang đồng bộ trực tiếp lên Laptop: <strong>Nghiêng là đổ • Lắc là trộn</strong>
            </span>
          </div>
        </main>
      )}

      {/* ─── Footer ─── */}
      <footer className="text-center py-1 text-[10px] text-slate-600">
        SimLab Edu • Cảm biến chuyển động phòng Lab 3D
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
