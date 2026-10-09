"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { ReactionResult, REACTION_TYPE_LABELS } from "@/lib/reactions";
import { Chemical } from "@/lib/chemicals";

interface ReactionEffectsProps {
    reaction: ReactionResult;
    slot1: Chemical | null;
    slot2: Chemical | null;
}

// ─── Particle types ───
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    life: number;
    maxLife: number;
    alpha: number;
    color: string;
    type: "bubble" | "smoke" | "spark" | "flame" | "precipitate" | "sparkle" | "ember";
    rotation?: number;
    rotationSpeed?: number;
    grow?: number; // rate of growth for smoke
    pulsePhase?: number;
}

interface ColorStop {
    pos: number;
    color: string;
}

// ─── Utility ───
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function randomRange(min: number, max: number) { return min + Math.random() * (max - min); }

function hexToRgba(hex: string, alpha: number): string {
    // Handle already rgba colors
    if (hex.startsWith("rgba")) return hex.replace(/[\d.]+\)$/, `${alpha})`);
    if (hex.startsWith("rgb")) return hex.replace("rgb", "rgba").replace(")", `, ${alpha})`);
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// Glow canvas helper — draws a glowing circle
function drawGlowCircle(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, radius: number,
    color: string, alpha: number, glowAmount = 1
) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * (2 + glowAmount));
    grad.addColorStop(0, color);
    grad.addColorStop(0.4, hexToRgba(color, 0.3));
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius * (2 + glowAmount), 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export default function ReactionEffects({
    reaction,
    slot1,
    slot2,
}: ReactionEffectsProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(Date.now());
    const colorWashRef = useRef<{ color: string; alpha: number; maxAlpha: number } | null>(null);
    const flashRef = useRef<{ alpha: number } | null>(null);
    const shakeRef = useRef<{ intensity: number; decay: number } | null>(null);

    const getCanvasCenter = useCallback(() => {
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }, []);

    // ─── Particle spawners ───
    const spawnBubble = useCallback((centerX: number, centerY: number, color: string) => {
        return {
            x: centerX + randomRange(-40, 40),
            y: centerY + randomRange(20, 60),
            vx: randomRange(-0.15, 0.15),
            vy: randomRange(-1.2, -0.6),
            radius: randomRange(3, 10),
            life: 0,
            maxLife: randomRange(80, 160),
            alpha: randomRange(0.4, 0.8),
            color: "rgba(255,255,255,0.9)",
            type: "bubble" as const,
            pulsePhase: Math.random() * Math.PI * 2,
        };
    }, []);

    const spawnSmoke = useCallback((centerX: number, centerY: number) => {
        const gray = 120 + Math.floor(Math.random() * 80);
        return {
            x: centerX + randomRange(-30, 30),
            y: centerY + randomRange(-10, 10),
            vx: randomRange(-0.2, 0.2),
            vy: randomRange(-0.5, -0.3),
            radius: randomRange(6, 16),
            life: 0,
            maxLife: randomRange(100, 200),
            alpha: randomRange(0.15, 0.35),
            color: `rgba(${gray},${gray + 20},${gray + 30},0.5)`,
            type: "smoke" as const,
            grow: randomRange(0.01, 0.03),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: randomRange(-0.01, 0.01),
        };
    }, []);

    const spawnSpark = useCallback((centerX: number, centerY: number) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomRange(2, 6);
        const colors = ["#ff4444", "#ff8800", "#ffcc00", "#ffffff", "#ff6600"];
        return {
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            radius: randomRange(1.5, 4),
            life: 0,
            maxLife: randomRange(20, 50),
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: "spark" as const,
        };
    }, []);

    const spawnFlame = useCallback((centerX: number, centerY: number) => {
        const colors = ["#ffffff", "#fef08a", "#f97316", "#ef4444", "#ff6600"];
        return {
            x: centerX + randomRange(-12, 12),
            y: centerY + randomRange(-5, 10),
            vx: randomRange(-0.3, 0.3),
            vy: randomRange(-2.5, -1.2),
            radius: randomRange(4, 12),
            life: 0,
            maxLife: randomRange(15, 35),
            alpha: randomRange(0.7, 1),
            color: colors[Math.floor(Math.random() * colors.length)],
            type: "flame" as const,
            pulsePhase: Math.random() * Math.PI * 2,
        };
    }, []);

    const spawnEmber = useCallback((centerX: number, centerY: number) => {
        return {
            x: centerX + randomRange(-8, 8),
            y: centerY + randomRange(-5, 5),
            vx: randomRange(-0.5, 0.5),
            vy: randomRange(-3, -1),
            radius: randomRange(1, 3),
            life: 0,
            maxLife: randomRange(20, 40),
            alpha: 1,
            color: "#ffaa00",
            type: "ember" as const,
        };
    }, []);

    const spawnSparkle = useCallback((centerX: number, centerY: number) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = randomRange(10, 60);
        const colors = ["#ffdd00", "#ffffff", "#aaddff", "#ffaaff", "#88ff88"];
        return {
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            vx: randomRange(-0.2, 0.2),
            vy: randomRange(-0.3, -0.1),
            radius: randomRange(1, 3),
            life: 0,
            maxLife: randomRange(30, 70),
            alpha: randomRange(0.5, 1),
            color: colors[Math.floor(Math.random() * colors.length)],
            type: "sparkle" as const,
            pulsePhase: Math.random() * Math.PI * 2,
        };
    }, []);

    const spawnPrecipitate = useCallback((centerX: number, centerY: number, color: string) => {
        return {
            x: centerX + randomRange(-35, 35),
            y: centerY + randomRange(-20, 10),
            vx: randomRange(-0.1, 0.1),
            vy: randomRange(0.3, 0.8),
            radius: randomRange(1.5, 4),
            life: 0,
            maxLife: randomRange(100, 200),
            alpha: randomRange(0.5, 0.9),
            color: color,
            type: "precipitate" as const,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: randomRange(-0.02, 0.02),
        };
    }, []);

    // ─── Initialize particles based on reaction ───
    const initParticles = useCallback(() => {
        const center = getCanvasCenter();
        const centerX = center.x;
        const centerY = center.y - 40; // Above center for beaker area
        const particles: Particle[] = [];

        let targetColor = "#ffffff";
        const colorEffect = reaction.effects.find(e => e.type === "color_change");
        if (colorEffect?.targetColor) targetColor = colorEffect.targetColor;

        // Set color wash
        if (reaction.effects.some(e => e.type === "color_change")) {
            colorWashRef.current = {
                color: targetColor,
                alpha: 0,
                maxAlpha: 0.08,
            };
        }

        // Set flash
        if (reaction.effects.some(e => e.type === "flash")) {
            flashRef.current = { alpha: 0.7 };
        }

        // Set shake — infer intensity from effects
        const hasHighIntensity = reaction.effects.some(e => e.intensity === "high");
        const hasMediumIntensity = reaction.effects.some(e => e.intensity === "medium");
        if (hasHighIntensity || reaction.type === "combustion") {
            shakeRef.current = { intensity: 2, decay: 0.97 };
        } else if (hasMediumIntensity) {
            shakeRef.current = { intensity: 1, decay: 0.96 };
        }

        // Each effect type spawns its own particle system
        for (const effect of reaction.effects) {
            const count = effect.particleCount || 15;
            const n = Math.min(count, 60);

            switch (effect.type) {
                case "bubbles":
                    for (let i = 0; i < n; i++) {
                        const p = spawnBubble(centerX, centerY, effect.targetColor || "#ffffff");
                        p.life = -randomRange(0, 40); // stagger start
                        particles.push(p);
                    }
                    // Continuous spawning flag stored in a closure
                    break;

                case "smoke":
                    for (let i = 0; i < n; i++) {
                        const p = spawnSmoke(centerX, centerY);
                        p.life = -randomRange(0, 30);
                        particles.push(p);
                    }
                    break;

                case "flame":
                    for (let i = 0; i < n * 2; i++) {
                        const p = spawnFlame(centerX, centerY - 10);
                        p.life = -randomRange(0, 20);
                        particles.push(p);
                    }
                    // Embers
                    for (let i = 0; i < n / 2; i++) {
                        particles.push(spawnEmber(centerX, centerY - 10));
                    }
                    break;

                case "sparkle":
                    for (let i = 0; i < n; i++) {
                        const p = spawnSparkle(centerX, centerY);
                        p.life = -randomRange(0, 20);
                        particles.push(p);
                    }
                    break;

                case "precipitate":
                    for (let i = 0; i < n * 2; i++) {
                        const p = spawnPrecipitate(centerX, centerY, effect.targetColor || "#ffffff");
                        p.life = -randomRange(0, 30);
                        particles.push(p);
                    }
                    break;

                case "flash":
                    // Also add some sparks
                    for (let i = 0; i < 20; i++) {
                        particles.push(spawnSpark(centerX, centerY - 10));
                    }
                    break;
            }
        }

        // If no specific effects, add some generic bubbles
        if (particles.length === 0) {
            for (let i = 0; i < 15; i++) {
                particles.push(spawnBubble(centerX, centerY, "#ffffff"));
            }
        }

        particlesRef.current = particles;
    }, [reaction, getCanvasCenter, spawnBubble, spawnSmoke, spawnSpark, spawnFlame, spawnEmber, spawnSparkle, spawnPrecipitate]);

    // ─── Animation loop ───
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const center = getCanvasCenter();
        const centerX = center.x;
        const centerY = center.y - 40;

        ctx.clearRect(0, 0, width, height);

        const particles = particlesRef.current;
        const now = Date.now();
        const elapsed = now - startTimeRef.current;
        const isPastPeak = elapsed > 2000;

        // ─── Screen shake ───
        if (shakeRef.current) {
            const shake = shakeRef.current;
            const shakeX = (Math.random() - 0.5) * shake.intensity;
            const shakeY = (Math.random() - 0.5) * shake.intensity;
            ctx.translate(shakeX, shakeY);
            shake.intensity *= shake.decay;
            if (shake.intensity < 0.1) shakeRef.current = null;
        }

        // ─── Color wash overlay ───
        if (colorWashRef.current) {
            const w = colorWashRef.current;
            if (isPastPeak && w.alpha > 0) {
                w.alpha -= 0.0004;
                if (w.alpha < 0) w.alpha = 0;
            } else if (!isPastPeak && w.alpha < w.maxAlpha) {
                w.alpha += 0.0008;
            }
            if (w.alpha > 0) {
                ctx.fillStyle = hexToRgba(w.color, w.alpha);
                ctx.fillRect(0, 0, width, height);
            }
        }

        // ─── Flash ───
        if (flashRef.current) {
            const f = flashRef.current;
            ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
            ctx.fillRect(0, 0, width, height);
            f.alpha *= 0.92;
            if (f.alpha < 0.01) flashRef.current = null;
        }

        // ─── Continuous spawning ───
        const needsBubbles = reaction.effects.some(e => e.type === "bubbles");
        const needsSmoke = reaction.effects.some(e => e.type === "smoke");
        const needsFlame = reaction.effects.some(e => e.type === "flame");
        const needsPrecipitate = reaction.effects.some(e => e.type === "precipitate");
        const needsSparkle = reaction.effects.some(e => e.type === "sparkle");

        // Spawn rate decreases over time
        const spawnRate = Math.max(0, 1 - elapsed / 6000);

        if (spawnRate > 0.05) {
            if (needsBubbles && Math.random() < 0.15 * spawnRate) {
                particles.push(spawnBubble(centerX, centerY, "#ffffff"));
            }
            if (needsSmoke && Math.random() < 0.1 * spawnRate) {
                particles.push(spawnSmoke(centerX, centerY));
            }
            if (needsFlame && Math.random() < 0.3 * spawnRate) {
                particles.push(spawnFlame(centerX, centerY - 10));
                if (Math.random() < 0.1) particles.push(spawnEmber(centerX, centerY - 10));
            }
            if (needsPrecipitate && Math.random() < 0.15 * spawnRate) {
                const precipColor = reaction.effects.find(e => e.type === "precipitate")?.targetColor || "#ffffff";
                particles.push(spawnPrecipitate(centerX, centerY, precipColor));
            }
            if (needsSparkle && Math.random() < 0.08 * spawnRate) {
                particles.push(spawnSparkle(centerX, centerY));
            }
        }

        // ─── Update & draw particles ───
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life++;

            // Kill if expired
            if (p.life > p.maxLife) {
                particles.splice(i, 1);
                continue;
            }

            // Life progress (0→1)
            const lifeRatio = p.life / p.maxLife;
            const fadeIn = Math.min(1, p.life / 10);

            switch (p.type) {
                case "bubble": {
                    p.vy += -0.005; // buoyancy
                    p.x += p.vx + Math.sin(p.life * 0.05 + (p.pulsePhase || 0)) * 0.2;
                    p.y += p.vy;
                    p.alpha = Math.max(0, (1 - lifeRatio) * 0.7 * fadeIn);
                    const r = p.radius * (1 + Math.sin(p.life * 0.08 + (p.pulsePhase || 0)) * 0.1);
                    drawGlowCircle(ctx, p.x, p.y, r, p.color, p.alpha, 1.5);
                    // Bubble highlight
                    ctx.save();
                    ctx.globalAlpha = p.alpha * 0.5;
                    ctx.fillStyle = "rgba(255,255,255,0.6)";
                    ctx.beginPath();
                    ctx.ellipse(p.x - r * 0.25, p.y - r * 0.25, r * 0.25, r * 0.2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;
                }

                case "smoke": {
                    p.vy += -0.003; // very slight rise
                    p.vx += Math.sin(p.life * 0.02) * 0.002;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.radius += p.grow || 0.02;
                    p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);

                    const smokeAlpha = Math.sin(lifeRatio * Math.PI) * 0.25 * fadeIn;
                    if (smokeAlpha > 0.005) {
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rotation || 0);
                        ctx.globalAlpha = smokeAlpha;
                        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
                        const baseColor = p.color.replace(/[\d.]+\)$/, "");
                        grad.addColorStop(0, `${baseColor}0.3)`);
                        grad.addColorStop(0.5, `${baseColor}0.15)`);
                        grad.addColorStop(1, "transparent");
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                    break;
                }

                case "flame": {
                    p.vy += -0.02; // strong upward
                    p.vx += (Math.random() - 0.5) * 0.15;
                    p.x += p.vx;
                    p.y += p.vy;
                    const flameAlpha = Math.sin(lifeRatio * Math.PI) * 0.9 * fadeIn;
                    const flameRadius = p.radius * (0.8 + Math.sin(p.life * 0.2 + (p.pulsePhase || 0)) * 0.2);
                    if (flameAlpha > 0.01) {
                        drawGlowCircle(ctx, p.x, p.y, flameRadius, p.color, flameAlpha, 2.5);
                    }
                    break;
                }

                case "ember": {
                    p.vy += -0.01;
                    p.vx += (Math.random() - 0.5) * 0.05;
                    p.x += p.vx;
                    p.y += p.vy;
                    const emberAlpha = Math.sin(lifeRatio * Math.PI) * 0.9 * fadeIn;
                    if (emberAlpha > 0.01) {
                        drawGlowCircle(ctx, p.x, p.y, p.radius, "#ffaa00", emberAlpha, 3);
                        drawGlowCircle(ctx, p.x, p.y, p.radius * 0.5, "#ffffff", emberAlpha * 0.5, 0);
                    }
                    break;
                }

                case "spark": {
                    p.vy += 0.05; // gravity
                    p.x += p.vx;
                    p.y += p.vy;
                    const sparkAlpha = Math.max(0, (1 - lifeRatio) * fadeIn);
                    const trailLength = 3 + Math.random() * 4;
                    ctx.save();
                    ctx.globalAlpha = sparkAlpha * 0.3;
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = p.radius * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - p.vx * trailLength, p.y - p.vy * trailLength);
                    ctx.stroke();
                    ctx.restore();
                    drawGlowCircle(ctx, p.x, p.y, p.radius, p.color, sparkAlpha, 2);
                    break;
                }

                case "sparkle": {
                    p.y += p.vy;
                    p.x += p.vx;
                    const sparkleAlpha = Math.sin(lifeRatio * Math.PI) * 0.8 * fadeIn;
                    const pulse = 0.5 + 0.5 * Math.sin(p.life * 0.15 + (p.pulsePhase || 0));
                    if (sparkleAlpha > 0.01) {
                        drawGlowCircle(ctx, p.x, p.y, p.radius * (0.5 + pulse * 0.5), p.color, sparkleAlpha, 3);
                        // Star shape hint
                        ctx.save();
                        ctx.globalAlpha = sparkleAlpha * 0.3;
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        for (let j = 0; j < 4; j++) {
                            const a = (j / 4) * Math.PI * 2 + p.life * 0.02;
                            const d = p.radius * pulse * 2;
                            ctx.lineTo(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
                        }
                        ctx.closePath();
                        ctx.stroke();
                        ctx.restore();
                    }
                    break;
                }

                case "precipitate": {
                    p.vy += 0.005; // gravity
                    p.x += p.vx + Math.sin(p.life * 0.03) * 0.1;
                    p.y += p.vy;
                    p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
                    const precipAlpha = Math.min(1, lifeRatio * 2) * (1 - lifeRatio * 0.7) * 0.8 * fadeIn;
                    if (precipAlpha > 0.01) {
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rotation || 0);
                        ctx.globalAlpha = precipAlpha;
                        ctx.fillStyle = p.color;
                        // Irregular shape
                        const w = p.radius * 1.5;
                        const h = p.radius;
                        ctx.beginPath();
                        ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
                        ctx.fill();
                        // Subtle shadow
                        ctx.fillStyle = "rgba(0,0,0,0.15)";
                        ctx.beginPath();
                        ctx.ellipse(w * 0.15, h * 0.1, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                    break;
                }
            }
        }

        animFrameRef.current = requestAnimationFrame(animate);
    }, [reaction, getCanvasCenter, spawnBubble, spawnSmoke, spawnFlame, spawnEmber, spawnSparkle, spawnPrecipitate]);

    // ─── Setup ───
    useEffect(() => {
        startTimeRef.current = Date.now();
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        initParticles();
        animFrameRef.current = requestAnimationFrame(animate);

        // Auto-stop after max duration
        const maxDuration = Math.max(...reaction.effects.map(e => e.duration));
        const timer = setTimeout(() => {
            cancelAnimationFrame(animFrameRef.current);
        }, Math.min(maxDuration, 6000));

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            clearTimeout(timer);
            window.removeEventListener("resize", handleResize);
            particlesRef.current = [];
        };
    }, [reaction, initParticles, animate]);

    return (
        <>
            {/* Canvas overlay */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-40"
                aria-hidden="true"
            />

            {/* Reaction label */}
            <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-24" aria-hidden="true">
                <div className="animate-scale-in bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-3 text-center shadow-sm max-w-xs transition-colors duration-200">
                    <svg className="w-8 h-8 mx-auto mb-1 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 18h13.5A2.25 2.25 0 0 0 21 15.75V8.25A2.25 2.25 0 0 0 18.75 6H5.25A2.25 2.25 0 0 0 3 8.25v7.5A2.25 2.25 0 0 0 5.25 18Z" />
                    </svg>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {REACTION_TYPE_LABELS[reaction.type] || "Phản ứng"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reaction.description}</p>

                    {/* Temperature indicator */}
                    {(reaction.heatChange === "exothermic" || reaction.heatChange === "endothermic") && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {reaction.heatChange === "exothermic" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 animate-pulse">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
                                    </svg>
                                    Tỏa nhiệt
                                </span>
                            )}
                            {reaction.heatChange === "endothermic" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-700 animate-pulse">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                    Thu nhiệt
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
