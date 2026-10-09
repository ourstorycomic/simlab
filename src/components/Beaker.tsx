"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Chemical, isLiquidState } from "@/lib/chemicals";
import { ReactionResult } from "@/lib/reactions";
import {
    GlasswareType,
    glasswareGeometries,
    glasswareNames,
    TransactionType,
} from "@/lib/glassware";

interface BeakerProps {
    chemical: Chemical | null;
    reaction: ReactionResult | null;
    isReacting: boolean;
    slotNumber: 1 | 2;
    onClear: () => void;
    isDragOver?: boolean;
    glassware?: GlasswareType;
    transactionType?: TransactionType;
    transactionColor?: string;
    showTransaction?: boolean;
    onTransactionEnd?: () => void;
}

// ─── Solid matter renderer (geometry-aware) ───
function SolidContent({
    chemical,
    contentArea,
}: {
    chemical: Chemical;
    contentArea: { x: number; y: number; width: number; height: number };
}) {
    const solidColor = chemical.solidColor || chemical.color;
    const solidEnd = chemical.solidColorEnd || solidColor;
    const solidType = chemical.solidType || "chunk";

    const cx = contentArea.x + contentArea.width / 2;
    const bottomY = contentArea.y + contentArea.height;
    const baseY = bottomY - 30;

    // Scale factor relative to test-tube standard (width 76)
    const s = contentArea.width / 76;

    return (
        <g>
            {solidType === "crystal" && (
                <g>
                    {Array.from({ length: Math.max(3, Math.round(5 * s)) }).map(
                        (_, i) => (
                            <g
                                key={i}
                                transform={`translate(${contentArea.x + 8 + i * 12 * s + (i % 2) * 6 * s}, ${baseY + (i % 3) * 8 * s})`}
                            >
                                <polygon
                                    points={`0,${-12 * s} ${8 * s},${-4 * s} ${8 * s},${8 * s} 0,${12 * s} ${-8 * s},${8 * s} ${-8 * s},${-4 * s}`}
                                    fill={solidColor}
                                    opacity={0.6 + Math.random() * 0.3}
                                    stroke="rgba(255,255,255,0.15)"
                                    strokeWidth="0.4"
                                />
                                <polygon
                                    points={`0,${-12 * s} 0,${12 * s} ${8 * s},${8 * s} ${8 * s},${-4 * s}`}
                                    fill="rgba(255,255,255,0.06)"
                                />
                            </g>
                        )
                    )}
                    <ellipse
                        cx={cx}
                        cy={bottomY - 6}
                        rx={contentArea.width * 0.4}
                        ry={14 * s}
                        fill={solidColor}
                        opacity={0.4}
                    />
                </g>
            )}
            {solidType === "metal" && (
                <g>
                    {Array.from({ length: Math.max(2, Math.round(4 * s)) }).map(
                        (_, i) => {
                            const wx = 8 * s + Math.random() * 14 * s;
                            const wy = 6 * s + Math.random() * 8 * s;
                            return (
                                <g
                                    key={i}
                                    transform={`translate(${contentArea.x + 12 + i * 10 * s + (i % 2) * 6 * s}, ${baseY + (i % 3) * 6 * s})`}
                                >
                                    <rect
                                        x={-wx / 2}
                                        y={-wy / 2}
                                        width={wx}
                                        height={wy}
                                        rx={2}
                                        fill={solidColor}
                                        opacity={0.7 + Math.random() * 0.25}
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="0.3"
                                    />
                                    <rect
                                        x={-wx / 2 + 1}
                                        y={-wy / 2 + 1}
                                        width={wx * 0.5}
                                        height={2}
                                        rx={1}
                                        fill="rgba(255,255,255,0.12)"
                                    />
                                </g>
                            );
                        }
                    )}
                </g>
            )}
            {solidType === "powder" && (
                <g>
                    <ellipse
                        cx={cx}
                        cy={bottomY - 2}
                        rx={contentArea.width * 0.4}
                        ry={12 * s}
                        fill={solidColor}
                        opacity={0.5}
                    />
                    <ellipse
                        cx={cx - 4}
                        cy={bottomY - 8}
                        rx={contentArea.width * 0.3}
                        ry={10 * s}
                        fill={solidColor}
                        opacity={0.4}
                    />
                    <ellipse
                        cx={cx - 8}
                        cy={bottomY - 14}
                        rx={contentArea.width * 0.2}
                        ry={7 * s}
                        fill={solidColor}
                        opacity={0.35}
                    />
                    {Array.from({ length: Math.round(20 * s) }).map((_, i) => (
                        <circle
                            key={i}
                            cx={contentArea.x + 6 + Math.random() * (contentArea.width - 12)}
                            cy={contentArea.y + 8 + Math.random() * (contentArea.height - 16)}
                            r={1 * s + Math.random() * 1.5 * s}
                            fill="rgba(255,255,255,0.1)"
                            opacity={0.3 + Math.random() * 0.4}
                        />
                    ))}
                </g>
            )}
            {(solidType === "chunk" || !solidType) && (
                <g>
                    {Array.from({ length: Math.max(2, Math.round(3 * s)) }).map(
                        (_, i) => {
                            const ox = contentArea.x + 10 + i * 10 * s + (i % 2) * 5 * s;
                            const oy = baseY + (i % 3) * 5 * s;
                            const sz = 8 * s;
                            return (
                                <path
                                    key={i}
                                    d={`M${ox - sz},${oy + 4 * s} L${ox - sz / 2},${oy - 6 * s} L${ox + sz / 2},${oy - 8 * s} L${ox + 10 * s},${oy - 2 * s} L${ox + sz},${oy + 6 * s} L${ox + sz / 2},${oy + 10 * s} Z`}
                                    fill={solidColor}
                                    opacity={0.7}
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="0.3"
                                />
                            );
                        }
                    )}
                    <ellipse
                        cx={cx}
                        cy={bottomY - 4}
                        rx={contentArea.width * 0.35}
                        ry={10 * s}
                        fill={solidEnd}
                        opacity={0.3}
                    />
                </g>
            )}
        </g>
    );
}

