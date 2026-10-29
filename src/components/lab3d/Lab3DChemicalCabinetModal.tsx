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
    const latestProjectedTipRef = useRef<{ screenX: number; screenY: number; timestamp: number } | null>(null);
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
                    const hasFreshProj = proj && now - proj.timestamp < 150;
                    const targetX = hasFreshProj ? proj.screenX : (1.0 - indexTip.x) * window.innerWidth;
                    const targetY = hasFreshProj ? proj.screenY : indexTip.y * window.innerHeight;

                    // 🎯 BỘ LỌC LÀM MỊN ĐỨNG YÊN (DEADZONE + ADAPTIVE EMA) - TRIỆT TIÊU 100% RUNG GIẬT CON TRỎ:
                    const cur = smoothedPointerRef.current;
                    if (cur.x < 0 || cur.y < 0) {
                        cur.x = targetX;
                        cur.y = targetY;
                    } else {
                        const dist = Math.hypot(targetX - cur.x, targetY - cur.y);
                        // Deadband: Bỏ qua hoàn toàn rung lắc vi mô (< 3.2px) của webcam sensor
                        if (dist > 3.2) {
                            // Lọc thích ứng: Khi ngắm/rê chậm -> alpha = 0.20 (đứng yên vững như chuột bàn phím)
                            // Khi di chuyển nhanh -> alpha = 0.52 (bám ngón tay nhạy bén)
                            const alpha = dist < 20 ? 0.20 : dist < 50 ? 0.35 : 0.52;
                            cur.x += (targetX - cur.x) * alpha;
                            cur.y += (targetY - cur.y) * alpha;
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

                    // Phân biệt Bàn tay mở (Open hand) vs Nắm tay (Fist / Grab ✊) vs Chụm ngón (Pinch 👌)
                    const isOpenHand = hand.gesture === "OPEN" || extendedCount >= 3;

                    // 1. CỬ CHỈ NẮM TAY (FIST ✊ / GRAB) - CỰC KỲ DỄ NHẬN BIẾT & TỰ NHIÊN:
                    // Người dùng chỉ ngón vào hóa chất rồi NẮM TAY LẠI (✊) để LẤY CHẤT ĐƯA RA BÀN!
                    const isFistGrab = (hand.gesture === "GRAB" || (hand.gripStrength !== undefined && hand.gripStrength > 0.48)) && !isOpenHand;

                    // 2. CỬ CHỈ CHỤM NGÓN (PINCH 👌):
                    // Ngón cái chạm vào đầu ngón trỏ hoặc ngón giữa
                    const rawPinchIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
                    const rawPinchMiddle = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
                    const minPinch2D = Math.min(rawPinchIndex, rawPinchMiddle);
                    const isPinch = (minPinch2D < 0.058 || (hand.pinchDistance !== undefined && hand.pinchDistance < 0.058)) && !isOpenHand;

                    // Kích hoạt khi NẮM TAY (✊) HOẶC CHỤM NGÓN (👌):
                    const isTriggerActive = isFistGrab || isPinch;
                    const isHandOpen = isOpenHand || (!isTriggerActive && minPinch2D > 0.078);

                    if (isHandOpen) {
                        wasPinchingRef.current = false;
                    }

                    // ─── 1. CUỘN THEO VÙNG TAY (ZONE-BASED CONTINUOUS SCROLLING):
                    // - Phía DƯỚI GUI (relY > 0.78): Tự động cuộn XUỐNG
                    // - Phía TRÊN GUI (relY < 0.22): Tự động cuộn LÊN
                    // - Phía GIỮA GUI (0.22 <= relY <= 0.78): ĐỨNG YÊN HOÀN TOÀN 100%!
                    let scrollZone: "top" | "bottom" | "neutral" = "neutral";
                    let targetVel = 0;

                    if (gridContainerRef.current) {
                        const rect = gridContainerRef.current.getBoundingClientRect();
                        const relY = (cur.y - rect.top) / rect.height;
                        const isInModalX = cur.x >= rect.left - 50 && cur.x <= rect.right + 50;

                        if (isInModalX && relY >= -0.15 && relY <= 1.15) {
                            if (relY < 0.22) {
                                // VÙNG TRÊN (TOP ZONE): Cuộn LÊN
                                scrollZone = "top";
                                const factor = Math.min(1, Math.max(0, (0.22 - relY) / 0.22));
                                targetVel = -1 * (5 + factor * 15); // -5px đến -20px/frame
                                clickCooldownUntilRef.current = now + 150;
                                dwellStartTimeRef.current = null;
                            } else if (relY > 0.78) {
                                // VÙNG DƯỚI (BOTTOM ZONE): Cuộn XUỐNG
                                scrollZone = "bottom";
                                const factor = Math.min(1, Math.max(0, (relY - 0.78) / 0.22));
                                targetVel = 1 * (5 + factor * 15); // +5px đến +20px/frame
                                clickCooldownUntilRef.current = now + 150;
                                dwellStartTimeRef.current = null;
                            } else {
                                // VÙNG GIỮA (MIDDLE ZONE): ĐỨNG YÊN HOÀN TOÀN!
                                scrollZone = "neutral";
                                targetVel = 0;
                            }
                        }
                    }

                    // Làm mịn vận tốc cuộn (EMA Filter):
                    scrollVelocityRef.current = scrollVelocityRef.current * 0.72 + targetVel * 0.28;
                    if (Math.abs(scrollVelocityRef.current) < 0.25) {
                        scrollVelocityRef.current = 0;
                    }

                    if (gridContainerRef.current && Math.abs(scrollVelocityRef.current) > 0.25) {
                        gridContainerRef.current.scrollTop += scrollVelocityRef.current;
                    }

                    // Cập nhật banner trực quan:
                    if (topScrollBannerRef.current) {
                        topScrollBannerRef.current.style.opacity = scrollZone === "top" ? "1" : "0";
                    }
                    if (bottomScrollBannerRef.current) {
                        bottomScrollBannerRef.current.style.opacity = scrollZone === "bottom" ? "1" : "0";
                    }

                    // Tấm chắn khóa click trong 1.5s đầu mở tủ hoặc khi đang cuộn dở:
                    const isShieldActive = now < modalOpenedTimeRef.current + 1500 || now < clickCooldownUntilRef.current;
                    const isClickAllowed = !isShieldActive && scrollZone === "neutral" && Math.abs(scrollVelocityRef.current) <= 0.5;

                    let gestureHintText = "👉 Chỉ ngón để ngắm • 👌 Chụm ngón (Pinch) để lấy";
                    if (scrollZone === "top") {
                        gestureHintText = "⬆️ Đang cuộn lên • Đưa tay vào giữa để dừng";
                    } else if (scrollZone === "bottom") {
                        gestureHintText = "⬇️ Đang cuộn xuống • Đưa tay vào giữa để dừng";
                    }

                    // ─── 2. NGẮM VÀ CHỌN (POINT & SELECT - CHUẨN VIRTUAL-MOUSE) ───
                    const elementAtPoint = document.elementFromPoint(cur.x, cur.y);
                    const directTarget = isClickAllowed
                        ? elementAtPoint?.closest<HTMLElement>("[data-hand-target]") || null
                        : null;

                    // Vùng đệm chống rung nhẹ 150ms
                    let activeTarget: HTMLElement | null = null;
                    if (directTarget) {
                        activeTarget = directTarget;
                        currentHoveredElemRef.current = directTarget;
                        lastHoveredElemTimeRef.current = now;
                    } else if (currentHoveredElemRef.current && (now - lastHoveredElemTimeRef.current < 150) && isClickAllowed) {
                        activeTarget = currentHoveredElemRef.current;
                    } else {
                        currentHoveredElemRef.current = null;
                    }

                    let progress = 0;

                    if (activeTarget && isClickAllowed) {
                        const targetId = activeTarget.getAttribute("data-hand-target") || "";
                        const isCategoryBtn = targetId.startsWith("cat-");
                        const isChemicalCard = targetId.startsWith("chem-");
                        const isScrollBtn = targetId.includes("scroll-");

                        // ─── THAO TÁC 1: DƠ NGÓN GIỮA (🖕) HOẶC NẮM TAY (✊) / CHỤM NGÓN (👌) -> CHỌN CHẤT NGAY ───
                        const isMiddleTrigger = isMiddleExt && !isPinkyExt;
                        if ((isMiddleTrigger || isTriggerActive) && !wasPinchingRef.current) {
                            wasPinchingRef.current = true;
                            clickCooldownUntilRef.current = now + 700;
                            activeTarget.click();
                            playLabSound("pick");
                            dwellStartTimeRef.current = null;
                            progress = 0;
                        }

                        // ─── THAO TÁC 2: NGẮM VÀ GIỮ HOẶC DƠ NGÓN GIỮA ───
                        if (isChemicalCard) {
                            gestureHintText = "🖕 Dơ ngón giữa để Chọn chất • Hoặc giữ 600ms";
                            const dwellDuration = 600;
                            if (!dwellStartTimeRef.current) {
                                dwellStartTimeRef.current = now;
                                progress = 0;
                            } else {
                                const elapsed = now - dwellStartTimeRef.current;
                                progress = Math.min(1.0, elapsed / dwellDuration);

                                if (progress >= 1.0) {
                                    activeTarget.click();
                                    playLabSound("pick");
                                    clickCooldownUntilRef.current = now + 600;
                                    dwellStartTimeRef.current = null;
                                    progress = 0;
                                }
                            }
                        } else if (isCategoryBtn) {
                            const dwellDuration = 550;
                            if (!dwellStartTimeRef.current) {
                                dwellStartTimeRef.current = now;
                                progress = 0;
                            } else {
                                const elapsed = now - dwellStartTimeRef.current;
                                progress = Math.min(1.0, elapsed / dwellDuration);

                                if (progress >= 1.0) {
                                    activeTarget.click();
                                    playLabSound("pick");
                                    clickCooldownUntilRef.current = now + 500;
                                    dwellStartTimeRef.current = null;
                                    progress = 0;
                                }
                            }
                        } else {
                            dwellStartTimeRef.current = null;
                            progress = 0;
                        }

                        if (isChemicalCard) {
                            gestureHintText = "☝️ Giữ ngón trỏ hoặc ✊/👌 để Lấy chất này";
                        } else if (isCategoryBtn) {
                            gestureHintText = progress > 0 ? "⏳ Đang đổi danh mục..." : "✨ Nắm tay hoặc giữ ngón để đổi";
                        } else if (isScrollBtn) {
                            gestureHintText = "📜 Nắm tay hoặc di chuyển tay để cuộn";
                        }
                    } else {
                        dwellStartTimeRef.current = null;
                        progress = 0;
                    }

                    // ─── CẬP NHẬT TRỰC TIẾP VÀO DOM LASER POINTER (GPU ACCELERATION - KHÔNG RE-RENDER REACT) ───
                    if (laserReticleRef.current) {
                        laserReticleRef.current.style.transform = `translate3d(${Math.round(cur.x)}px, ${Math.round(cur.y)}px, 0)`;
                        laserReticleRef.current.style.display = "block";
                    }
                    if (laserBadgeRef.current) {
                        laserBadgeRef.current.innerText = isTriggerActive ? "✊" : isPinch ? "👌" : "👆";
                    }
                    if (dwellCircleRef.current) {
                        dwellCircleRef.current.style.strokeDashoffset = `${150.8 * (1 - progress)}`;
                    }
                    if (laserHintRef.current) {
                        laserHintRef.current.innerText = isShieldActive ? "⏳ Đang sẵn sàng... Phẩy tay để cuộn" : gestureHintText;
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
                                                    ? "bg-sky-950/80 border-sky-400 shadow-2xl shadow-sky-500/30 ring-2 ring-sky-400 scale-[1.04]"
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

                                            {/* Nhãn gợi ý khi đang ngắm */}
                                            {isHoveredByHand && !isActive && (
                                                <div className="absolute top-2 left-2 right-2 bg-gradient-to-r from-sky-600 to-emerald-600 text-white text-[10px] font-bold py-1 px-1.5 rounded-lg text-center shadow-lg z-20 flex items-center justify-center gap-1.5 border border-sky-300 animate-pulse">
                                                    <Hand className="w-3.5 h-3.5 text-white" />
                                                    <span>Ấn ngón giữa để Lấy</span>
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
                                            <span className="text-[11px] font-semibold text-sky-400 group-hover:text-sky-200 transition-colors flex items-center gap-1">
                                                <span>Đặt lên bàn</span>
                                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </span>
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
