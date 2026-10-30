"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDeviceSensors } from "@/hooks/useDeviceSensors";
import { useToast } from "@/components/toast";
import {
  Smartphone,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Hand,
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import RemotePairingModal from "./RemotePairingModal";

interface DeviceMotionControlBarProps {
  subject: "chemistry" | "physics" | "biology";
  onShake?: () => void;
  onPourTrigger?: () => void;
  className?: string;
}

export default function DeviceMotionControlBar({
  subject,
  onShake,
  onPourTrigger,
  className = "",
}: DeviceMotionControlBarProps) {
  const {
    isSupported,
    permissionGranted,
    isPourTilted,
    pourIntensity,
    isShaking,
    pitch,
    roll,
    isMobileDevice,
    requestPermission,
    simulateShake,
    simulatePour,
    triggerHaptic,
  } = useDeviceSensors();

  const [simulatedPouring, setSimulatedPouring] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);

  const { showToast } = useToast();
  const [connectedPhoneName, setConnectedPhoneName] = useState<string | null>(null);
  const [showConnectedToast, setShowConnectedToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handlePhoneConnected = (deviceName: string) => {
    setConnectedPhoneName(deviceName);
    setShowConnectedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setShowConnectedToast(false);
    }, 6000);

    showToast(
      `🎉 Đã kết nối điện thoại "${deviceName}" thành công! Cầm nghiêng để rót & lắc để trộn`,
      "success"
    );
  };

  const handleSimulateShake = () => {
    simulateShake();
    triggerHaptic([40, 60, 40]);
    if (onShake) onShake();
  };

  const handleToggleSimulatedPour = () => {
    if (simulatedPouring) {
      simulatePour(0);
      setSimulatedPouring(false);
    } else {
      simulatePour(0.85);
      setSimulatedPouring(true);
      triggerHaptic(50);
      if (onPourTrigger) onPourTrigger();
    }
  };

  return (
    <div
      className={`fixed bottom-14 sm:bottom-6 right-2 sm:right-6 z-40 pointer-events-auto flex items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-16px)] ${className}`}
    >
      {/* ─── Thanh Trạng thái Cảm biến Di động & Giả lập PC ─── */}
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 p-1.5 px-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs text-slate-200 ring-1 ring-white/10 select-none">
        {/* Biểu tượng thiết bị */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
              isShaking || isPourTilted || simulatedPouring
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
              {isMobileDevice ? "Cảm biến Điện thoại" : "Motion & Gyro Controller"}
              {permissionGranted && (
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              )}
            </span>
            <span className="text-[9px] text-slate-400 font-medium">
              {subject === "chemistry" && "Nghiêng rót • Lắc trộn"}
              {subject === "physics" && "Nghiêng lắc con lắc"}
              {subject === "biology" && "Xoay không gian 360°"}
            </span>
          </div>
        </div>

        {/* Nút yêu cầu cấp quyền cảm biến (trên di động nếu chưa bật) */}
        {isMobileDevice && !permissionGranted && (
          <button
            onClick={() => requestPermission()}
            className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            <span>Bật Cảm Biến</span>
          </button>
        )}

        {/* Chỉ báo trạng thái Nghiêng rót */}
        {(isPourTilted || simulatedPouring) && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Đang rót ({Math.round(pourIntensity * 100)}%)</span>
          </div>
        )}

        {/* Chỉ báo trạng thái Lắc */}
        {isShaking && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-bounce shrink-0">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Đang lắc trộn!</span>
          </div>
        )}

        {/* Nút hành động Ghép Nối Điện Thoại */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
          {/* Nút Ghép Nối Điện Thoại (Pairing Remote) */}
          <button
            onClick={() => setShowPairingModal(true)}
            className={`px-2.5 py-1 rounded-xl text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
              connectedPhoneName
                ? "bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/60 shadow-emerald-500/25 ring-2 ring-emerald-500/30"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
            }`}
            title={
              connectedPhoneName
                ? `Đang kết nối: ${connectedPhoneName} (Bấm để xem mã / kết nối lại)`
                : "Kết nối điện thoại để làm tay cầm cảm biến (Quét mã QR hoặc nhập mã PIN)"
            }
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            {connectedPhoneName ? (
              <span className="flex items-center gap-1.5 text-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping shrink-0" />
                <span className="hidden sm:inline truncate max-w-[90px]">{connectedPhoneName}</span>
                <span className="sm:hidden">Đã nối ĐT</span>
              </span>
            ) : (
              <>
                <span className="hidden sm:inline">Ghép Nối ĐT</span>
                <span className="sm:hidden">Ghép ĐT</span>
              </>
            )}
          </button>

          {/* Nút Hướng dẫn Cảm biến */}
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className="w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-[10px] font-bold transition-all ml-0.5 cursor-pointer"
            title="Xem hướng dẫn thao tác cảm biến"
          >
            ?
          </button>
        </div>
      </div>

      {/* ─── Modal Hướng Dẫn Tương Tác Cảm Biến & Đa Thiết Bị ─── */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Tương Tác Cảm Biến & Đa Thiết Bị
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Kết hợp 100% Điện thoại + Camera PC chân thực
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                  <span>📱 Khi mở trên Điện thoại Android / iPhone:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>
                    <strong>Cầm nghiêng điện thoại chúc xuống (&gt;20°):</strong> Chất lỏng tự động rót từ lọ sang cốc.
                  </li>
                  <li>
                    <strong>Lắc điện thoại (Shake):</strong> Ống nghiệm lắc đều dung dịch, kích hoạt phản ứng sủi bọt kèm rung Haptic chân thật!
                  </li>
                  <li>
                    <strong>Đung đưa điện thoại:</strong> Con lắc vật lý dao động theo quán tính tay bạn.
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <p className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                  <span>💻 Khi mở trên Máy tính / Laptop:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>
                    <strong>Camera Hand Tracking AI:</strong> Đưa tay trước webcam để cầm bình, gạt cầu dao, kéo con lắc.
                  </li>
                  <li>
                    <strong>Thanh công cụ nhanh:</strong> Dùng nút <strong>&quot;Lắc&quot;</strong> và <strong>&quot;Rót&quot;</strong> ngay trên màn hình.
                  </li>
                  <li>
                    <strong>Chuột & Bàn phím:</strong> Kéo thả trực tiếp 3D mượt mà 60FPS.
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg active:scale-95"
            >
              Đã hiểu, Bắt đầu trải nghiệm ngay
            </button>
          </div>
        </div>
      )}

      {/* ─── Thông Báo Nổi Bật Khi Quét Xong & Kết Nối Thành Công ─── */}
      {showConnectedToast && (
        <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-[110] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300 select-none max-w-lg w-[92vw] sm:w-auto">
          <div className="bg-slate-950/95 backdrop-blur-2xl border-2 border-emerald-400 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-3xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3.5 ring-4 ring-emerald-500/20">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kết Nối Điện Thoại Thành Công!</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-mono truncate max-w-[140px]">
                  {connectedPhoneName || "Thiết bị di động"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-snug">
                Mã QR đã tự đóng. Bây giờ bạn có thể cầm điện thoại <strong>nghiêng rót</strong> & <strong>lắc trộn</strong> trực tiếp!
              </p>
            </div>
            <button
              onClick={() => setShowConnectedToast(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal Ghép Nối Điện Thoại (QR Code & Mã PIN 6 Chữ Số) ─── */}
      <RemotePairingModal
        isOpen={showPairingModal}
        onClose={() => setShowPairingModal(false)}
        onPhoneConnected={handlePhoneConnected}
      />
    </div>
  );
}