// ─── Glass container by geometry ───
function GlassContainer({
    geometry,
    slotNumber,
    children,
}: {
    geometry: (typeof glasswareGeometries)[GlasswareType];
    slotNumber: number;
    children: React.ReactNode;
}) {
    return (
        <svg
            viewBox={geometry.viewBox}
            className="w-full h-full drop-shadow-md dark:drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        >
            <defs>
                <linearGradient
                    id={`glass-body-${slotNumber}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                >
                    <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                    <stop offset="15%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
                    <stop offset="85%" stopColor="rgba(255,255,255,0.06)" />
                    <stop offset="100%" stopColor="rgba(200,220,255,0.25)" />
                </linearGradient>

                <linearGradient
                    id={`glass-body-dark-${slotNumber}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                >
                    <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                    <stop offset="15%" stopColor="rgba(255,255,255,0.03)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.01)" />
                    <stop offset="85%" stopColor="rgba(255,255,255,0.02)" />
                    <stop offset="100%" stopColor="rgba(150,200,255,0.10)" />
                </linearGradient>

                <clipPath id={`liquid-clip-${slotNumber}`}>
                    {geometry.liquidClipPath ? (
                        <path d={geometry.liquidClipPath} />
                    ) : (
                        <rect
                            x={geometry.contentArea.x}
                            y={geometry.contentArea.y}
                            width={geometry.contentArea.width}
                            height={geometry.contentArea.height}
                            rx="3"
                        />
                    )}
                </clipPath>
            </defs>

            {/* Glass outer body */}
            <path
                d={geometry.outerPath}
                fill="rgba(255,255,255,0.06)"
                stroke="rgba(200,215,240,0.4)"
                strokeWidth="1.2"
                className="dark:stroke-white/20"
            />
            <path
                d={geometry.outerPath}
                fill="rgba(255,255,255,0.02)"
                className="dark:block hidden"
            />

            {/* Inner glass fill */}
            <path
                d={geometry.innerPath}
                fill={`url(#glass-body-${slotNumber})`}
                className="dark:hidden"
            />
            <path
                d={geometry.innerPath}
                fill={`url(#glass-body-dark-${slotNumber})`}
                className="hidden dark:block"
            />

            {/* Rim */}
            <rect
                x={geometry.rimRect.x}
                y={geometry.rimRect.y}
                width={geometry.rimRect.width}
                height={geometry.rimRect.height}
                rx="3"
                fill="rgba(255,255,255,0.08)"
                stroke="rgba(200,215,240,0.35)"
                strokeWidth="1.2"
                className="dark:stroke-white/15 dark:fill-white/5"
            />
            <rect
                x={geometry.rimRect.x + 2}
                y={geometry.rimRect.y + 2}
                width={geometry.rimRect.width - 4}
                height={3}
                rx="1"
                fill="rgba(255,255,255,0.15)"
            />

            {/* Rim lips / spout */}
            {geometry.spoutPath && (
                <path
                    d={geometry.spoutPath}
                    fill="rgba(255,255,255,0.04)"
                    stroke="rgba(200,215,240,0.2)"
                    strokeWidth="0.8"
                    className="dark:stroke-white/10"
                />
            )}
            {geometry.rimLipPath && (
                <path
                    d={geometry.rimLipPath}
                    fill="rgba(255,255,255,0.04)"
                    stroke="rgba(200,215,240,0.2)"
                    strokeWidth="0.8"
                    className="dark:stroke-white/10"
                />
            )}
            {geometry.rimLipPath2 && (
                <path
                    d={geometry.rimLipPath2}
                    fill="rgba(255,255,255,0.04)"
                    stroke="rgba(200,215,240,0.2)"
                    strokeWidth="0.8"
                    className="dark:stroke-white/10"
                />
            )}

            {/* Left side reflection */}
            <path
                d={geometry.leftReflection}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
                opacity="0.4"
            />
            {geometry.leftReflection2 && (
                <path
                    d={geometry.leftReflection2}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    className="dark:stroke-white/5"
                />
            )}

            {/* Right side subtle highlight */}
            {geometry.rightReflection && (
                <path
                    d={geometry.rightReflection}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    className="dark:stroke-white/5"
                />
            )}

            {/* Bottom curve highlight */}
            <path
                d={geometry.bottomCurve}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.8"
            />

            {/* Measurement marks */}
            {geometry.marks.map((mark, i) => (
                <React.Fragment key={i}>
                    <line
                        x1={geometry.contentArea.x + 1}
                        y1={mark.y}
                        x2={geometry.contentArea.x + 10}
                        y2={mark.y}
                        stroke="rgba(200,215,240,0.12)"
                        strokeWidth="0.5"
                        className="dark:stroke-white/10"
                    />
                    {mark.label && (
                        <text
                            x={geometry.contentArea.x + 12}
                            y={mark.y + 3}
                            fill="rgba(200,215,240,0.2)"
                            fontSize="5"
                            fontFamily="Inter, sans-serif"
                            className="dark:fill-white/15"
                        >
                            {mark.label}
                        </text>
                    )}
                </React.Fragment>
            ))}

            {/* Children (liquid, solid, effects) */}
            {children}
        </svg>
    );
}

// ─── Transaction animation overlay ───
function TransactionAnimation({
    transactionType,
    color,
    geometry,
    onEnd,
}: {
    transactionType: TransactionType;
    color: string;
    geometry: (typeof glasswareGeometries)[GlasswareType];
    onEnd?: () => void;
}) {
    const ca = geometry.contentArea;
    const cx = ca.x + ca.width / 2;

    useEffect(() => {
        if (onEnd) {
            const t = setTimeout(onEnd, 800);
            return () => clearTimeout(t);
        }
    }, [onEnd]);

    if (transactionType === "pour") {
        return (
            <g>
                {/* Pour stream */}
                <rect
                    x={cx - 2}
                    y={ca.y - 60}
                    width={4}
                    height={ca.height + 60}
                    fill={color}
                    opacity={0.6}
                >
                    <animate
                        attributeName="y"
                        from={ca.y - 80}
                        to={ca.y - 10}
                        dur="0.6s"
                        fill="freeze"
                    />
                    <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="0.6s"
                        fill="freeze"
                    />
                </rect>
                {/* Splash dots */}
                <circle cx={cx - 6} cy={ca.y + ca.height - 10} r={3} fill={color}>
                    <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="0.5s"
                        fill="freeze"
                    />
                    <animate
                        attributeName="cx"
                        from={cx - 6}
                        to={cx - 20}
                        dur="0.5s"
                        fill="freeze"
                    />
                </circle>
                <circle cx={cx + 6} cy={ca.y + ca.height - 12} r={2} fill={color}>
                    <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="0.5s"
                        fill="freeze"
                    />
                    <animate
                        attributeName="cx"
                        from={cx + 6}
                        to={cx + 18}
                        dur="0.5s"
                        fill="freeze"
                    />
                </circle>
            </g>
        );
    }

    if (transactionType === "drop") {
        return (
            <g>
                {/* Falling solid */}
                <rect
                    x={cx - 5}
                    y={ca.y - 50}
                    width={10}
                    height={10}
                    rx={2}
                    fill={color}
                    opacity={0.9}
                >
                    <animate
                        attributeName="y"
                        from={ca.y - 60}
                        to={ca.y + ca.height - 20}
                        dur="0.5s"
                        fill="freeze"
                    />
                    <animate
                        attributeName="opacity"
                        from="1"
                        to="0.4"
                        dur="0.5s"
                        fill="freeze"
                    />
                </rect>
                {/* Impact ripple */}
                <ellipse
                    cx={cx}
                    cy={ca.y + ca.height - 10}
                    rx={5}
                    ry={3}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.5"
                >
                    <animate
                        attributeName="rx"
                        from="5"
                        to={ca.width * 0.4}
                        dur="0.4s"
                        fill="freeze"
                    />
                    <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="0.4s"
                        fill="freeze"
                    />
                </ellipse>
            </g>
        );
    }

    return null;
}

// ─── Main Beaker Component ───
export default function Beaker({
    chemical,
    reaction,
    isReacting,
    slotNumber,
    onClear,
    isDragOver,
    glassware: glasswareType = "test-tube",
    transactionType = "none",
    transactionColor,
    showTransaction = false,
    onTransactionEnd,
}: BeakerProps) {
    const [pourProgress, setPourProgress] = useState(0);
    const [showContent, setShowContent] = useState(false);
    const [playTransaction, setPlayTransaction] = useState(false);

    const slotColor = slotNumber === 1 ? "#3b82f6" : "#a855f7";
    const geometry = glasswareGeometries[glasswareType];

    // Center X for liquid meniscus, etc.
    const ca = geometry.contentArea;
    const cx = ca.x + ca.width / 2;

    // Determine container dimensions
    const containerStyle = {
        width: geometry.width,
        height: geometry.height,
    };

    useEffect(() => {
        if (chemical) {
            setShowContent(false);
            setPourProgress(0);
            const timer1 = setTimeout(() => setPourProgress(1), 50);
            const timer2 = setTimeout(() => setShowContent(true), 400);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        } else {
            setShowContent(false);
            setPourProgress(0);
        }
    }, [chemical]);

    // Trigger transaction animation
    useEffect(() => {
        if (showTransaction && transactionType !== "none") {
            setPlayTransaction(true);
        } else {
            setPlayTransaction(false);
        }
    }, [showTransaction, transactionType]);

    const isLiquid = chemical ? isLiquidState(chemical.state) : false;

    const liquidColor = useMemo(() => {
        if (!chemical) return "transparent";
        return chemical.liquidColor;
    }, [chemical]);

    const liquidColorEnd = useMemo(() => {
        if (!chemical) return "transparent";
        return chemical.liquidColorEnd || chemical.liquidColor;
    }, [chemical]);

    const reactionColor = useMemo(() => {
        if (!reaction) return null;
        const colorEffect = reaction.effects.find((e) => e.type === "color_change");
        return colorEffect?.targetColor || null;
    }, [reaction]);

    const hasBubbles =
        reaction?.effects.some((e) => e.type === "bubbles") && isReacting;
    const hasPrecipitate =
        reaction?.effects.some((e) => e.type === "precipitate") && isReacting;
    const hasSmoke =
        reaction?.effects.some((e) => e.type === "smoke") && isReacting;
    const hasFlame =
        reaction?.effects.some((e) => e.type === "flame") && isReacting;

    const currentColor = reactionColor || liquidColor;

    const bubbles = useMemo(() => {
        if (!hasBubbles) return [];
        const count =
            reaction?.effects.find((e) => e.type === "bubbles")?.particleCount || 10;
        return Array.from({ length: Math.min(count, 16) }).map((_, i) => ({
            size: 3 + Math.random() * 7,
            x: geometry.contentArea.x + 6 + Math.random() * (geometry.contentArea.width - 12),
            delay: Math.random() * 2,
            duration: 1.5 + Math.random() * 2.0,
        }));
    }, [hasBubbles, reaction, geometry]);

    const precipitates = useMemo(() => {
        if (!hasPrecipitate) return [];
        return Array.from({ length: 16 }).map((_, i) => ({
            size: 2 + Math.random() * 4,
            x: geometry.contentArea.x + 5 + Math.random() * (geometry.contentArea.width - 10),
            delay: Math.random() * 2,
            duration: 2 + Math.random() * 2.5,
            opacity: 0.4 + Math.random() * 0.5,
        }));
    }, [hasPrecipitate, geometry]);

    const liquidHeight = ca.height * 0.35 + pourProgress * (ca.height * 0.45);
    const liquidY = ca.y + ca.height - liquidHeight;

    const transColor = transactionColor || chemical?.liquidColor || "#3b82f6";

    return (
        <div className="relative flex flex-col items-center group select-none">
            {/* Slot label */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                    style={{
                        color: slotColor,
                        backgroundColor: `${slotColor}15`,
                        border: `1px solid ${slotColor}40`,
                    }}
                >
                    {glasswareNames[glasswareType]} {slotNumber}
                </span>
            </div>

            {/* Glass container */}
            <div className="relative" style={containerStyle}>
                <GlassContainer geometry={geometry} slotNumber={slotNumber}>
                    {/* Content inside */}
                    {chemical && (
                        <>
                            {isLiquid ? (
                                /* ─── LIQUID / AQUEOUS ─── */
                                <g clipPath={`url(#liquid-clip-${slotNumber})`}>
                                    {/* Main liquid */}
                                    <rect
                                        x={ca.x}
                                        y={liquidY}
                                        width={ca.width}
                                        height={liquidHeight}
                                        fill={`url(#liquid-grad-${slotNumber})`}
                                        opacity={0.85}
                                    >
                                        {!showContent && (
                                            <animate
                                                attributeName="y"
                                                from={ca.y + ca.height}
                                                to={liquidY}
                                                dur="0.5s"
                                                fill="freeze"
                                            />
                                        )}
                                    </rect>

                                    {/* Liquid top surface */}
                                    <rect
                                        x={ca.x}
                                        y={liquidY}
                                        width={ca.width}
                                        height="12"
                                        fill={`url(#liquid-top-${slotNumber})`}
                                        opacity={0.5}
                                    >
                                        {!showContent && (
                                            <animate
                                                attributeName="y"
                                                from={ca.y + ca.height}
                                                to={liquidY}
                                                dur="0.5s"
                                                fill="freeze"
                                            />
                                        )}
                                    </rect>

                                    {/* Liquid meniscus */}
                                    <path
                                        d={`M${ca.x} ${liquidY + 5} Q${cx} ${liquidY - 2} ${ca.x + ca.width} ${liquidY + 5}`}
                                        fill="none"
                                        stroke="rgba(255,255,255,0.15)"
                                        strokeWidth="0.8"
                                    />

                                    {/* Bottom depth */}
                                    <rect
                                        x={ca.x}
                                        y={ca.y + ca.height - 20}
                                        width={ca.width}
                                        height={20}
                                        fill="rgba(0,0,0,0.12)"
                                        rx="3"
                                    />
                                    <rect
                                        x={ca.x}
                                        y={ca.y + ca.height - 10}
                                        width={ca.width}
                                        height={10}
                                        fill="rgba(0,0,0,0.08)"
                                        rx="3"
                                    />

                                    {/* Surface light reflection */}
                                    <ellipse
                                        cx={ca.x + ca.width * 0.35}
                                        cy={liquidY + 6}
                                        rx={ca.width * 0.25}
                                        ry={3}
                                        fill="rgba(255,255,255,0.1)"
                                    />

                                    {/* Wave anim when reacting */}
                                    {isReacting && (
                                        <ellipse
                                            cx={ca.x + ca.width / 2}
                                            cy={liquidY + 8}
                                            rx={ca.width * 0.5}
                                            ry={6}
                                            fill={currentColor}
                                            opacity={0.35}
                                            className="animate-liquid-slosh"
                                            style={{ transformOrigin: `${ca.x + ca.width / 2}px center` }}
                                        />
                                    )}

                                    {/* Liquid gradients (defined here as they depend on currentColor) */}
                                    <defs>
                                        <linearGradient
                                            id={`liquid-grad-${slotNumber}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor={currentColor} />
                                            <stop offset="100%" stopColor={liquidColorEnd} />
                                        </linearGradient>
                                        <linearGradient
                                            id={`liquid-top-${slotNumber}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                        </linearGradient>
                                    </defs>
                                </g>
                            ) : (
                                /* ─── SOLID ─── */
                                <g clipPath={`url(#liquid-clip-${slotNumber})`}>
                                    {!showContent ? (
                                        <g opacity={0}>
                                            <animate
                                                attributeName="opacity"
                                                from="0"
                                                to="1"
                                                dur="0.5s"
                                                fill="freeze"
                                            />
                                            <SolidContent chemical={chemical} contentArea={ca} />
                                        </g>
                                    ) : (
                                        <SolidContent chemical={chemical} contentArea={ca} />
                                    )}
                                </g>
                            )}
                        </>
                    )}

                    {/* Bubbles (on top of content) */}
                    {bubbles.map((b, i) => (
                        <circle
                            key={i}
                            cx={b.x}
                            cy={ca.y + ca.height - 5}
                            r={b.size / 2}
                            fill="rgba(255,255,255,0.25)"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="0.3"
                            className="animate-bubble-rise"
                            style={{
                                animationDelay: `${b.delay}s`,
                                animationDuration: `${b.duration}s`,
                            }}
                        />
                    ))}

                    {/* Precipitate */}
                    {precipitates.map((p, i) => (
                        <rect
                            key={i}
                            x={p.x}
                            y={liquidY - 5}
                            width={p.size}
                            height={p.size * 0.6}
                            rx={p.size * 0.3}
                            fill={
                                reaction?.effects.find((e) => e.type === "precipitate")
                                    ?.targetColor || "#ffffff"
                            }
                            opacity={p.opacity}
                            style={{
                                animation: `precipitate-fall ${p.duration}s ease-in infinite`,
                                animationDelay: `${p.delay}s`,
                            }}
                        />
                    ))}

                    {/* Smoke */}
                    {hasSmoke &&
                        Array.from({ length: 6 }).map((_, i) => (
                            <circle
                                key={`smoke-${i}`}
                                cx={ca.x + 6 + Math.random() * (ca.width - 12)}
                                cy={ca.y - 5}
                                r={8 + Math.random() * 14}
                                fill="rgba(200,210,235,0.08)"
                                className="animate-smoke-rise"
                                style={{
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`,
                                }}
                            />
                        ))}

                    {/* Flame */}
                    {hasFlame && (
                        <g transform={`translate(${geometry.flame.x}, ${geometry.flame.y})`}>
                            <defs>
                                <radialGradient
                                    id={`flame-grad-${slotNumber}`}
                                    cx="50%"
                                    cy="30%"
                                    r="60%"
                                >
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="20%" stopColor="#fef08a" />
                                    <stop offset="50%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#ef4444" />
                                </radialGradient>
                            </defs>
                            <ellipse
                                cx={0}
                                cy={-4}
                                rx={10}
                                ry={8}
                                fill="rgba(255, 100, 0, 0.12)"
                                className="animate-flame-flicker"
                            />
                            {Array.from({ length: 5 }).map((_, i) => (
                                <ellipse
                                    key={`flame-${i}`}
                                    cx={-6 + Math.random() * 12}
                                    cy={-6 - Math.random() * 12}
                                    rx={3 + Math.random() * 6}
                                    ry={6 + Math.random() * 14}
                                    fill={`url(#flame-grad-${slotNumber})`}
                                    opacity={0.5 + Math.random() * 0.4}
                                    className="animate-flame-flicker"
                                    style={{ animationDelay: `${Math.random() * 0.3}s` }}
                                />
                            ))}
                            <ellipse
                                cx={0}
                                cy={-12}
                                rx={3}
                                ry={8}
                                fill="#fef08a"
                                opacity={0.7}
                                className="animate-flame-flicker"
                            />
                        </g>
                    )}

                    {/* Dragover highlight */}
                    {!chemical && isDragOver && (
                        <rect
                            x={ca.x + 3}
                            y={ca.y + 3}
                            width={ca.width - 6}
                            height={ca.height - 6}
                            rx="4"
                            fill={`${slotColor}15`}
                            className="animate-pulse"
                        />
                    )}

                    {/* Transaction animation overlay */}
                    {playTransaction && (
                        <TransactionAnimation
                            transactionType={transactionType}
                            color={transColor}
                            geometry={geometry}
                            onEnd={() => {
                                setPlayTransaction(false);
                                onTransactionEnd?.();
                            }}
                        />
                    )}
                </GlassContainer>

                {/* Clear button */}
                {chemical && (
                    <button
                        onClick={onClear}
                        className="absolute -top-1 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-110 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:text-red-400 dark:hover:border-red-400/50"
                        style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #d1d5db",
                            color: "#9ca3af",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#ef4444";
                            e.currentTarget.style.borderColor = "#fca5a5";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#9ca3af";
                            e.currentTarget.style.borderColor = "#d1d5db";
                        }}
                        title="Xóa"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Chemical name & formula */}
            {chemical && (
                <div className="text-center mt-2.5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {chemical.name}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {chemical.formula}
                        {chemical.molarMass && (
                            <span className="ml-1.5 text-gray-400 dark:text-gray-500">
                                M = {chemical.molarMass} g/mol
                            </span>
                        )}
                    </p>
                </div>
            )}

            {/* Empty state */}
            {!chemical && (
                <div
                    className="text-center mt-2.5 transition-all duration-150"
                    style={{
                        color: isDragOver ? slotColor : "#9ca3af",
                        opacity: isDragOver ? 1 : 0.5,
                    }}
                >
                    <svg
                        className="w-5 h-5 mx-auto mb-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                    <p className="text-[11px] dark:text-gray-500">Kéo thả hóa chất</p>
                </div>
            )}
        </div>
    );
}

