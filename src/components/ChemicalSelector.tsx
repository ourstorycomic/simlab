"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Chemical, chemicals, chemicalCategories, isLiquidState, getStateLabel } from "@/lib/chemicals";
import { getReaction } from "@/lib/reactions";

interface ChemicalSelectorProps {
    onSelect: (chemical: Chemical) => void;
    disabled: boolean;
    selectedIds: string[];
    slot1: Chemical | null;
    slot2: Chemical | null;
    onReplace: (slot: 1 | 2, chemical: Chemical) => void;
    onReset?: () => void;
}

// ─── Chuẩn hóa tiếng Việt (bỏ dấu) để tìm kiếm linh hoạt (dong -> Đồng, sat -> Sắt) ───
export function normalizeVietnamese(str: string): string {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .toLowerCase()
        .trim();
}

// ─── Chuyển đổi ký tự chỉ số dưới (subscript) sang số thường (H₂SO₄ -> H2SO4, Cu(OH)₂ -> Cu(OH)2) ───
export function normalizeChemicalFormula(formula: string): string {
    if (!formula) return "";
    const subscriptMap: Record<string, string> = {
        "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
        "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
        "⁺": "+", "⁻": "-",
    };
    return formula.replace(/[₀-₉⁺⁻]/g, (char) => subscriptMap[char] || char);
}

// ─── Realistic mini test tube preview ───
function MiniTestTube({ chemical }: { chemical: Chemical }) {
    const isLiquid = isLiquidState(chemical.state);
    const color = chemical.liquidColor;
    const colorEnd = chemical.liquidColorEnd || color;

    return (
        <svg viewBox="0 0 28 44" className="w-7 h-11 drop-shadow-sm">
            <defs>
                <linearGradient id={`mini-liq-${chemical.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={colorEnd} />
                </linearGradient>
            </defs>
            <path d="M8 2 L8 32 Q8 40 14 42 Q20 40 20 32 L20 2" fill="rgba(255,255,255,0.08)" stroke="rgba(200,215,240,0.35)" strokeWidth="0.8" />
            <rect x="6" y="0" width="16" height="4" rx="1" fill="rgba(255,255,255,0.06)" stroke="rgba(200,215,240,0.25)" strokeWidth="0.6" />
            {isLiquid && (
                <rect x="9" y="14" width="10" height="24" rx="1.5" fill={`url(#mini-liq-${chemical.id})`} opacity="0.8" />
            )}
            {!isLiquid && chemical.solidColor && (
                <rect x="9" y="22" width="10" height="16" rx="1.5" fill={chemical.solidColor} opacity="0.7" />
            )}
            <path d="M10 4 L10 36" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
        </svg>
    );
}

