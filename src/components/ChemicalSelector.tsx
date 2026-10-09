"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Chemical, chemicals, chemicalCategories, isLiquidState, getStateLabel } from "@/lib/chemicals";

interface ChemicalSelectorProps {
    onSelect: (chemical: Chemical) => void;
    disabled: boolean;
    selectedIds: string[];
    slot1: Chemical | null;
    slot2: Chemical | null;
    onReplace: (slot: 1 | 2, chemical: Chemical) => void;
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
}: ChemicalSelectorProps) {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredChemicals = useMemo(() => {
        return chemicals.filter((c) => {
            const matchCategory = activeCategory === "all" || c.category === activeCategory;
            const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.formula.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [activeCategory, searchQuery]);

    const handleChemicalClick = (chemical: Chemical) => {
        if (disabled || selectedIds.includes(chemical.id)) return;
        onSelect(chemical);
    };

    const handleDragStart = useCallback(
        (e: React.DragEvent, chemical: Chemical) => {
            if (disabled) { e.preventDefault(); return; }
            e.dataTransfer.setData("application/simlab-chemical", chemical.id);
            e.dataTransfer.effectAllowed = "copy";
            const dragImage = e.currentTarget as HTMLElement;
            e.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
        },
        [disabled]
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
                        placeholder="Tìm hóa chất..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="lab-input pl-7 text-xs py-1.5"
                    />
                    <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-[10px]">✕</button>
                    )}
                </div>
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
                    <div className="grid grid-cols-2 gap-1.5">
                        {filteredChemicals.map((chemical) => {
                            const state = getChemicalState(chemical.id);
                            const isPlaced = state === "slot1" || state === "slot2";
                            const isDisabled = disabled || (isPlaced && !slot1 && !slot2);
                            const isSlot1 = state === "slot1";
                            const isSlot2 = state === "slot2";
                            const isLiquid = isLiquidState(chemical.state);

                            return (
                                <button
                                    key={chemical.id}
                                    draggable={!isDisabled}
                                    onClick={() => handleChemicalClick(chemical)}
                                    onDragStart={(e) => handleDragStart(e, chemical)}
                                    disabled={isDisabled || !!(isPlaced && slot1 && slot2)}
                                    className={`
                                        relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-150 select-none
                                        ${isSlot1
                                            ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/30"
                                            : isSlot2
                                                ? "border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/30"
                                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm dark:hover:shadow-gray-900/30"
                                        }
                                        ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
                                        ${!isDisabled && !isPlaced ? "hover:-translate-y-0.5" : ""}
                                    `}
                                    title={`${chemical.name} (${chemical.formula})`}
                                >
                                    {/* Slot badge */}
                                    {isSlot1 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[7px] font-bold text-white flex items-center justify-center shadow-sm z-10">1</span>
                                    )}
                                    {isSlot2 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-[7px] font-bold text-white flex items-center justify-center shadow-sm z-10">2</span>
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
                                        <p className="text-[9px] font-medium text-gray-700 dark:text-gray-300">{chemical.name}</p>
                                        <p className="text-[7px] text-gray-400 dark:text-gray-500">{chemical.formula}</p>
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
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                            <svg className="w-8 h-8 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Không tìm thấy</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Thử từ khóa khác</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex-shrink-0">
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
            </div>
        </div>
    );
}
