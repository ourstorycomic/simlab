"use client";

/**
 * ─── Lab3DChemicalCabinetModal ───
 * Giao diện Tủ Hóa Chất Thực Tế Ảo VR (107 Hóa Chất Chuẩn Vision Pro / Quest):
 * - Chỉ ngón tay (Point): Điểm ngắm laser thực tế ảo bám sát 100% theo đầu ngón tay trỏ.
 * - Ấn ngón / Chụm ngón (Air Tap / Pinch): Chụm ngón trỏ và ngón cái để CHỌN KIỂU (Category) hoặc CHỌN CHẤT ngay tức thì.
 * - Phẩy tay cuộn trang (Hand Flick / Swipe with Inertia): Phẩy tay lên/xuống dứt khoát để cuộn trang mượt mà theo quán tính thực tế ảo!
 * - Nền kính mờ bán trong suốt (Glassmorphism HUD) nhìn xuyên qua thấy phòng lab và bàn tay 3D phía sau.
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Chemical, chemicals as allChemicals, getStateLabel, isLiquidState } from "@/lib/chemicals";
import { normalizeVietnamese, normalizeChemicalFormula } from "@/components/ChemicalSelector";
import { playLabSound } from "./ChemistryRealisticModels";
import { HandState } from "@/lib/handTracking";
import { getReaction } from "@/lib/reactions";
import { 
    FlaskConical, 
    Droplets, 
    Sparkles, 
    Box, 
    Shield, 
    Palette, 
    Leaf, 
    X, 
    Search, 
    Zap, 
    ArrowUp, 
    ArrowDown, 
    ArrowRight, 
    CheckCircle2, 
    Lightbulb, 
    Layers, 
    Eye,
    Hand
} from "lucide-react";

export type ChemCabinetCategory = "all" | "acid" | "base" | "salt" | "metal" | "indicator" | "organic";

interface CategoryMeta {
    id: ChemCabinetCategory;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeColor: string;
}

const CATEGORIES: CategoryMeta[] = [
    { id: "all", name: "Tất cả", icon: FlaskConical, badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
    { id: "acid", name: "Axit", icon: Droplets, badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
    { id: "base", name: "Bazơ", icon: Sparkles, badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
    { id: "salt", name: "Muối", icon: Box, badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
    { id: "metal", name: "Kim loại", icon: Shield, badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
    { id: "indicator", name: "Chỉ thị màu", icon: Palette, badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
    { id: "organic", name: "Hữu cơ & Khí", icon: Leaf, badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40" },
];

interface Lab3DChemicalCabinetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectChemical: (chemical: Chemical) => void;
    activeChemicalId?: string | null;
    handStateRef?: React.MutableRefObject<HandState>;
    refChemical?: Chemical | null;
}

export default function Lab3DChemicalCabinetModal({
    isOpen,
    onClose,
    onSelectChemical,
    activeChemicalId,
    handStateRef,
    refChemical,
}: Lab3DChemicalCabinetModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<ChemCabinetCategory>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const gridContainerRef = useRef<HTMLDivElement>(null);

    // ─── Trạng thái Con Trỏ Laser VR Thực Tế Ảo ───
    const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
    const [isHandActive, setIsHandActive] = useState(false);
    const lastHoveredIdRef = useRef<string | null>(null);

    // Refs điều khiển trực tiếp DOM Laser Pointer (GPU translate3d, 0 re-render ở 60fps)
    const laserReticleRef = useRef<HTMLDivElement>(null);
    const laserBadgeRef = useRef<HTMLDivElement>(null);
    const laserHintRef = useRef<HTMLSpanElement>(null);
    const dwellCircleRef = useRef<SVGCircleElement>(null);

    // Refs theo dõi chuyển động, trạng thái bàn tay và cuộn trang (InScroll & Virtual-Mouse Architecture)
    const smoothedPointerRef = useRef({ x: -100, y: -100 });
    const latestProjectedTipRef = useRef<{ screenX: number; screenY: number; isPointing?: boolean; timestamp: number } | null>(null);
    const wasPinchingRef = useRef(true); // Mặc định true để bắt buộc mở tay (unpinch) trước khi nhận lệnh click đầu tiên
    const modalOpenedTimeRef = useRef<number>(0);
    const dwellStartTimeRef = useRef<number | null>(null);
    const currentHoveredElemRef = useRef<HTMLElement | null>(null);
    const lastHoveredElemTimeRef = useRef<number>(0);
    const clickCooldownUntilRef = useRef<number>(0);
    const lastPinkyCloseRef = useRef<number>(0);
    const pinkyMustReleaseRef = useRef<boolean>(true);

    // Refs chỉ báo dải cuộn trực quan (Zone Indicators)
    const topScrollBannerRef = useRef<HTMLDivElement>(null);
    const bottomScrollBannerRef = useRef<HTMLDivElement>(null);
    const scrollVelocityRef = useRef<number>(0);

    // Phím tắt đóng modal khi bấm Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // ─── TẤM CHẮN AN TOÀN KHI VỪA MỞ TỦ (MODAL OPEN SHIELD) ───
    // Khóa click trong 1.5s đầu tiên, bắt buộc thả ngón tay (unpinch) trước khi chọn bất cứ thứ gì!
    useEffect(() => {
        if (isOpen) {
            const now = performance.now();
            modalOpenedTimeRef.current = now;
            pinkyMustReleaseRef.current = true; // Bắt buộc phải hạ ngón út xuống trước khi cho phép dùng ngón út đóng tủ
            lastPinkyCloseRef.current = now + 1200; // Khóa ngón út đóng tủ trong 1.2s đầu tiên
            wasPinchingRef.current = true; // Bắt buộc người dùng phải thả tay ra (unpinch)
            clickCooldownUntilRef.current = now + 1500; // Khóa toàn bộ click trong 1.5s đầu tiên
            dwellStartTimeRef.current = null;
            currentHoveredElemRef.current = null;
            scrollVelocityRef.current = 0;
        }
    }, [isOpen]);

    // Nhận tọa độ chiếu 3D chính xác từ đầu ngón trỏ (Three.js Screen Projection)
    useEffect(() => {
        const handleTip = (e: any) => {
            if (e.detail && typeof e.detail.screenX === "number") {
                latestProjectedTipRef.current = {
                    screenX: e.detail.screenX,
                    screenY: e.detail.screenY,
                    isPointing: typeof e.detail.isPointing === "boolean" ? e.detail.isPointing : undefined,
                    timestamp: performance.now(),
                };
            }
        };
        window.addEventListener("hand-index-tip", handleTip);
        return () => window.removeEventListener("hand-index-tip", handleTip);
    }, []);

    // ─── Vòng Lặp Thực Tế Ảo VR Chuẩn Virtual-Mouse & InScroll ───
    useEffect(() => {
        if (!isOpen) return;

        let animationFrameId: number;

        const checkHandLoop = () => {
            const now = performance.now();

            if (handStateRef?.current) {
                const hs = handStateRef.current;
                const hand = hs.rightHand?.detected
                    ? hs.rightHand
                    : hs.leftHand?.detected
                    ? hs.leftHand
                    : hs.detected
                    ? hs
                    : null;

                if (hand && hand.detected && hand.landmarks && hand.landmarks.length >= 21) {
                    const lm = hand.landmarks;
                    const wrist = lm[0];
                    const thumbTip = lm[4];
                    const indexTip = lm[8];
                    const indexPip = lm[6];
                    const middleTip = lm[12];
                    const middlePip = lm[10];
                    const ringTip = lm[16];
                    const ringPip = lm[14];
                    const pinkyTip = lm[20];
                    const pinkyPip = lm[18];

                    // Tọa độ ngón trỏ: Ưu tiên tuyệt đối tọa độ 3D chóp ngón tay chiếu trực tiếp từ Three.js (khớp pixel 100%)
                    const proj = latestProjectedTipRef.current;
                    const hasFreshProj = proj && now - proj.timestamp < 1000;
                    const cur = smoothedPointerRef.current;

                    if (hasFreshProj && proj) {
                        // 🎯 Khóa chặt 1:1 con trỏ vào đầu ngón tay 3D không độ trễ, không lệch, không rung giật:
                        // Three.js đã lọc rung lắc webcam bằng Adaptive EMA ở tần số 60fps
                        cur.x = proj.screenX;
                        cur.y = proj.screenY;
                    } else {
                        // Fallback nội suy mượt chỉ khi mất kết nối chiếu 3D
                        const fallbackX = (1.0 - indexTip.x) * window.innerWidth;
                        const fallbackY = indexTip.y * window.innerHeight;
                        if (cur.x < 0 || cur.y < 0) {
                            cur.x = fallbackX;
                            cur.y = fallbackY;
                        } else {
                            cur.x += (fallbackX - cur.x) * 0.35;
                            cur.y += (fallbackY - cur.y) * 0.35;
                        }
                    }

                    // ─── PHÂN LOẠI CỬ CHỈ BÀN TAY (THEO CHUẨN INSCROLL & VIRTUAL-MOUSE) ───
                    const isIndexExt = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y) > Math.hypot(indexPip.x - wrist.x, indexPip.y - wrist.y) * 1.12;
                    const isMiddleExt = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y) > Math.hypot(middlePip.x - wrist.x, middlePip.y - wrist.y) * 1.12;
                    const isRingExt = Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y) > Math.hypot(ringPip.x - wrist.x, ringPip.y - wrist.y) * 1.12;
                    const isPinkyExt = Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y) > Math.hypot(pinkyPip.x - wrist.x, pinkyPip.y - wrist.y) * 1.12;

                    let extendedCount = 0;
                    if (isIndexExt) extendedCount++;
                    if (isMiddleExt) extendedCount++;
                    if (isRingExt) extendedCount++;
                    if (isPinkyExt) extendedCount++;

                    // 0. DƠ NGÓN ÚT: ĐÓNG TỦ HÓA CHẤT (Chỉ khi đã hạ ngón út sau khi mở, và sau ít nhất 1.2s)
                    const isPinkyOnly = isPinkyExt && !isIndexExt && !isMiddleExt;
                    if (!isPinkyOnly) {
                        pinkyMustReleaseRef.current = false;
                    }

                    if (isPinkyOnly && !pinkyMustReleaseRef.current && now > lastPinkyCloseRef.current) {
                        lastPinkyCloseRef.current = now + 2000;
                        playLabSound("pick");
                        onClose();
                        return;
                    }

                    // Phân biệt Bàn tay mở (Open hand 🖐️) vs Nắm tay (Fist / Grab ✊) vs Chỉ 1 ngón trỏ (Pointing 👆)
                    const isOpenHand = hand.gesture === "OPEN" || extendedCount >= 3;

                    // 1. CỬ CHỈ NẮM TAY (FIST ✊ / GRAB):
                    const isFistGrab = (hand.gesture === "GRAB" || (hand.gripStrength !== undefined && hand.gripStrength > 0.45)) && !isOpenHand;
                    const isClosedFist = isFistGrab || extendedCount === 0;

                    // 2. CỬ CHỈ XÒE CẢ BÀN TAY (OPEN HAND 🖐️) - DÙNG ĐỂ CUỘN LÊN / XUỐNG:
                    const isHandOpenForScroll = isOpenHand || extendedCount >= 3;

                    // 3. CỬ CHỈ CHỤM NGÓN (PINCH 👌):
                    const rawPinchIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
                    const rawPinchMiddle = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
                    const minPinch2D = Math.min(rawPinchIndex, rawPinchMiddle);
                    const isPinch = (minPinch2D < 0.058 || (hand.pinchDistance !== undefined && hand.pinchDistance < 0.058)) && !isOpenHand;

                    const isTriggerActive = isFistGrab || isPinch;
                    const isHandOpen = isOpenHand || (!isTriggerActive && minPinch2D > 0.078);

                    if (isHandOpen) {
                        wasPinchingRef.current = false;
                    }

                    // 🎯 ĐIỀU KIỆN BẮT BUỘC ĐỂ CHỌN CHẤT:
                    // CHỈ KHI DƠ ĐÚNG 1 NGÓN TRỎ (Chỉ trỏ 👆) - CÁC NGÓN KHÁC PHẢI GẬP LẠI!
                    // Nếu dơ cả bàn tay (🖐️) hoặc nắm tay (✊) -> TUYỆT ĐỐI KHÔNG CHỌN!
                    const isPointingWithIndex = (isIndexExt || !!hand.isIndexExtended || !!proj?.isPointing) && !isHandOpenForScroll && !isClosedFist && extendedCount <= 2;

                    // ─── 1. XÁC ĐỊNH ĐÍCH ĐANG TRỎ VÀO TRƯỚC TIÊN (POINT TARGET FIRST) ───
                    const elementAtPoint = document.elementFromPoint(cur.x, cur.y);
                    const directTarget = elementAtPoint?.closest<HTMLElement>("[data-hand-target]") || null;
                    const directTargetId = directTarget?.getAttribute("data-hand-target") || "";
                    const isChemicalCard = directTargetId.startsWith("chem-");
                    const isCategoryBtn = directTargetId.startsWith("cat-");
                    const isScrollUpBtn = directTargetId === "scroll-up-btn";
                    const isScrollDownBtn = directTargetId === "scroll-down-btn";

                    // ─── 2. CUỘN TRANG THỰC TẾ ẢO (VIRTUAL SCROLLING):
                    // NGUYÊN TẮC:
                    // 1. XÒE CẢ BÀN TAY (🖐️):
                    //    - Đưa tay lên vùng trên (cur.y < H * 0.32) -> Cuộn LÊN!
                    //    - Đưa tay xuống vùng dưới (cur.y > H * 0.68) -> Cuộn XUỐNG!
                    //    - Để tay ở giữa (H * 0.32 <= cur.y <= H * 0.68) -> ĐỨNG YÊN HOÀN TOÀN!
                    // 2. CHỈ NGÓN TRỎ (👆) HOẶC NẮM TAY (✊):
                    //    - TUYỆT ĐỐI ĐỨNG YÊN 100% (trừ khi cố ý trỏ vào nút Lên/Xuống ở bên phải)!
                    let scrollZone: "top" | "bottom" | "neutral" = "neutral";
                    let targetVel = 0;

                    const screenH = typeof window !== "undefined" ? window.innerHeight : 900;
                    const topThreshold = screenH * 0.32;
                    const bottomThreshold = screenH * 0.68;

                    if (isScrollUpBtn) {
                        scrollZone = "top";
                        targetVel = -14;
                    } else if (isScrollDownBtn) {
                        scrollZone = "bottom";
                        targetVel = 14;
                    } else if (isHandOpenForScroll) {
                        if (cur.y < topThreshold) {
                            scrollZone = "top";
                            targetVel = -14;
                        } else if (cur.y > bottomThreshold) {
                            scrollZone = "bottom";
                            targetVel = 14;
                        } else {
                            scrollZone = "neutral";
                            targetVel = 0;
                        }
                    } else {
                        // Khi đang chỉ ngón trỏ hoặc nắm tay: ĐỨNG YÊN HOÀN TOÀN!
                        scrollZone = "neutral";
                        targetVel = 0;
                    }

                    // Dừng ngay lập tức khi vào vùng neutral (không trôi trượt)
                    if (targetVel === 0) {
                        scrollVelocityRef.current = 0;
                    } else {
                        scrollVelocityRef.current = targetVel;
                    }

                    if (gridContainerRef.current && scrollVelocityRef.current !== 0) {
                        gridContainerRef.current.scrollTop += scrollVelocityRef.current;
                    }

                    // Cập nhật banner trực quan (chỉ hiện khi thực sự đang cuộn):
                    if (topScrollBannerRef.current) {
                        topScrollBannerRef.current.style.opacity = scrollZone === "top" ? "1" : "0";
                    }
                    if (bottomScrollBannerRef.current) {
                        bottomScrollBannerRef.current.style.opacity = scrollZone === "bottom" ? "1" : "0";
                    }

                    // Tấm chắn khóa click (1.0s đầu sau khi mở)
                    const isShieldActive = now < modalOpenedTimeRef.current + 1000;
                    const isClickAllowed = !isShieldActive && (scrollZone === "neutral" || isChemicalCard || isCategoryBtn);

                    // 🎯 CHỈ KHI DƠ ĐÚNG 1 NGÓN TRỎ THÌ MỚI CÓ MỤC TIÊU ACTIVE!
                    // Xòe cả bàn tay (🖐️) hoặc nắm tay (✊) -> activeTarget = null!
                    let activeTarget: HTMLElement | null = null;
                    if (isClickAllowed && isPointingWithIndex) {
                        if (isChemicalCard || isCategoryBtn || directTargetId.includes("reset-") || directTargetId === "close-modal") {
                            activeTarget = directTarget;
                        }
                    }

                    let progress = 0;
                    let gestureHintText = "👉 Dơ 1 ngón trỏ vào chất để chọn • Xòe tay để cuộn";

                    if (isHandOpenForScroll) {
                        if (scrollZone === "top") {
                            gestureHintText = "⬆️ Đang cuộn lên • Đưa tay vào giữa để dừng";
                        } else if (scrollZone === "bottom") {
                            gestureHintText = "⬇️ Đang cuộn xuống • Đưa tay vào giữa để dừng";
                        } else {
                            gestureHintText = "🖐️ Xòe tay đưa lên/xuống để cuộn • Dơ 1 ngón trỏ để chọn";
                        }
                    } else if (isClosedFist) {
                        gestureHintText = "✊ Đang nắm tay • Dơ 1 ngón trỏ để chọn";
                    } else if (isPointingWithIndex) {
                        gestureHintText = progress > 0 ? `🎯 Đang chọn... ${Math.round(progress * 100)}%` : "Giữ yên ngón trỏ để chọn";
                    }

                    // Nếu đổi thẻ hover hoặc không còn trỏ vào thẻ -> Reset thanh tiến trình thẻ cũ về 0%
                    if (currentHoveredElemRef.current && currentHoveredElemRef.current !== activeTarget) {
                        const prevBar = currentHoveredElemRef.current.querySelector<HTMLElement>(".chem-card-progress");
                        if (prevBar) prevBar.style.width = "0%";
                        const prevText = currentHoveredElemRef.current.querySelector<HTMLElement>(".chem-card-progress-text");
                        if (prevText) prevText.innerText = "0%";
                        const prevBottom = currentHoveredElemRef.current.querySelector<HTMLElement>(".chem-card-bottom-progress");
                        if (prevBottom) prevBottom.style.width = "0%";
                    }

                    if (!activeTarget) {
                        currentHoveredElemRef.current = null;
                        dwellStartTimeRef.current = null;
                        progress = 0;
                    }

                    if (activeTarget && isClickAllowed) {
                        const targetId = activeTarget.getAttribute("data-hand-target") || "";
                        const isCard = targetId.startsWith("chem-");
                        const isCat = targetId.startsWith("cat-");

                        if (currentHoveredElemRef.current !== activeTarget) {
                            currentHoveredElemRef.current = activeTarget;
                            dwellStartTimeRef.current = now;
                        }

                        // CỬ CHỈ NẮM TAY (✊) HOẶC CHỤM NGÓN (👌): Chọn ngay lập tức nếu muốn thao tác nhanh
                        if (isTriggerActive && !wasPinchingRef.current) {
                            wasPinchingRef.current = true;
                            clickCooldownUntilRef.current = now + 700;
                            activeTarget.click();
                            playLabSound("pick");
                            dwellStartTimeRef.current = null;
                            progress = 0;
                        } else if (isCard) {
                            // ─── THANH TIẾN TRÌNH TỪ TỪ (DWELL PROGRESS CONFIRMATION) ───
                            // Thời lượng giữ ngắm: 1300ms (1.3s) - từ từ, đủ để học sinh chắc chắn muốn chọn
                            const dwellDuration = 1300;
                            const elapsed = now - (dwellStartTimeRef.current || now);
                            progress = Math.min(1.0, elapsed / dwellDuration);

                            // Cập nhật DOM thanh tiến trình thời gian thực (60fps) ngay trên thẻ
                            const progressBar = activeTarget.querySelector<HTMLElement>(".chem-card-progress");
                            if (progressBar) progressBar.style.width = `${Math.round(progress * 100)}%`;
                            const progressText = activeTarget.querySelector<HTMLElement>(".chem-card-progress-text");
                            if (progressText) progressText.innerText = `${Math.round(progress * 100)}%`;
                            const bottomBar = activeTarget.querySelector<HTMLElement>(".chem-card-bottom-progress");
                            if (bottomBar) bottomBar.style.width = `${Math.round(progress * 100)}%`;

                            gestureHintText = `⏳ Đang chọn: ${Math.round(progress * 100)}% (Giữ yên ngón trỏ để lấy)`;

                            // Khi đạt 100% -> TỰ ĐỘNG CHỌN CHẤT ĐƯA RA BÀN!
                            if (progress >= 1.0) {
                                activeTarget.click();
                                playLabSound("pick");
                                clickCooldownUntilRef.current = now + 800;
                                dwellStartTimeRef.current = null;
                                progress = 0;
                            }
                        } else if (isCat) {
                            // Đổi kiểu danh mục: 700ms
                            const dwellDuration = 700;
                            const elapsed = now - (dwellStartTimeRef.current || now);
                            progress = Math.min(1.0, elapsed / dwellDuration);
                            gestureHintText = `✨ Đang đổi danh mục... ${Math.round(progress * 100)}%`;

                            if (progress >= 1.0) {
                                activeTarget.click();
                                playLabSound("pick");
                                clickCooldownUntilRef.current = now + 500;
                                dwellStartTimeRef.current = null;
                                progress = 0;
                            }
                        }
                    } else {
                        currentHoveredElemRef.current = null;
                        dwellStartTimeRef.current = null;
                        progress = 0;
                    }

                    // ─── CẬP NHẬT TRỰC TIẾP VÀO DOM LASER POINTER (GPU ACCELERATION - KHÔNG RE-RENDER REACT) ───
                    if (laserReticleRef.current) {
                        laserReticleRef.current.style.transform = `translate3d(${Math.round(cur.x)}px, ${Math.round(cur.y)}px, 0)`;
                        laserReticleRef.current.style.display = "block";
                    }
                    if (laserBadgeRef.current) {
                        if (isClosedFist) {
                            laserBadgeRef.current.innerText = "✊";
                            laserBadgeRef.current.className = "absolute w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-2xl transition-colors bg-slate-800 text-amber-300 ring-2 ring-slate-600 shadow-slate-900/60";
                        } else if (isHandOpenForScroll) {
                            laserBadgeRef.current.innerText = "🖐️";
                            laserBadgeRef.current.className = "absolute w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-2xl transition-colors bg-sky-900/80 text-sky-200 ring-2 ring-sky-400 shadow-sky-500/40";
                        } else if (isPinch) {
                            laserBadgeRef.current.innerText = "👌";
                            laserBadgeRef.current.className = "absolute w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-2xl transition-colors bg-teal-500 text-white ring-2 ring-teal-300 shadow-teal-500/50";
                        } else if (isPointingWithIndex) {
                            laserBadgeRef.current.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-cyan-300 ring-2 ring-white shadow-[0_0_8px_#38bdf8]"></span>';
                            laserBadgeRef.current.className = "absolute w-7 h-7 rounded-full flex items-center justify-center shadow-2xl transition-colors bg-emerald-500/40 backdrop-blur-sm ring-1.5 ring-emerald-300/80 shadow-emerald-500/40";
                        } else {
                            laserBadgeRef.current.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400"></span>';
                            laserBadgeRef.current.className = "absolute w-7 h-7 rounded-full flex items-center justify-center shadow transition-colors bg-slate-800/80 ring-1 ring-slate-600";
                        }
                    }
                    if (dwellCircleRef.current) {
                        dwellCircleRef.current.style.strokeDashoffset = `${150.8 * (1 - progress)}`;
                    }
                    if (laserHintRef.current) {
                        laserHintRef.current.innerText = isShieldActive
                            ? "⏳ Đang sẵn sàng... Rê tay vào chất"
                            : progress > 0
                            ? `🎯 Đang chọn... ${Math.round(progress * 100)}%`
                            : gestureHintText;
                    }

                    // Chỉ kích hoạt React state khi thực sự chuyển hover sang phần tử mới
                    const currentTargetId = activeTarget?.getAttribute("data-hand-target") || null;
                    if (currentTargetId !== lastHoveredIdRef.current) {
                        lastHoveredIdRef.current = currentTargetId;
                        setHoveredTargetId(currentTargetId);
                    }
                    if (!isHandActive) {
                        setIsHandActive(true);
                    }
                } else {
                    currentHoveredElemRef.current = null;
                    dwellStartTimeRef.current = null;
                    scrollVelocityRef.current = 0;
                    smoothedPointerRef.current = { x: -100, y: -100 };
                    if (topScrollBannerRef.current) {
                        topScrollBannerRef.current.style.opacity = "0";
                    }
                    if (bottomScrollBannerRef.current) {
                        bottomScrollBannerRef.current.style.opacity = "0";
                    }
                    if (laserReticleRef.current) {
                        laserReticleRef.current.style.display = "none";
                    }
                    if (lastHoveredIdRef.current !== null) {
                        lastHoveredIdRef.current = null;
                        setHoveredTargetId(null);
                    }
                    if (isHandActive) {
                        setIsHandActive(false);
                    }
                }
            }

            animationFrameId = requestAnimationFrame(checkHandLoop);
        };

        animationFrameId = requestAnimationFrame(checkHandLoop);
    }, [isOpen, handStateRef]);

    // Lọc danh sách hóa chất hợp lệ (loại bỏ đạo cụ dummy)
    const validChemicals = useMemo(() => {
        return allChemicals.filter(
            (c) =>
                c.category !== "other" &&
                c.id !== "microscope" &&
                c.id !== "onion" &&
                c.id !== "lens" &&
                c.id !== "object" &&
                c.id !== "screen" &&
                c.id !== "light-source"
        );
    }, []);

    // Đếm số lượng hóa chất trong mỗi danh mục
    const categoryCounts = useMemo(() => {
        const counts: Record<ChemCabinetCategory, number> = {
            all: validChemicals.length,
            acid: 0,
            base: 0,
            salt: 0,
            metal: 0,
            indicator: 0,
            organic: 0,
        };
        validChemicals.forEach((c) => {
            if (c.category === "acid") counts.acid++;
            else if (c.category === "base") counts.base++;
            else if (c.category === "salt") counts.salt++;
            else if (c.category === "metal") counts.metal++;
            else if (c.category === "indicator") counts.indicator++;
            else if (c.category === "organic" || c.category === "gas") counts.organic++;
        });
        return counts;
    }, [validChemicals]);

    // Tìm kiếm & phân loại thời gian thực
    const filteredChemicals = useMemo(() => {
        const q = searchQuery.trim();
        let list = validChemicals;

        // Lọc theo Category
        if (selectedCategory !== "all") {
            if (selectedCategory === "organic") {
                list = list.filter((c) => c.category === "organic" || c.category === "gas");
            } else {
                list = list.filter((c) => c.category === selectedCategory);
            }
        }

        // Tìm kiếm theo tên hoặc công thức
        if (q) {
            const normQ = normalizeVietnamese(normalizeChemicalFormula(q));
            const rawQLower = q.toLowerCase();
            list = list.filter((c) => {
                const normName = normalizeVietnamese(c.name);
                const normFormula = normalizeChemicalFormula(c.formula).toLowerCase();
                const rawNameLower = c.name.toLowerCase();
                return (
                    normName.includes(normQ) ||
                    normFormula.includes(normQ) ||
                    rawNameLower.includes(rawQLower) ||
                    c.formula.toLowerCase().includes(rawQLower)
                );
            });
        }

        return list;
    }, [validChemicals, selectedCategory, searchQuery]);

    if (!isOpen) return null;

    return (
        <div id="chemical-cabinet-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/45 backdrop-blur-[3px] animate-in fade-in duration-200 select-none">
            {/* Backdrop click to close (Chỉ đóng khi click chuột trực tiếp vào vùng trống ngoài modal) */}
            <div
                className="absolute inset-0"
                onClick={(e) => {
                    if (e.target === e.currentTarget && e.isTrusted) onClose();
                }}
            />

            {/* ─── ĐIỂM NGẮM LASER THỰC TẾ ẢO VR (VISION PRO AIR RETICLE - GPU TRANSLATE3D) ─── */}
            <div
                ref={laserReticleRef}
                className="fixed pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: 0,
                    top: 0,
                    display: "none",
                    willChange: "transform",
                }}
            >
                <div className="relative flex items-center justify-center">
                    {/* Vòng tia ngắm phát sáng Laser */}
                    <svg className="w-16 h-16 -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="24"
                            stroke="rgba(56, 189, 248, 0.3)"
                            strokeWidth="2.5"
                            fill="transparent"
                        />
                        {/* Vòng tiến trình Dwell Click */}
                        <circle
                            ref={dwellCircleRef}
                            cx="32"
                            cy="32"
                            r="24"
                            stroke="#10b981"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={150.8}
                            strokeDashoffset={150.8}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Điểm Laser ngón trỏ */}
                    <div
                        ref={laserBadgeRef}
                        className="absolute w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-2xl transition-colors bg-sky-500 text-white ring-2 ring-sky-300 shadow-sky-500/50"
                    >
                        <Hand className="w-5 h-5 text-sky-400" />
                    </div>

                    {/* Nhãn chỉ dẫn cử chỉ động */}
                    <div className="absolute left-11 top-0 bg-slate-900/95 text-[11px] font-medium text-sky-200 px-2.5 py-1 rounded-full border border-sky-400/50 whitespace-nowrap shadow-xl backdrop-blur-md flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span ref={laserHintRef}>Ngón trỏ: Chọn chất • Ngón út: Đóng tủ</span>
                    </div>
                </div>
            </div>

            {/* Modal Container: HUD Kính Mờ Trong Suốt Thực Tế Ảo */}
            <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900/90 backdrop-blur-2xl border border-sky-500/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white pointer-events-auto">
                {/* ─── 1. HEADER ─── */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xl shadow-lg shadow-sky-500/10">
                            <Layers className="w-5 h-5 text-sky-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                                    TỦ HÓA CHẤT PHÒNG THÍ NGHIỆM
                                </h2>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 font-semibold">
                                    {validChemicals.length} chất
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-medium flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>VR Hand Tracking</span>
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                                <strong className="text-sky-300">Ngón trỏ</strong>: Di chuyển con trỏ • <strong className="text-emerald-400">Ngón giữa</strong>: Chọn chất đưa ra bàn • <strong className="text-amber-300">Ngón út</strong>: Đóng tủ
                            </p>
                        </div>
                    </div>

                    <button
                        data-hand-target="close-modal"
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-400 flex items-center gap-1.5 transition-all cursor-pointer font-semibold text-xs shadow"
                        title="Về bàn thí nghiệm (Esc)"
                    >
                        <X className="w-4 h-4" />
                        <span>Về bàn</span>
                    </button>
                </div>

                {/* ─── 2. SEARCH & CATEGORY BAR ("CHỌN KIỂU") ─── */}
                <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/70 flex flex-col gap-2.5">
                    {/* Thanh tìm kiếm */}
                    <div className="relative w-full">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            <Search className="w-4 h-4 text-slate-400" />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm nhanh: HCl, NaOH, CuSO4, Fe, KMnO4, Phenolphthalein..."
                            className="w-full bg-slate-800/90 border border-slate-700/80 focus:border-sky-400 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                data-hand-target="clear-search"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-700/50 flex items-center justify-center"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Banner gợi ý phản ứng khi có chất tham chiếu trên bàn */}
                    {refChemical && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200">
                            <div className="flex items-center gap-1.5 truncate">
                                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Gợi ý phản ứng với <b>{refChemical.name} ({refChemical.formula})</b>: Các chất có huy hiệu <b>⚡ Có p/ứ</b> sẽ tạo phản ứng khi rót chung.</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">Bạn vẫn có thể tự do chọn bất kỳ chất nào</span>
                        </div>
                    )}

                    {/* Danh mục Categories ("Chọn kiểu"): Ngón trỏ chỉ vào + Ấn ngón là đổi kiểu */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            const isHoveredByHand = hoveredTargetId === `cat-${cat.id}`;
                            const count = categoryCounts[cat.id];
                            const IconComponent = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    data-hand-target={`cat-${cat.id}`}
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        gridContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                                        isSelected
                                            ? "bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30 scale-105 ring-2 ring-sky-400/50"
                                            : isHoveredByHand
                                            ? "bg-sky-900/60 text-white border-sky-300 ring-2 ring-sky-400/60 scale-105"
                                            : "bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/60"
                                    }`}
                                >
                                    <IconComponent className="w-3.5 h-3.5" />
                                    <span>{cat.name}</span>
                                    <span
                                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            isSelected ? "bg-white/20 text-white" : "bg-slate-900/60 text-slate-400"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── 3. SCROLLABLE CHEMICAL GRID KÈM VÙNG CUỘN TỰ ĐỘNG THEO TAY ─── */}
                <div className="flex-1 relative flex overflow-hidden">
                    {/* Dải chỉ báo trực quan khi tay ở vùng trên -> cuộn lên */}
                    <div
                        ref={topScrollBannerRef}
                        className="absolute top-0 left-0 right-14 h-12 bg-gradient-to-b from-sky-500/35 via-sky-500/10 to-transparent pointer-events-none z-20 flex items-start justify-center pt-2 transition-opacity duration-200 opacity-0"
                    >
                        <div className="bg-sky-950/95 border border-sky-400/70 rounded-full px-3.5 py-1 text-[11px] font-bold text-sky-200 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                            <ArrowUp className="w-4 h-4 text-sky-300 animate-bounce" />
                            <span>Đang cuộn lên • Đưa tay vào giữa để dừng</span>
                        </div>
                    </div>

                    {/* Dải chỉ báo trực quan khi tay ở vùng dưới -> cuộn xuống */}
                    <div
                        ref={bottomScrollBannerRef}
                        className="absolute bottom-0 left-0 right-14 h-12 bg-gradient-to-t from-sky-500/35 via-sky-500/10 to-transparent pointer-events-none z-20 flex items-end justify-center pb-2 transition-opacity duration-200 opacity-0"
                    >
                        <div className="bg-sky-950/95 border border-sky-400/70 rounded-full px-3.5 py-1 text-[11px] font-bold text-sky-200 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                            <ArrowDown className="w-4 h-4 text-sky-300 animate-bounce" />
                            <span>Đang cuộn xuống • Đưa tay vào giữa để dừng</span>
                        </div>
                    </div>

                    <div
                        ref={gridContainerRef}
                        className="flex-1 overflow-y-auto p-4 sm:p-5 pr-14 scrollbar-thin scrollbar-thumb-sky-600/40 scrollbar-track-slate-900 relative"
                    >
                        {filteredChemicals.length === 0 ? (
                            <div className="py-16 text-center text-slate-400">
                                <Search className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-50" />
                                <p className="text-sm">Không tìm thấy hóa chất phù hợp với từ khóa &quot;{searchQuery}&quot;</p>
                                <button
                                    data-hand-target="reset-filter"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("all");
                                    }}
                                    className="mt-3 px-3 py-1.5 rounded-xl bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 transition-all"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {filteredChemicals.map((chem) => {
                                    const isActive = activeChemicalId === chem.id;
                                    const isHoveredByHand = hoveredTargetId === `chem-${chem.id}`;
                                    const isLiquid = isLiquidState(chem.state);
                                    const previewColor = isLiquid ? chem.liquidColor : chem.solidColor || chem.color;

                                    // Phản ứng với chất tham chiếu trên bàn (gợi ý)
                                    const canReactWithRef = Boolean(refChemical && (getReaction(refChemical, chem) || getReaction(chem, refChemical)));

                                    return (
                                        <div
                                            key={chem.id}
                                            data-hand-target={`chem-${chem.id}`}
                                            onClick={() => {
                                                playLabSound("pick");
                                                onSelectChemical(chem);
                                                onClose();
                                            }}
                                            className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                                                isActive
                                                    ? "bg-emerald-950/70 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400 scale-[1.02]"
                                                    : canReactWithRef
                                                    ? "bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/80 shadow-2xl shadow-emerald-500/30 scale-[1.02]"
                                                    : isHoveredByHand
                                                    ? "bg-emerald-950/85 border-emerald-400 shadow-2xl shadow-emerald-500/40 ring-2 ring-emerald-400 scale-[1.03]"
                                                    : "bg-slate-800/70 hover:bg-slate-750 border-slate-700/60 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/20 hover:scale-[1.03]"
                                            }`}
                                        >
                                            {/* Badge phản ứng giống bên 2D */}
                                            {canReactWithRef && (
                                                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/90 px-1.5 py-0.5 rounded-md border border-emerald-400/60 shadow-sm animate-pulse z-10">
                                                    <Zap className="w-3 h-3 text-amber-400" />
                                                    <span>Có p/ứ</span>
                                                </div>
                                            )}

                                            {/* Thanh tiến trình từ từ khi ngón trỏ đang ngắm vào chất này */}
                                            {isHoveredByHand && !isActive && (
                                                <div className="absolute top-1.5 left-1.5 right-1.5 bg-slate-950/95 border border-emerald-400/90 rounded-xl p-1.5 shadow-2xl z-20 flex flex-col gap-1 backdrop-blur-md pointer-events-none animate-in fade-in duration-100 ring-1 ring-emerald-400/50">
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300">
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                                            <span>Đang chọn...</span>
                                                        </span>
                                                        <span className="chem-card-progress-text font-mono text-white text-[10px]">0%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
                                                        <div
                                                            className="chem-card-progress h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-75"
                                                            style={{ width: "0%" }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        {/* Badge đang trên bàn */}
                                        {isActive && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded-md border border-emerald-500/40 shadow-sm">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                <span>Trên bàn</span>
                                            </div>
                                        )}

                                        <div>
                                            {/* Preview màu & trạng thái */}
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div
                                                    className="w-5 h-5 rounded-full border border-white/25 shadow-sm shrink-0 flex items-center justify-center text-[10px]"
                                                    style={{ backgroundColor: previewColor }}
                                                />
                                                <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                                                    {getStateLabel(chem.state)}
                                                </span>
                                            </div>

                                            {/* Công thức hóa học */}
                                            <div className="text-base sm:text-lg font-bold text-white group-hover:text-sky-300 transition-colors tracking-tight">
                                                {normalizeChemicalFormula(chem.formula)}
                                            </div>

                                            {/* Tên tiếng Việt */}
                                            <div className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5" title={chem.name}>
                                                {chem.name}
                                            </div>
                                        </div>

                                        {/* Footer card: Nút hành động */}
                                        <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400 capitalize">
                                                {chem.category}
                                            </span>
                                            <span className="text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-200 transition-colors flex items-center gap-1">
                                                <span>Đặt lên bàn</span>
                                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </span>
                                        </div>

                                        {/* Thanh tiến trình viền đáy card */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
                                            <div
                                                className="chem-card-bottom-progress h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 transition-all duration-75"
                                                style={{ width: "0%" }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    </div>

                    {/* Thanh cuộn ảo chuyên dụng (Virtual Scroll Rail) */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-30 pointer-events-auto">
                        <button
                            data-hand-target="scroll-up-btn"
                            onClick={() => {
                                if (gridContainerRef.current) {
                                    gridContainerRef.current.scrollBy({ top: -280, behavior: "smooth" });
                                }
                            }}
                            className={`w-14 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 shadow-2xl transition-all cursor-pointer backdrop-blur group ${
                                hoveredTargetId === "scroll-up-btn"
                                    ? "bg-sky-500 border-sky-300 text-white scale-110 ring-4 ring-sky-400/50 shadow-sky-500/40"
                                    : "bg-slate-800/90 hover:bg-sky-600 border-slate-700 hover:border-sky-400 text-white"
                            }`}
                            title="Chỉ ngón tay vào để cuộn lên"
                        >
                            <ArrowUp className="w-5 h-5 text-sky-300 group-hover:-translate-y-0.5 transition-transform" />
                            <span className="text-[11px] font-bold">Lên</span>
                        </button>
                        <button
                            data-hand-target="scroll-down-btn"
                            onClick={() => {
                                if (gridContainerRef.current) {
                                    gridContainerRef.current.scrollBy({ top: 280, behavior: "smooth" });
                                }
                            }}
                            className={`w-14 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 shadow-2xl transition-all cursor-pointer backdrop-blur group ${
                                hoveredTargetId === "scroll-down-btn"
                                    ? "bg-sky-500 border-sky-300 text-white scale-110 ring-4 ring-sky-400/50 shadow-sky-500/40"
                                    : "bg-slate-800/90 hover:bg-sky-600 border-slate-700 hover:border-sky-400 text-white"
                            }`}
                            title="Chỉ ngón tay vào để cuộn xuống"
                        >
                            <ArrowDown className="w-5 h-5 text-sky-300 group-hover:translate-y-0.5 transition-transform" />
                            <span className="text-[11px] font-bold">Xuống</span>
                        </button>
                    </div>
                </div>

                {/* ─── 4. FOOTER STATUS BAR & NÚT CUỘN THỰC TẾ ẢO ─── */}
                <div className="px-6 py-2.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                        <span>Hiển thị <strong className="text-sky-400">{filteredChemicals.length}</strong> / {validChemicals.length} chất</span>
                    </div>

                    {/* Hướng dẫn cử chỉ vùng cuộn & nút thoát */}
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            Đưa tay xuống dưới để cuộn xuống • Đưa tay lên trên để cuộn lên • Ở giữa để đứng yên ngắm chọn
                        </span>
                        <button
                            data-hand-target="footer-close-btn"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>Xong / Về bàn</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
