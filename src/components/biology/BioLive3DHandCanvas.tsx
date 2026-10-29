"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { HandState } from "@/lib/handTracking";
import Lab3DFullHandModel, { IndexTipInfo } from "@/components/lab3d/Lab3DFullHandModel";

import { playLabSound } from "@/components/lab3d/ChemistryRealisticModels";
import { Hand, Maximize2, Minimize2, MousePointer, ZoomIn, ZoomOut, Plus, Minus, RotateCcw } from "lucide-react";

interface BioLive3DHandCanvasProps {
  handStateRef: React.MutableRefObject<HandState>;
  active?: boolean;
  tabMode?: string;
}

function HandGestureDispatcher({
  handStateRef,
  onPointerMove,
  onZoomFeedback,
}: {
  handStateRef: React.MutableRefObject<HandState>;
  onPointerMove: (info: IndexTipInfo | null) => void;
  onZoomFeedback?: (text: string | null) => void;
}) {
  const prevPalmRef = useRef<{ x: number; y: number } | null>(null);
  const prevSpanRef = useRef<number | null>(null);
  const activeModeRef = useRef<"IDLE" | "ROTATE" | "ZOOM">("IDLE");
  const pinchAnchorYRef = useRef<number | null>(null);
  const smoothedVelocityRef = useRef<number>(0);

  useFrame(() => {
    const hs = handStateRef.current;
    if (!hs) return;

    // 0. ZOOM BẰNG 2 BÀN TAY (Dual Hand Stretch - Kéo 2 tay ra xa để Phóng to, Khép 2 tay lại để Thu nhỏ)
    if (hs.leftHand && hs.leftHand.detected && hs.rightHand && hs.rightHand.detected) {
      activeModeRef.current = "ZOOM";
      const curSpan = Math.hypot(
        hs.leftHand.palmPos[0] - hs.rightHand.palmPos[0],
        hs.leftHand.palmPos[1] - hs.rightHand.palmPos[1]
      );
      if (prevSpanRef.current !== null) {
        const dSpan = curSpan - prevSpanRef.current;
        if (Math.abs(dSpan) > 0.003) {
          const factor = Math.max(0.965, Math.min(1.035, 1 - dSpan * 1.8));
          window.dispatchEvent(
            new CustomEvent("bio-hand-zoom", {
              detail: { factor },
            })
          );
          if (onZoomFeedback) {
            onZoomFeedback(dSpan > 0 ? "Phóng to (2 tay)" : "Thu nhỏ (2 tay)");
          }
        }
      }
      prevSpanRef.current = curSpan;
      prevPalmRef.current = null;
      pinchAnchorYRef.current = null;
      return;
    }
    prevSpanRef.current = null;

    // Lấy bàn tay chính đang tương tác (ưu tiên tay phải, sau đó tay trái, hoặc hs chung)
    const primary =
      hs.rightHand && hs.rightHand.detected
        ? hs.rightHand
        : hs.leftHand && hs.leftHand.detected
        ? hs.leftHand
        : hs.detected
        ? hs
        : null;

    if (!primary || !primary.detected || !primary.landmarks || primary.landmarks.length < 21) {
      activeModeRef.current = "IDLE";
      prevPalmRef.current = null;
      pinchAnchorYRef.current = null;
      smoothedVelocityRef.current = 0;
      if (onZoomFeedback) onZoomFeedback(null);
      return;
    }

    // 1. TÍNH TOÁN CÁC CỬ CHỈ BÀN TAY CHÍNH XÁC & ĐỘC LẬP
    const isPointing =
      primary.isIndexExtended &&
      !primary.isMiddleExtended &&
      !primary.isRingExtended &&
      !primary.isPinkyExtended;

    // V-sign (✌️): Ngón trỏ & giữa duỗi thẳng, ngón áp út & út gập lại -> Phóng to (Zoom In)
    const isVSign =
      primary.isIndexExtended &&
      primary.isMiddleExtended &&
      !primary.isRingExtended &&
      !primary.isPinkyExtended;

    // Shaka / Call me (🤙): Ngón cái & ngón út duỗi, 3 ngón giữa gập -> Thu nhỏ (Zoom Out)
    const isShaka =
      primary.isPinkyExtended &&
      primary.isThumbExtended &&
      !primary.isIndexExtended &&
      !primary.isMiddleExtended;

    // Nắm chặt bàn tay (Fist ✊): các ngón gập lại, không được duỗi ngón trỏ hoặc ngón giữa
    const isFist =
      !primary.isIndexExtended &&
      !primary.isMiddleExtended &&
      !primary.isRingExtended &&
      !primary.isPinkyExtended &&
      (primary.gesture === "GRAB" || primary.gripStrength > 0.48 || primary.extendedFingersCount <= 1);

    // 2. STATE MACHINE PHÂN BIỆT RẠCH RÒI: ROTATE, ZOOM, POINT, IDLE
    if (isVSign) {
      activeModeRef.current = "ZOOM";
      prevPalmRef.current = null;
      window.dispatchEvent(
        new CustomEvent("bio-hand-zoom", {
          detail: { factor: 0.985 },
        })
      );
      if (onZoomFeedback) onZoomFeedback("Giơ 2 ngón: Đang Phóng to (Zoom In)");
      return;
    } else if (isShaka) {
      activeModeRef.current = "ZOOM";
      prevPalmRef.current = null;
      window.dispatchEvent(
        new CustomEvent("bio-hand-zoom", {
          detail: { factor: 1.015 },
        })
      );
      if (onZoomFeedback) onZoomFeedback("Ngón út & cái: Đang Thu nhỏ (Zoom Out)");
      return;
    } else if (isFist) {
      activeModeRef.current = "ROTATE";
      const curX = primary.palmPos[0];
      const curY = primary.palmPos[1];

      if (prevPalmRef.current) {
        const dx = (curX - prevPalmRef.current.x) * 550;
        const dy = (curY - prevPalmRef.current.y) * 550;

        if (Math.hypot(dx, dy) > 0.15) {
          window.dispatchEvent(
            new CustomEvent("bio-hand-rotate", {
              detail: { dx, dy },
            })
          );
        }
      }
      prevPalmRef.current = { x: curX, y: curY };
      if (onZoomFeedback) onZoomFeedback("Nắm tay & di chuyển: Xoay mô hình 360°");
      return;
    } else if (isPointing) {
      activeModeRef.current = "IDLE";
      prevPalmRef.current = null;
      if (onZoomFeedback) onZoomFeedback(null);
    } else {
      activeModeRef.current = "IDLE";
      prevPalmRef.current = null;
      if (onZoomFeedback) onZoomFeedback(null);
    }
  });

  const handlePointerWithMode = useCallback(
    (info: IndexTipInfo | null) => {
      // Khi đang nắm tay xoay mô hình, ẩn con trỏ chỉ điểm để tập trung xoay
      if (activeModeRef.current === "ROTATE") {
        onPointerMove(null);
      } else {
        onPointerMove(info);
      }
    },
    [onPointerMove]
  );

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[0, 3, 4]} intensity={1.6} />
      <directionalLight position={[-2, -2, -2]} intensity={0.6} />
      {/* Bàn tay 3D được hiển thị toàn cục ở page.tsx trên layer z-[60] (ở phía trước thanh Tab) */}
      {/* <Lab3DFullHandModel
        handStateRef={handStateRef}
        positionOffset={[0, 0.18, 1.45]}
        scaleFactor={1.4}
        onIndexTipUpdate={handlePointerWithMode}
      /> */}
    </>
  );
}