// ─── Solid SVG preview ───
function SolidPreview({ chemical }: { chemical: Chemical }) {
    return (
        <svg viewBox="0 0 32 32" className="w-8 h-8 drop-shadow-sm">
            <defs>
                <linearGradient id={`solid-grad-${chemical.id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={chemical.solidColor || chemical.color} />
                    <stop offset="100%" stopColor={chemical.solidColorEnd || chemical.solidColor || chemical.color} />
                </linearGradient>
                {chemical.solidType === "crystal" && (
                    <filter id={`crystal-shine-${chemical.id}`}>
                        <feSpecularLighting result="spec" specularExponent="20" lightingColor="#ffffff">
                            <fePointLight x="8" y="8" z="20" />
                        </feSpecularLighting>
                        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0" />
                    </filter>
                )}
            </defs>
            {chemical.solidType === "crystal" && (
                <>
                    <polygon points="16,2 28,10 28,24 16,30 4,24 4,10" fill={`url(#solid-grad-${chemical.id})`} opacity="0.85" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                    <polygon points="16,2 16,30 28,24 28,10" fill="rgba(255,255,255,0.08)" />
                    <polygon points="16,2 16,30 4,24 4,10" fill="rgba(0,0,0,0.05)" />
                    <polygon points="16,2 28,10 4,10" fill="rgba(255,255,255,0.06)" />
                </>
            )}
            {chemical.solidType === "metal" && (
                <>
                    <rect x="6" y="8" width="20" height="18" rx="3" fill={`url(#solid-grad-${chemical.id})`} opacity="0.8" />
                    <rect x="8" y="10" width="8" height="3" rx="1" fill="rgba(255,255,255,0.15)" />
                    <rect x="8" y="16" width="14" height="2" rx="1" fill="rgba(0,0,0,0.06)" />
                </>
            )}
            {(!chemical.solidType || chemical.solidType === "powder") && (
                <>
                    <ellipse cx="16" cy="22" rx="12" ry="6" fill={`url(#solid-grad-${chemical.id})`} opacity="0.7" />
                    <ellipse cx="14" cy="20" rx="8" ry="4" fill="rgba(255,255,255,0.08)" />
                </>
            )}
            {chemical.solidType === "chunk" && (
                <path d="M8,12 L12,6 L22,8 L26,16 L22,24 L14,26 L8,20 Z" fill={`url(#solid-grad-${chemical.id})`} opacity="0.8" />
            )}
        </svg>
    );
}

// ─── Hazard labels as text badges ───
function HazardBadgeIcon({ type }: { type: string }) {
    const colors: Record<string, { bg: string; text: string; label: string }> = {
        corrosive: { bg: "#fef2f2", text: "#dc2626", label: "ĂN MÒN" },
        toxic: { bg: "#f0fdf4", text: "#16a34a", label: "ĐỘC" },
        flammable: { bg: "#fff7ed", text: "#ea580c", label: "DỄ CHÁY" },
        hazardous: { bg: "#fefce8", text: "#ca8a04", label: "NGUY HIỂM" },
    };
    const c = colors[type] || colors.hazardous;
    return (
        <span className="text-[6px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-wider" style={{ backgroundColor: c.bg, color: c.text }}>
            {c.label}
        </span>
    );
}

