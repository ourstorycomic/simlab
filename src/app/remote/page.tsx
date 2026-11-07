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
  Compass,
  FlaskConical,
} from "lucide-react";

const COMMON_CHEMICALS = [
  { name: "Đồng(II) Sunfat", formula: "CuSO4", color: "#38bdf8", id: "cuso4" },
  { name: "Axit Clohidric", formula: "HCl", color: "#e2e8f0", id: "hcl" },
  { name: "Natri Hiđroxit", formula: "NaOH", color: "#f1f5f9", id: "naoh" },
  { name: "Phenolphthalein", formula: "C20H14O4", color: "#f43f5e", id: "phenolphthalein" },
  { name: "Sắt(II) Sunfat", formula: "FeSO4", color: "#86efac", id: "feso4" },
  { name: "Nước cất", formula: "H2O", color: "#67e8f9", id: "h2o" },
];

function RemoteControllerContent() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("room") || "";

  const [roomIdInput, setRoomIdInput] = useState(initialRoom);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sensorActivated, setSensorActivated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mức chất lỏng trong bình trên điện thoại (100% -> giảm dần khi dốc đổ)
  const [fillPercent, setFillPercent] = useState<number>(100);
  const [beakerFillPercent, setBeakerFillPercent] = useState<number>(0);
  const [chemicalName, setChemicalName] = useState<string>("Đồng(II) Sunfat");
  const [chemicalFormula, setChemicalFormula] = useState<string>("CuSO4");
  const [liquidColor, setLiquidColor] = useState<string>("#38bdf8");

  const {
    isSupported,
    permissionGranted,
    requestPermission,
    calibrateZero,
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
  const connectTimeRef = useRef<number>(Date.now());

  // Tọa độ điều khiển tự do kéo thả (Touchpad / Drag controller)
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const cX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cY = "touches" in e ? e.touches[0].clientY : e.clientY;
    touchStartRef.current = {
      clientX: cX,
      clientY: cY,
      initX: touchOffset.x,
      initY: touchOffset.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current) return;
    const cX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const deltaX = (cX - touchStartRef.current.clientX) / 120;
    const deltaY = (touchStartRef.current.clientY - cY) / 120; // Vuốt lên là nhấc chai lên (+Y)
    const nextX = Math.max(-1.0, Math.min(1.0, touchStartRef.current.initX + deltaX));
    const nextY = Math.max(-1.0, Math.min(1.0, touchStartRef.current.initY + deltaY));
    setTouchOffset({ x: nextX, y: nextY });
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleResetPosition = () => {
    setTouchOffset({ x: 0, y: 0 });
    triggerHaptic(40);
  };

  // Tự động kết nối phòng nếu có mã phòng trong URL
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

  // Kích hoạt cảm biến và Cân bằng góc 0° bằng cử chỉ chạm trực tiếp của người dùng
  const handleActivateAndCalibrate = async () => {
    connectTimeRef.current = Date.now();
    await requestPermission();
    calibrateZero();
    setSensorActivated(true);
    triggerHaptic([30, 40]);
  };

  // Góc nghiêng tương đối sau khi đã cân bằng 0°
  // Roll dương = nghiêng sang phải, Roll âm = nghiêng sang trái
  const tiltDeg = Math.max(-85, Math.min(85, roll * 1.15));

  // CHỈ COI LÀ RÓT KHI NGHIÊNG THỰC TẾ TRÊN ĐỜI THẬT:
  // 1. Phải sau ít nhất 1.0s kết nối/kích hoạt để tránh vừa kết nối đã tự động rớt chất
  // 2. Nghiêng dốc rõ rệt (> 20° nghiêng) hoặc dốc chúc mũi điện thoại xuống (pitch < -20°)
  // 3. Tuyệt đối không rót khi pitch > 20° (đang giơ điện thoại nhìn vào màn hình)
  const isGracePeriodOver = Date.now() - connectTimeRef.current > 1000;
  const isPitchPour = pitch < -20;
  const isRollPour = Math.abs(tiltDeg) > 20;
  const isActualPouring = isGracePeriodOver && (isRollPour || isPitchPour) && fillPercent > 2;
  const pourDirection = tiltDeg < -10 ? "left" : "right";

  // Khi đang dốc bình: Nước chảy ra ngoài, mức nước giảm dần và rung haptic
  useEffect(() => {
    if (isActualPouring && connected && sensorActivated) {
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
  }, [isActualPouring, connected, sensorActivated, triggerHaptic]);

  // Gửi dữ liệu cảm biến từ điện thoại lên Laptop liên tục (25fps)
  useEffect(() => {
    if (!connected || !activeRoomId || !sensorActivated) return;

    const now = Date.now();
    if (now - lastSentRef.current < 40) return;
    lastSentRef.current = now;

    const motionPayload = {
      pitch,
      roll: tiltDeg,
      isPourTilted: isActualPouring,
      pourIntensity: isActualPouring
        ? Math.min(1.0, Math.max((Math.abs(tiltDeg) - 20) / 25, (Math.abs(pitch) - 20) / 25))
        : 0,
      isShaking,
      touchX: touchOffset.x,
      touchY: touchOffset.y,
      chemicalName,
      chemicalFormula,
      liquidColor,
    };

    if (phoneSenderRef.current) {
      phoneSenderRef.current.sendMotion(motionPayload);
    }

    fetch("/api/remote/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: activeRoomId,
        sensorData: motionPayload,
      }),
    }).catch(() => {});
  }, [connected, activeRoomId, sensorActivated, pitch, tiltDeg, isActualPouring, isShaking, touchOffset, chemicalName, chemicalFormula, liquidColor]);

  // Làm đầy lại bình hóa chất
  const handleRefillBottle = () => {
    setFillPercent(100);
    setBeakerFillPercent(0);
    triggerHaptic([40, 50]);
    if (phoneSenderRef.current) {
      phoneSenderRef.current.sendAction({ type: "clean", timestamp: Date.now() });
    }
  };

  // Chọn hóa chất nạp vào bình trực tiếp từ điện thoại
  const handleSelectChemical = (chem: (typeof COMMON_CHEMICALS)[0]) => {
    setChemicalName(chem.name);
    setChemicalFormula(chem.formula);
    setLiquidColor(chem.color);
    setFillPercent(100);
    triggerHaptic([40, 40]);

    if (phoneSenderRef.current) {
      phoneSenderRef.current.sendAction({
        type: "select_chemical",
        chemicalId: chem.id,
        chemicalName: chem.name,
        chemicalFormula: chem.formula,
        liquidColor: chem.color,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-3 sm:p-4 select-none font-sans overflow-hidden">
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
              Tay cầm cảm biến • Cầm nghiêng để rót
            </p>
          </div>
        </div>

        {connected ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetPosition}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 flex items-center gap-1 font-semibold"
              title="Đưa bình về vị trí ban đầu"
            >
              <RotateCcw className="w-3 h-3 text-teal-400" />
              <span>Về giữa</span>
            </button>
            <button
              onClick={() => {
                calibrateZero();
                triggerHaptic(50);
              }}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 flex items-center gap-1 font-semibold"
              title="Cân bằng lại vị trí cầm hiện tại thành 0°"
            >
              <Compass className="w-3 h-3 text-sky-400" />
              <span>Cân bằng 0°</span>
            </button>
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeRoomId}</span>
            </div>
          </div>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono">
            Chưa kết nối
          </span>
        )}
      </header>

      {/* ─── MAIN CONTENT ─── */}
      {!connected ? (
        // ── 1. Form Ghép Nối 6 Chữ Số ──
        <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center mb-5 ring-1 ring-white/10">
            <Zap className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">
            Ghép Nối Với Laptop / PC
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Nhập mã PIN 6 chữ số đang hiển thị trên màn hình Laptop để kết nối điện thoại làm tay cầm cảm biến.
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
      ) : !sensorActivated ? (
        // ── 2. MÀN HÌNH KÍCH HOẠT CẢM BIẾN & CÂN BẰNG 0° BẰNG CHẠM TRỰC TIẾP ──
        <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center mb-5 animate-pulse">
            <Smartphone className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-base font-bold text-white mb-2">
            Đã Ghép Nối Với Phòng {activeRoomId}
          </h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed px-2">
            Hãy cầm điện thoại đứng tự nhiên trên tay như một bình hóa chất, sau đó bấm nút bên dưới để <strong className="text-emerald-400 font-bold">Kích hoạt cảm biến & Cân bằng 0°</strong>.
          </p>

          <button
            onClick={handleActivateAndCalibrate}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-white/30"
          >
            <Compass className="w-5 h-5 text-slate-950" />
            <span>BẮT ĐẦU ĐIỀU KHIỂN (CÂN BẰNG 0°)</span>
          </button>
        </main>
      ) : (
        // ── 3. Giao diện Bình Hóa Chất Chân Thật (Nghiêng Thật Ngoài Đời Là Đổ) ──
        <main className="flex-1 flex flex-col justify-between py-1 max-w-sm mx-auto w-full text-center">
          {/* Thanh hiển thị trạng thái góc nghiêng thời gian thực */}
          <div className="px-3 py-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-slate-300 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isActualPouring ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
              <span className="font-semibold text-slate-200">
                Góc nghiêng: <strong className={isActualPouring ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>{Math.round(tiltDeg)}°</strong>
              </span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
              isActualPouring
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-800 text-slate-400"
            }`}>
              {isActualPouring ? (pourDirection === "left" ? "ĐANG RÓT SANG TRÁI" : "ĐANG RÓT VÀO CỐC") : "THẲNG ĐỨNG TRÊN TAY"}
            </span>
          </div>

          {/* ── KHU VỰC BÌNH HÓA CHẤT & TOUCHPAD TỰ DO ── */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            className="relative w-full h-72 flex items-center justify-center my-auto overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
          >
            {/* Vòng hào quang định vị góc nghiêng */}
            <div
              className={`absolute w-60 h-60 rounded-full border transition-all duration-200 pointer-events-none ${
                isActualPouring
                  ? "border-cyan-400/80 shadow-[0_0_40px_rgba(56,189,248,0.5)] scale-105"
                  : isShaking
                  ? "border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.5)] scale-105 animate-pulse"
                  : "border-slate-800/80"
              }`}
            />

            {/* BÌNH HÓA CHẤT THỦY TINH VECTOR CAO CẤP */}
            <div
              className="relative transition-transform duration-75 ease-out select-none pointer-events-none"
              style={{
                transform: `translate(${touchOffset.x * 40}px, ${-touchOffset.y * 30}px) rotate(${tiltDeg}deg) scale(${isShaking ? 1.05 : 1.0})`,
                transformOrigin: "50% 80%",
              }}
            >
              <svg width="140" height="210" viewBox="0 0 150 220" className="drop-shadow-2xl overflow-visible">
                <defs>
                  <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                    <stop offset="15%" stopColor="rgba(255,255,255,0.12)" />
                    <stop offset="70%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="90%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.50)" />
                  </linearGradient>

                  <linearGradient id="stopperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(241,245,249,0.7)" />
                    <stop offset="50%" stopColor="rgba(148,163,184,0.4)" />
                    <stop offset="100%" stopColor="rgba(241,245,249,0.8)" />
                  </linearGradient>

                  <linearGradient id="glassShineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                    <stop offset="60%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                  </linearGradient>

                  <clipPath id="flaskInnerClip">
                    <path d="M 62 48 L 88 48 L 88 78 Q 132 88 132 128 L 132 196 Q 132 212 116 212 L 34 212 Q 18 212 18 196 L 18 128 Q 18 88 62 78 Z" />
                  </clipPath>
                </defs>

                {/* 1. NÚT MÀI THỦY TINH TRÊN NẮP */}
                <g>
                  <rect x="58" y="6" width="34" height="15" rx="5" fill="url(#stopperGrad)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                  <polygon points="63,21 87,21 84,36 66,36" fill="url(#stopperGrad)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <line x1="68" y1="9" x2="68" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <line x1="75" y1="9" x2="75" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <line x1="82" y1="9" x2="82" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                </g>

                {/* 2. VÀNH MIỆNG BÌNH RÓT */}
                <ellipse cx="75" cy="36" rx="20" ry="5.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
                <ellipse cx="75" cy="36" rx="14" ry="3.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

                {/* 2.5. NỀN THÂN BÌNH THỦY TINH */}
                <path
                  d="M 62 38 L 88 38 L 88 78 Q 132 88 132 128 L 132 196 Q 132 212 116 212 L 34 212 Q 18 212 18 196 L 18 128 Q 18 88 62 78 Z"
                  fill="#0b1329"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth="2.5"
                />

                {/* 3. DUNG DỊCH HÓA CHẤT BÊN TRONG */}
                <g clipPath="url(#flaskInnerClip)">
                  <rect
                    x="10"
                    y={212 - (fillPercent * 1.55)}
                    width="130"
                    height="215"
                    fill={liquidColor}
                    opacity={0.88}
                    className="transition-all duration-100 ease-out"
                  />

                  {/* Mặt thoáng chất lỏng (Meniscus) nghiêng ngược góc để giữ thăng bằng tự nhiên */}
                  <ellipse
                    cx="75"
                    cy={212 - (fillPercent * 1.55)}
                    rx="56"
                    ry="9"
                    fill="rgba(255,255,255,0.4)"
                    style={{
                      transform: `rotate(${-tiltDeg}deg)`,
                      transformOrigin: `75px ${212 - (fillPercent * 1.55)}px`,
                    }}
                    className="transition-transform duration-75"
                  />

                  {/* Bọt khí sủi tăm khi lắc trộn */}
                  {isShaking && (
                    <g className="animate-pulse">
                      <circle cx="45" cy="180" r="3" fill="white" opacity="0.8" />
                      <circle cx="75" cy="160" r="4.5" fill="white" opacity="0.9" />
                      <circle cx="105" cy="175" r="3.5" fill="white" opacity="0.85" />
                    </g>
                  )}
                </g>

                {/* 4. VỎ THỦY TINH BÌNH HÓA CHẤT */}
                <path
                  d="M 62 38 L 88 38 L 88 78 Q 132 88 132 128 L 132 196 Q 132 212 116 212 L 34 212 Q 18 212 18 196 L 18 128 Q 18 88 62 78 Z"
                  fill="url(#glassBodyGrad)"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* 5. VẠCH CHIA ĐỘ THỂ TÍCH */}
                <g className="font-mono text-[7.5px] fill-white/80 select-none">
                  <line x1="22" y1="80" x2="32" y2="80" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                  <text x="35" y="83">200ml</text>

                  <line x1="22" y1="120" x2="30" y2="120" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                  <text x="33" y="123">150ml</text>

                  <line x1="22" y1="160" x2="30" y2="160" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                  <text x="33" y="163">100ml</text>
                </g>

                {/* 6. TEM NHÃN DÁN HÓA CHẤT TIÊU CHUẨN */}
                <g className="select-none pointer-events-none">
                  <rect x="36" y="112" width="78" height="52" rx="4" fill="rgba(255,255,255,0.96)" stroke="#cbd5e1" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
                  <text x="75" y="130" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                    {chemicalFormula}
                  </text>
                  <text x="75" y="144" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                    {chemicalName}
                  </text>
                  <text x="75" y="157" textAnchor="middle" fill="#64748b" fontSize="6.5" fontWeight="600" fontFamily="sans-serif">
                    ⚠️ GHS07 • Dung dịch P.A
                  </text>
                </g>

                {/* 7. VỆT SÁNG PHẢN CHIẾU THỦY TINH */}
                <path
                  d="M 126 128 L 126 195 Q 126 206 116 206"
                  fill="none"
                  stroke="url(#glassShineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* TIA NƯỚC RÓT CHẢY KHI DỐC BÌNH */}
              {isActualPouring && (
                <div
                  className={`absolute top-6 pointer-events-none z-30 flex flex-col items-center ${
                    pourDirection === "left" ? "-left-10" : "-right-10"
                  }`}
                  style={{
                    transform: `rotate(${-tiltDeg}deg)`,
                  }}
                >
                  <div
                    className="w-3 h-40 rounded-full shadow-lg animate-pulse"
                    style={{
                      background: `linear-gradient(to bottom, ${liquidColor}, rgba(255,255,255,0.9), ${liquidColor})`,
                      boxShadow: `0 0 16px ${liquidColor}`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* CỐC ĐONG THỦY TINH CÓ MỎ HỨNG BÊN DƯỚI */}
            <div className="absolute -bottom-1 right-2 flex flex-col items-center select-none pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold mb-0.5">Cốc hứng ({Math.round(beakerFillPercent)}%)</span>
              <svg width="84" height="98" viewBox="0 0 88 105" className="drop-shadow-xl overflow-visible">
                <defs>
                  <clipPath id="beakerInnerClip">
                    <rect x="10" y="16" width="68" height="84" rx="4" />
                  </clipPath>
                </defs>

                <g clipPath="url(#beakerInnerClip)">
                  <rect
                    x="10"
                    y={100 - (beakerFillPercent * 0.85)}
                    width="68"
                    height="85"
                    fill={liquidColor}
                    opacity={0.85}
                    className="transition-all duration-150 ease-out"
                  />
                </g>

                <path
                  d="M 6 16 L 12 20 L 12 96 Q 12 102 18 102 L 70 102 Q 76 102 76 96 L 76 16 Q 80 16 80 14 Q 76 12 72 16 L 16 16 Z"
                  fill="rgba(255,255,255,0.08)"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* HƯỚNG DẪN ĐIỀU KHIỂN ĐA NĂNG */}
          <div className="py-1 px-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[10.5px] text-slate-400 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-cyan-300 font-medium">
              🖐️ Vuốt bình: <strong>Di chuyển tự do</strong>
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              📐 Nghiêng máy: <strong>Dốc rót vào cốc</strong>
            </span>
          </div>

          {/* CHỌN NHANH HÓA CHẤT TRÊN ĐIỆN THOẠI & NÚT ĐỔ ĐẦY LẠI */}
          <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <FlaskConical className="w-3 h-3 text-cyan-400" />
                <span>Nạp hóa chất vào bình:</span>
              </span>
              <button
                onClick={handleRefillBottle}
                className="text-[10px] text-sky-300 hover:text-white px-2 py-0.5 rounded-lg bg-sky-950/80 border border-sky-800 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Đổ đầy lại</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {COMMON_CHEMICALS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectChemical(c)}
                  className={`p-1.5 rounded-xl border text-left transition-all ${
                    chemicalFormula === c.formula
                      ? "bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50"
                      : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span className="block text-[11px] font-black text-cyan-300">{c.formula}</span>
                  <span className="block text-[9px] text-slate-400 truncate">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800/80">
              💡 Cầm nghiêng điện thoại &gt; 20° để rót • Lắc điện thoại để hòa trộn phản ứng
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default function RemotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-300 text-xs">
          Đang nạp SimLab Wand Remote...
        </div>
      }
    >
      <RemoteControllerContent />
    </Suspense>
  );
}