export default function BioLive3DHandCanvas({
  handStateRef,
  active = true,
  tabMode,
}: BioLive3DHandCanvasProps) {
  const reticleRef = useRef<HTMLDivElement>(null);
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const hoveredBtnRef = useRef<HTMLElement | null>(null);
  const hoverStartTimeRef = useRef<number>(0);
  const clickCooldownRef = useRef<number>(0);
  const [hoverButtonName, setHoverButtonName] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ name: string; color?: string } | null>(null);
  const [zoomNotice, setZoomNotice] = useState<string | null>(null);
  const zoomNoticeTimer = useRef<NodeJS.Timeout>();

  const handleZoomFeedback = useCallback((text: string | null) => {
    if (text) {
      setZoomNotice(text);
      clearTimeout(zoomNoticeTimer.current);
      zoomNoticeTimer.current = setTimeout(() => {
        setZoomNotice(null);
      }, 700);
    }
  }, []);

  const handlePointer = useCallback((info: IndexTipInfo | null) => {
    const now = performance.now();

    if (reticleRef.current) {
      if (info && info.isPointing) {
        reticleRef.current.style.transform = `translate3d(${info.screenX}px, ${info.screenY}px, 0)`;
        reticleRef.current.style.display = "flex";
      } else {
        reticleRef.current.style.display = "none";
        hoveredBtnRef.current = null;
        setHoverButtonName(null);
      }
    }

    if (!info || !info.isPointing) return;

    const el = document.elementFromPoint(info.screenX, info.screenY);

    // 1. AIR SLIDER DRAG: Trỏ ngón tay vào thanh trượt (VD: Tách các cấu trúc ra xa nhau)
    const rangeInput = el?.closest("input[type='range']") as HTMLInputElement | null;
    if (rangeInput) {
      const rect = rangeInput.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (info.screenX - rect.left) / rect.width));
      const min = Number(rangeInput.min) || 0;
      const max = Number(rangeInput.max) || 100;
      const val = Math.round(min + ratio * (max - min));

      const proto = window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (nativeSetter) {
        nativeSetter.call(rangeInput, val);
      } else {
        rangeInput.value = String(val);
      }
      rangeInput.dispatchEvent(new Event("input", { bubbles: true }));
      rangeInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    // Gửi sự kiện raycast vào 3D
    window.dispatchEvent(
      new CustomEvent("bio-hand-point", {
        detail: {
          screenX: info.screenX,
          screenY: info.screenY,
          normalizedX: info.ndcX,
          normalizedY: info.ndcY,
        },
      })
    );
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const onHoverInfo = (e: Event) => {
      const detail = (e as CustomEvent<{ name: string; color?: string }>).detail;
      setHoverInfo(detail);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setHoverInfo(null);
      }, 1500);
    };

    window.addEventListener("bio-hand-hover-info", onHoverInfo);
    return () => {
      window.removeEventListener("bio-hand-hover-info", onHoverInfo);
      clearTimeout(timer);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none", width: "100%", height: "100%" }}
      >
        <HandGestureDispatcher
          handStateRef={handStateRef}
          onPointerMove={handlePointer}
          onZoomFeedback={handleZoomFeedback}
        />
      </Canvas>

      {/* Floating Center Zoom Toast Feedback */}
      {zoomNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-5 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-sky-400 text-sky-200 shadow-2xl backdrop-blur-2xl flex items-center gap-2.5 ring-4 ring-sky-500/20 font-bold text-sm tracking-wide">
            <ZoomIn className="w-5 h-5 text-sky-400 animate-pulse shrink-0" />
            <span>{zoomNotice}</span>
          </div>
        </div>
      )}

      {/* Floating Gesture Guide & Quick Zoom Controller - Chỉ hiện khi tabMode !== "human" để không đè thanh Phân tách cấu trúc */}
      {tabMode !== "human" && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto z-40 flex items-center gap-3 bg-slate-950/95 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-slate-700/80 shadow-2xl ring-1 ring-white/10">
          {/* Visual Gesture Cheat Sheet */}
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-slate-300 font-semibold border-r border-slate-800 pr-3">
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-sky-300">
              <Hand className="w-3.5 h-3.5 text-sky-400" />
              <span>Nắm tay: Xoay 360°</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-emerald-300">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>2 ngón: Phóng to</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-amber-300">
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Ngón út: Thu nhỏ</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-rose-300">
              <MousePointer className="w-3.5 h-3.5 text-rose-400" />
              <span>Chỉ ngón: Chọn cấu trúc</span>
            </span>
          </div>

          {/* Quick Click / Dwell Zoom Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("bio-hand-zoom", { detail: { factor: 0.80 } }));
                handleZoomFeedback("Phóng to");
                playLabSound("pick");
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
              title="Phóng to"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>Phóng to</span>
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("bio-hand-zoom", { detail: { factor: 1.25 } }));
                handleZoomFeedback("Thu nhỏ");
                playLabSound("pick");
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
              title="Thu nhỏ"
            >
              <Minus className="w-3.5 h-3.5 text-sky-400" />
              <span>Thu nhỏ</span>
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("bio-hand-zoom", { detail: { factor: "reset" } }));
                handleZoomFeedback("Đặt lại");
                playLabSound("pick");
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
              title="Đặt lại góc nhìn ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