export default function ChemicalSelector({
    onSelect,
    disabled,
    selectedIds,
    slot1,
    slot2,
    onReplace,
    onReset,
}: ChemicalSelectorProps) {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // ─── Xác định chất tham chiếu (khi người dùng đã chọn 1 chất duy nhất) ───
    const refChemical = useMemo(() => {
        if (slot1 && !slot2) return slot1;
        if (!slot1 && slot2) return slot2;
        return null;
    }, [slot1, slot2]);

    // ─── Lập danh sách các hóa chất có phản ứng với refChemical ───
    const reactableIds = useMemo(() => {
        if (!refChemical) return new Set<string>();
        const set = new Set<string>();
        for (const c of chemicals) {
            if (c.id === refChemical.id) continue;
            const r = getReaction(refChemical, c) || getReaction(c, refChemical);
            // Chỉ coi là có phản ứng nếu r tồn tại và r.type !== "none"
            if (r && r.type !== "none") {
                set.add(c.id);
            }
        }
        return set;
    }, [refChemical]);

    const filteredChemicals = useMemo(() => {
        const query = searchQuery.trim();
        if (!query) {
            return chemicals.filter((c) => activeCategory === "all" || c.category === activeCategory);
        }

        const normQuery = normalizeVietnamese(normalizeChemicalFormula(query));
        const queryTokens = normQuery.split(/\s+/).filter(Boolean);

        return chemicals.filter((c) => {
            const matchCategory = activeCategory === "all" || c.category === activeCategory;
            if (!matchCategory) return false;

            const rawFormula = c.formula || "";
            const flatFormula = normalizeChemicalFormula(rawFormula);
            const normName = normalizeVietnamese(c.name);
            const normFormula = normalizeVietnamese(flatFormula);
            const normRawFormula = normalizeVietnamese(rawFormula);
            const normId = normalizeVietnamese(c.id);
            const normDesc = normalizeVietnamese(c.description || "");
            const normCategory = normalizeVietnamese(c.category || "");

            // Hỗ trợ từ đồng nghĩa IUPAC: sulf <-> sunf, chlor <-> clor, photph <-> phosph
            const synonymText = normName
                .replace(/sunf/g, "sulf").replace(/clor/g, "chlor").replace(/photph/g, "phosph") + " " +
                normName
                .replace(/sulf/g, "sunf").replace(/chlor/g, "clor").replace(/phosph/g, "photph");

            const searchableText = `${normName} ${normFormula} ${normRawFormula} ${normId} ${normDesc} ${normCategory} ${synonymText}`.toLowerCase();

            return queryTokens.every((token) => {
                return (
                    searchableText.includes(token) ||
                    flatFormula.toLowerCase().includes(token) ||
                    rawFormula.toLowerCase().includes(token) ||
                    c.id.toLowerCase().includes(token)
                );
            });
        });
    }, [activeCategory, searchQuery]);

    const handleChemicalClick = (chemical: Chemical) => {
        if (disabled) {
            // Khi đang có phản ứng hoàn thành hoặc bị khóa, bấm vào bất kỳ chất nào sẽ dọn bàn và chọn ngay chất đó làm chất đầu tiên
            if (onReset) {
                onReset();
                setTimeout(() => {
                    onSelect(chemical);
                }, 40);
            }
            return;
        }
        if (selectedIds.includes(chemical.id)) return;
        // Nếu đã có 1 chất, chặn click những chất không có phản ứng
        if (refChemical && !reactableIds.has(chemical.id)) return;
        onSelect(chemical);
    };

    const handleDragStart = useCallback(
        (e: React.DragEvent, chemical: Chemical) => {
            if (disabled) {
                if (onReset) {
                    onReset();
                } else {
                    e.preventDefault();
                    return;
                }
            }
            // Nếu đã có 1 chất, chặn kéo thả những chất không có phản ứng
            if (refChemical && !reactableIds.has(chemical.id)) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData("application/simlab-chemical", chemical.id);
            e.dataTransfer.effectAllowed = "copy";
            const dragImage = e.currentTarget as HTMLElement;
            e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
        },
        [disabled, onReset, refChemical, reactableIds]
    );

    const getChemicalState = (id: string) => {
        if (!slot1 && !slot2) return "available";
        if (slot1?.id === id) return "slot1";
        if (slot2?.id === id) return "slot2";
        return "available";
    };

    return (
        <div
            className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-200"
            style={{ borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
            {/* Header */}
            <div className="p-3 pb-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 2v7.31M14 2v7.31" strokeLinecap="round" />
                        <path d="M8 12h8M6 16h12M4 20h16" strokeLinejoin="round" />
                        <path d="M6 9h12l2 11H4L6 9Z" />
                    </svg>
                    <div className="min-w-0">
                        <h2 className="text-xs font-semibold text-gray-800 dark:text-gray-100">Kho hóa chất</h2>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-2 relative">
                    <input
                        type="text"
                        placeholder="Tìm theo tên (Cu, Axit...) hoặc CTHH..."
                        value={searchQuery}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSearchQuery(val);
                            if (val.trim() && activeCategory !== "all") {
                                setActiveCategory("all");
                            }
                        }}
                        className="lab-input pl-7 pr-7 text-xs py-1.5 w-full"
                    />
                    <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs w-4 h-4 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                            title="Xóa tìm kiếm"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Banner chuyển sang thí nghiệm mới khi đang khóa hoặc đã xong phản ứng */}
                {disabled && onReset && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-400/40 dark:border-blue-500/40 flex flex-col gap-1.5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                <span>✨ Đã hoàn thành thí nghiệm</span>
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight">
                            Bấm chọn hóa chất bất kỳ trong danh sách hoặc bấm nút bên dưới để dọn bàn:
                        </p>
                        <button
                            onClick={onReset}
                            className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                        >
                            <span>🧪 Làm thí nghiệm khác (Dọn bàn)</span>
                        </button>
                    </div>
                )}

                {/* Thông báo ghép phản ứng thông minh */}
                {refChemical && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5 truncate">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                                Đã lấy: <b className="text-emerald-900 dark:text-emerald-200">{refChemical.name}</b>
                            </span>
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded flex-shrink-0">
                                {reactableIds.size} chất
                            </span>
                        </div>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400/90 leading-tight">
                            💡 Các chất có phản ứng sẽ <b>SÁNG LÊN</b>. Chất không phản ứng bị <b>KHÓA</b>.
                        </p>
                    </div>
                )}
            </div>

            {/* Body: Categories on LEFT, Chemicals on RIGHT */}
            <div className="flex flex-1 overflow-hidden">
                {/* ─── Categories (Left Sidebar) ─── */}
                <div className="w-20 flex-shrink-0 border-r border-gray-100 dark:border-gray-700 overflow-y-auto py-2 flex flex-col gap-0.5 px-1.5">
                    {chemicalCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`text-left px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-150 leading-tight ${activeCategory === cat.id
                                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"
                                }`}
                            title={cat.name}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* ─── Chemical Grid (Right Area) ─── */}
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Báo cáo số lượng kết quả khi đang tìm kiếm */}
                    {searchQuery.trim() && (
                        <div className="mb-2 px-1 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                            <span>
                                Tìm thấy <b className="text-blue-600 dark:text-blue-400 font-semibold">{filteredChemicals.length}</b> hóa chất
                            </span>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[9px]"
                            >
                                Đặt lại
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5">
                        {filteredChemicals.map((chemical) => {
                            const state = getChemicalState(chemical.id);
                            const isSlot1 = state === "slot1";
                            const isSlot2 = state === "slot2";
                            const isPlaced = isSlot1 || isSlot2;
                            const isLiquid = isLiquidState(chemical.state);

                            // Tính toán trạng thái phản ứng thông minh
                            const isRefSelf = refChemical?.id === chemical.id;
                            const canReactWithRef = refChemical ? reactableIds.has(chemical.id) : true;
                            const isBlockedByRef = Boolean(refChemical && !canReactWithRef && !isRefSelf);

                            const isDisabled = disabled || (isPlaced && !slot1 && !slot2) || isBlockedByRef;
                            const isHtmlDisabled = isBlockedByRef || (disabled && !onReset) || !!(isPlaced && slot1 && slot2);

                            return (
                                <button
                                    key={chemical.id}
                                    draggable={!isDisabled && !disabled}
                                    onClick={() => handleChemicalClick(chemical)}
                                    onDragStart={(e) => handleDragStart(e, chemical)}
                                    disabled={isHtmlDisabled}
                                    className={`
                                        relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 select-none
                                        ${isSlot1
                                            ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/30"
                                            : isSlot2
                                                ? "border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/30"
                                                : refChemical && canReactWithRef && !isRefSelf
                                                    /* SÁNG LÊN KHI CÓ THỂ PHẢN ỨNG */
                                                    ? "border-emerald-500 dark:border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/40 shadow-sm shadow-emerald-500/20 hover:border-emerald-600 dark:hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                                        }
                                        ${isBlockedByRef
                                            /* MỜ MỜ VÀ BLOCK LẠI KHI KHÔNG PHẢN ỨNG */
                                            ? "opacity-25 grayscale cursor-not-allowed border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/20 pointer-events-none"
                                            : isDisabled
                                                ? "opacity-30 cursor-not-allowed"
                                                : "cursor-grab active:cursor-grabbing"
                                        }
                                        ${!isDisabled && !isPlaced && (!refChemical || canReactWithRef) ? "hover:-translate-y-0.5" : ""}
                                    `}
                                    title={
                                        refChemical && !canReactWithRef && !isRefSelf
                                            ? `${chemical.name} — Không có phản ứng với ${refChemical.name} (Đã khóa)`
                                            : refChemical && canReactWithRef && !isRefSelf
                                                ? `⚡ ${chemical.name} — CÓ PHẢN ỨNG VỚI ${refChemical.name}!`
                                                : `${chemical.name} (${chemical.formula})`
                                    }
                                >
                                    {/* Slot badge */}
                                    {isSlot1 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[7px] font-bold text-white flex items-center justify-center shadow-sm z-10">1</span>
                                    )}
                                    {isSlot2 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-[7px] font-bold text-white flex items-center justify-center shadow-sm z-10">2</span>
                                    )}

                                    {/* Badge sáng phản ứng hoặc khóa */}
                                    {refChemical && canReactWithRef && !isRefSelf && (
                                        <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-[6px] font-bold text-white flex items-center gap-0.5 shadow-sm z-10 animate-pulse">
                                            ⚡ Có p/ứ
                                        </span>
                                    )}
                                    {isBlockedByRef && (
                                        <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-gray-400/80 dark:bg-gray-600/80 text-[6px] font-medium text-white shadow-sm z-10">
                                            ✕ Khóa
                                        </span>
                                    )}

                                    {/* Preview */}
                                    {isLiquid ? (
                                        <MiniTestTube chemical={chemical} />
                                    ) : (
                                        <div className="relative w-7 h-7">
                                            <SolidPreview chemical={chemical} />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="text-center leading-tight">
                                        <p className={`text-[9px] font-medium ${refChemical && canReactWithRef && !isRefSelf ? "text-emerald-900 dark:text-emerald-200 font-bold" : "text-gray-700 dark:text-gray-300"}`}>
                                            {chemical.name}
                                        </p>
                                        <p className={`text-[7px] ${refChemical && canReactWithRef && !isRefSelf ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
                                            {chemical.formula}
                                        </p>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-0.5 flex-wrap justify-center">
                                        <span className="text-[6px] px-1 py-0.5 rounded font-semibold uppercase tracking-wider" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                                            {getStateLabel(chemical.state)}
                                        </span>
                                        {chemical.corrosive && <HazardBadgeIcon type="corrosive" />}
                                        {chemical.toxic && <HazardBadgeIcon type="toxic" />}
                                        {chemical.flammable && <HazardBadgeIcon type="flammable" />}
                                        {chemical.hazardous && !chemical.corrosive && !chemical.toxic && !chemical.flammable && <HazardBadgeIcon type="hazardous" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {filteredChemicals.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 px-2 text-center">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-2.5 text-blue-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                            </div>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Không tìm thấy hóa chất</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 max-w-[170px] leading-relaxed">
                                Thử gõ tên không dấu (<b>dong</b>, <b>sat</b>, <b>axit</b>) hoặc CTHH (<b>Cu</b>, <b>H2SO4</b>, <b>HNO3</b>)...
                            </p>
                            {activeCategory !== "all" && (
                                <button
                                    onClick={() => setActiveCategory("all")}
                                    className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-semibold underline"
                                >
                                    Tìm trong tất cả danh mục
                                </button>
                            )}
                            <button
                                onClick={() => setSearchQuery("")}
                                className="mt-2.5 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-[10px] font-semibold transition-colors"
                            >
                                Xóa tìm kiếm
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex-shrink-0">
                {refChemical ? (
                    <div className="flex items-center justify-between text-[8px]">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Sáng: Phản ứng được ({reactableIds.size})
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Mờ: Đã khóa (Không p/ứ)
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-[8px] text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Dụng cụ 1
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Dụng cụ 2
                        </span>
                        <span className="ml-auto flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 6-6-6-6m9 12h9" />
                            </svg>
                            Kéo thả
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
