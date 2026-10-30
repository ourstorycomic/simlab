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
  const [fillPercent, setFillPercent] = useState<number>(100);
  const [beakerFillPercent, setBeakerFillPercent] = useState<number>(0);
  const [chemicalName, setChemicalName] = useState<string>("Đồng(II) Sunfat");
  const [chemicalFormula, setChemicalFormula] = useState<string>("CuSO4");
  const [liquidColor, setLiquidColor] = useState<string>("#38bdf8");
  const [isManualPouring, setIsManualPouring] = useState<boolean>(false);

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
  // 1. Nghiêng trái quá 24° HOẶC nghiêng phải quá 24°
  // 2. HOẶC dốc đầu điện thoại chúc xuống (isPourTilted)
  // 3. HOẶC nhấn giữ nút rót trên màn hình (isManualPouring)
  const isActualPouring = (Math.abs(tiltDeg) > 24 || isPourTilted || isManualPouring) && fillPercent > 2;
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
    setFillPercent(100);
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

          {/* ── KHU VỰC BÌNH HÓA CHẤT & CỐC HỨNG CHUYÊN DỤNG PHÒNG THÍ NGHIỆM ── */}
          <div className="relative w-full h-80 flex items-center justify-center my-auto overflow-hidden">
            {/* Vòng hào quang định vị góc nghiêng */}
            <div
              className={`absolute w-64 h-64 rounded-full border transition-all duration-200 pointer-events-none ${
                isActualPouring
                  ? "border-cyan-400/80 shadow-[0_0_40px_rgba(56,189,248,0.5)] scale-105"
                  : isShaking
                  ? "border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.5)] scale-105 animate-pulse"
                  : "border-slate-800/80"
              }`}
            />

            {/* BÌNH HÓA CHẤT THỦY TINH VECTOR CAO CẤP (Reagent Bottle) */}
            <div
              className="relative transition-transform duration-75 ease-out select-none"
              style={{
                transform: `rotate(${tiltDeg}deg) scale(${isShaking ? 1.05 : 1.0})`,
                transformOrigin: "50% 80%",
              }}
            >
              <svg width="150" height="220" viewBox="0 0 150 220" className="drop-shadow-2xl overflow-visible">
                <defs>
                  {/* Gradient Thủy Tinh Trong Suốt */}
                  <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                    <stop offset="15%" stopColor="rgba(255,255,255,0.12)" />
                    <stop offset="70%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="90%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.50)" />
                  </linearGradient>

                  {/* Gradient Nút Thủy Tinh Mài Nhám (Ground Stopper) */}
                  <linearGradient id="stopperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(241,245,249,0.7)" />
                    <stop offset="50%" stopColor="rgba(148,163,184,0.4)" />
                    <stop offset="100%" stopColor="rgba(241,245,249,0.8)" />
                  </linearGradient>

                  {/* Vệt Sáng Phản Chiếu Thủy Tinh */}
                  <linearGradient id="glassShineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                    <stop offset="60%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                  </linearGradient>

                  {/* Mask / Clip-path Lòng Bình Hóa Chất */}
                  <clipPath id="flaskInnerClip">
                    <path d="M 62 48 L 88 48 L 88 78 Q 132 88 132 128 L 132 196 Q 132 212 116 212 L 34 212 Q 18 212 18 196 L 18 128 Q 18 88 62 78 Z" />
                  </clipPath>
                </defs>

                {/* 1. NÚT MÀI THỦY TINH TRÊN NẮP (Glass Stopper) */}
                <g className="cursor-pointer">
                  {/* Tay nắm nút mài bo tròn */}
                  <rect x="58" y="6" width="34" height="15" rx="5" fill="url(#stopperGrad)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                  {/* Phần thân nút mài nhám cắm vào cổ bình */}
                  <polygon points="63,21 87,21 84,36 66,36" fill="url(#stopperGrad)" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  {/* Khía rãnh chống trượt trên nắp */}
                  <line x1="68" y1="9" x2="68" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <line x1="75" y1="9" x2="75" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <line x1="82" y1="9" x2="82" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                </g>

                {/* 2. VÀNH MIỆNG BÌNH RÓT LOE TRÒN (Flared Rim) */}
                <ellipse cx="75" cy="36" rx="20" ry="5.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
                <ellipse cx="75" cy="36" rx="14" ry="3.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

                {/* 3. DUNG DỊCH HÓA CHẤT BÊN TRONG (Liquid Fill inside Clip-path) */}
                <g clipPath="url(#flaskInnerClip)">
                  {/* Khối chất lỏng dâng cao theo fillPercent */}
                  <rect
                    x="10"
                    y={212 - (fillPercent * 1.55)}
                    width="130"
                    height="215"
                    fill={liquidColor}
                    opacity={0.88}
                    className="transition-all duration-100 ease-out"
                  />

                  {/* Mặt thoáng chất lỏng (Meniscus) nghiêng ngược góc để giữ thăng bằng tự nhiên theo trọng lực */}
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
                      <circle cx="60" cy="140" r="2.5" fill="white" opacity="0.75" />
                      <circle cx="90" cy="150" r="3" fill="white" opacity="0.8" />
                    </g>
                  )}
                </g>

                {/* 4. VỎ THỦY TINH BÌNH HÓA CHẤT (Thân trụ & Vai bình bầu) */}
                <path
                  d="M 62 38 L 88 38 L 88 78 Q 132 88 132 128 L 132 196 Q 132 212 116 212 L 34 212 Q 18 212 18 196 L 18 128 Q 18 88 62 78 Z"
                  fill="url(#glassBodyGrad)"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Đáy bình gia cố dày 2 lớp */}
                <path
                  d="M 22 196 Q 22 210 34 210 L 116 210 Q 128 210 128 196"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="3"
                />

                {/* 5. VẠCH CHIA ĐỘ THỂ TÍCH (Graduation Marks) */}
                <g className="font-mono text-[7.5px] fill-white/80 select-none">
                  <line x1="22" y1="80" x2="32" y2="80" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                  <text x="35" y="83">200ml</text>

                  <line x1="22" y1="115" x2="30" y2="115" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                  <text x="33" y="118">150ml</text>

                  <line x1="22" y1="150" x2="30" y2="150" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                  <text x="33" y="153">100ml</text>

                  <line x1="22" y1="185" x2="28" y2="185" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                  <text x="31" y="188">50ml</text>
                </g>

                {/* 6. TEM NHÃN DÁN HÓA CHẤT PHÒNG THÍ NGHIỆM TIÊU CHUẨN */}
                <g className="select-none pointer-events-none">
                  {/* Nền nhãn giấy trắng viền kép */}
                  <rect x="36" y="110" width="78" height="54" rx="4" fill="rgba(255,255,255,0.96)" stroke="#cbd5e1" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
                  <rect x="38.5" y="112.5" width="73" height="49" rx="2" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />

                  {/* Tên công thức hóa học to rõ */}
                  <text x="75" y="128" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
                    {chemicalFormula}
                  </text>

                  {/* Tên hóa học tiếng Việt */}
                  <text x="75" y="142" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                    {chemicalName}
                  </text>

                  {/* Biểu tượng an toàn GHS / P.A */}
                  <text x="75" y="156" textAnchor="middle" fill="#64748b" fontSize="6.5" fontWeight="600" fontFamily="sans-serif">
                    ⚠️ GHS07 • Dung dịch P.A
                  </text>
                </g>

                {/* 7. VỆT SÁNG PHẢN CHIẾU THỦY TINH BÓNG LOÁNG (Specular Glass Highlights) */}
                {/* Vệt sáng cong theo vai bình bên phải */}
                <path
                  d="M 126 128 L 126 195 Q 126 206 116 206"
                  fill="none"
                  stroke="url(#glassShineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Vệt sáng trên cổ bình */}
                <line x1="84" y1="42" x2="84" y2="72" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>

              {/* TIA NƯỚC RÓT CHẢY KHI DỐC BÌNH (Pouring Stream) */}
              {isActualPouring && (
                <div
                  className={`absolute top-6 pointer-events-none z-30 flex flex-col items-center ${
                    pourDirection === "left" ? "-left-10" : "-right-10"
                  }`}
                  style={{
                    transform: `rotate(${-tiltDeg}deg)`,
                  }}
                >
                  {/* Dòng nước chảy óng ánh phát sáng */}
                  <div
                    className="w-3 h-44 rounded-full shadow-lg animate-pulse"
                    style={{
                      background: `linear-gradient(to bottom, ${liquidColor}, rgba(255,255,255,0.9), ${liquidColor})`,
                      boxShadow: `0 0 16px ${liquidColor}`,
                    }}
                  />
                  {/* Bọt nước và tia giọt lách tách */}
                  <div className="flex gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* CỐC ĐONG THỦY TINH CÓ MỎ HỨNG BÊN DƯỚI (Griffin Beaker) */}
            <div className="absolute -bottom-1 right-2 flex flex-col items-center select-none pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold mb-0.5">Cốc hứng ({Math.round(beakerFillPercent)}%)</span>
              <svg width="88" height="105" viewBox="0 0 88 105" className="drop-shadow-xl overflow-visible">
                <defs>
                  <clipPath id="beakerInnerClip">
                    <rect x="10" y="16" width="68" height="84" rx="4" />
                  </clipPath>
                </defs>

                {/* Nước dâng lên bên trong cốc hứng */}
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
                  {/* Mặt thoáng chất lỏng trong cốc */}
                  <ellipse
                    cx="44"
                    cy={100 - (beakerFillPercent * 0.85)}
                    rx="32"
                    ry="4"
                    fill="rgba(255,255,255,0.4)"
                  />
                </g>

                {/* Thân cốc đong có mỏ rót bên trái */}
                <path
                  d="M 6 16 L 12 20 L 12 96 Q 12 102 18 102 L 70 102 Q 76 102 76 96 L 76 16 Q 80 16 80 14 Q 76 12 72 16 L 16 16 Z"
                  fill="rgba(255,255,255,0.08)"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Vạch chia độ trên thành cốc */}
                <g className="fill-white/60 font-mono text-[6.5px]">
                  <line x1="62" y1="36" x2="72" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <text x="46" y="38">200ml</text>

                  <line x1="64" y1="56" x2="72" y2="56" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <text x="46" y="58">150ml</text>

                  <line x1="64" y1="76" x2="72" y2="76" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <text x="46" y="78">100ml</text>

                  <line x1="66" y1="92" x2="72" y2="92" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                  <text x="48" y="94">50ml</text>
                </g>

                {/* Vệt phản chiếu thủy tinh */}
                <line x1="72" y1="22" x2="72" y2="94" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* NÚT CHẠM & GIỮ ĐỂ RÓT (Hỗ trợ tương tác cảm ứng trực tiếp trên màn hình) */}
          <div className="flex gap-2">
            <button
              onMouseDown={() => setIsManualPouring(true)}
              onMouseUp={() => setIsManualPouring(false)}
              onTouchStart={() => setIsManualPouring(true)}
              onTouchEnd={() => setIsManualPouring(false)}
              className={`flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                isActualPouring
                  ? "bg-cyan-500 text-white shadow-cyan-500/40 scale-[0.98]"
                  : "bg-slate-800/90 hover:bg-slate-700/90 text-cyan-300 border border-cyan-500/30"
              }`}
            >
              <span>💧</span>
              <span>{isActualPouring ? "Đang rót vào cốc..." : "Chạm & Giữ nút để Rót (Hoặc nghiêng máy)"}</span>
            </button>
            <button
              onClick={handleRefillBottle}
              className="px-3.5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Đổ đầy lại bình"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Đổ đầy</span>
            </button>
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
                {fillPercent <= 2 ? "⚠️ Đã hết (bấm Đổ đầy)" : isActualPouring ? "Đang rót..." : "Sẵn sàng"}
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
