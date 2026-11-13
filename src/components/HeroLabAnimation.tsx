"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
    FlaskConical,
    Atom,
    Dna,
    Smartphone,
    Sparkles,
    Bot,
    ArrowRight,
    RotateCcw,
    Zap,
} from "lucide-react";

type LabMode = "chemistry" | "physics" | "biology";

export default function HeroLabAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<LabMode>("chemistry");
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [reactionProgress, setReactionProgress] = useState(0.45);
    const [isPouringManual, setIsPouringManual] = useState(false);

    // Animation state tracking in refs for smooth 60fps rendering without React re-render lag
    const animStateRef = useRef({
        time: 0,
        tiltAngle: 0.35, // radians
        streamActive: true,
        streamIntensity: 0.8,
        beakerFill: 0.42,
        particles: [] as Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            alpha: number;
            color: string;
            life: number;
            maxLife: number;
        }>,
        bubbles: [] as Array<{
            x: number;
            y: number;
            vy: number;
            size: number;
            wobble: number;
        }>,
        opticsRays: [] as Array<{
            pulse: number;
            offset: number;
        }>,
        bioCells: [] as Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
        }>,
    });

    // Initialize particles
    useEffect(() => {
        const state = animStateRef.current;
        // Seed initial bubbles
        state.bubbles = Array.from({ length: 24 }, () => ({
            x: Math.random() * 90 - 45,
            y: Math.random() * 80,
            vy: 0.4 + Math.random() * 0.8,
            size: 1.5 + Math.random() * 2.5,
            wobble: Math.random() * Math.PI * 2,
        }));

        // Seed bio particles
        state.bioCells = Array.from({ length: 30 }, () => ({
            x: Math.random() * 260 - 130,
            y: Math.random() * 200 - 100,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: 2 + Math.random() * 4,
            color: Math.random() > 0.4 ? "#22c55e" : "#06b6d4",
        }));
    }, []);

    // Main 60fps Canvas render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let lastTimestamp = performance.now();

        const render = (now: number) => {
            const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
            lastTimestamp = now;
            const state = animStateRef.current;
            state.time += dt;

            // Handle retina scaling
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
            }

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, width, height);

            // ─── BACKGROUND: Realistic Lab Bench Gradients & Ambient Glow ───
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, "#090d16");
            bgGrad.addColorStop(0.6, "#0f172a");
            bgGrad.addColorStop(1, "#020617");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Subtle depth grid lines
            ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
            ctx.lineWidth = 1;
            const benchY = height * 0.72;

            // Perspective lines
            for (let i = -width; i <= width * 2; i += 60) {
                ctx.beginPath();
                ctx.moveTo(width / 2 + (i - width / 2) * 0.3, height * 0.45);
                ctx.lineTo(i, height);
                ctx.stroke();
            }

            // Ceramic lab tabletop
            const tableGrad = ctx.createLinearGradient(0, benchY, 0, height);
            tableGrad.addColorStop(0, "rgba(30, 41, 59, 0.95)");
            tableGrad.addColorStop(0.08, "rgba(15, 23, 42, 0.98)");
            tableGrad.addColorStop(1, "rgba(2, 6, 23, 1)");
            ctx.fillStyle = tableGrad;
            ctx.fillRect(0, benchY, width, height - benchY);

            // Shiny edge highlight on bench
            ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, benchY);
            ctx.lineTo(width, benchY);
            ctx.stroke();

            // ─── RENDER SPECIFIC SUBJECT MODE ───
            if (mode === "chemistry") {
                renderChemistryLab(ctx, width, height, benchY, dt, state, mousePos, isHovered);
            } else if (mode === "physics") {
                renderPhysicsLab(ctx, width, height, benchY, dt, state, mousePos);
            } else {
                renderBiologyLab(ctx, width, height, benchY, dt, state, mousePos);
            }

            ctx.restore();
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, [mode, mousePos, isHovered]);

    // ─── 1. CHEMISTRY LAB SIMULATION RENDERER ───
    const renderChemistryLab = (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        benchY: number,
        dt: number,
        state: any,
        mouse: { x: number; y: number },
        hovered: boolean
    ) => {
        const time = state.time;

        // Dynamics: Tilt angle follows smooth oscillation or mouse hover
        let targetTilt = 0.38 + Math.sin(time * 1.8) * 0.18;
        if (hovered) {
            targetTilt = 0.2 + mouse.x * 0.45;
        }
        state.tiltAngle += (targetTilt - state.tiltAngle) * 0.12;

        const isPouring = state.tiltAngle > 0.28;
        state.streamActive = isPouring;

        // Positions on bench
        const beakerX = w * 0.65;
        const beakerY = benchY - 10;
        const beakerW = Math.min(110, w * 0.24);
        const beakerH = beakerW * 1.35;

        // Bottle position (tilting around grip point)
        const flaskBaseX = w * 0.32;
        const flaskBaseY = benchY - 60;

        // 1.1 Render Beaker (Cốc hứng chất lỏng bên phải)
        ctx.save();
        ctx.translate(beakerX, beakerY);

        // Drop shadow on ceramic tabletop
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(0, 6, beakerW * 0.55, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Liquid inside beaker (Rising level with reactive color)
        const fillPercent = Math.min(0.75, 0.38 + Math.sin(time * 0.6) * 0.08);
        const liquidH = beakerH * fillPercent;
        const liquidTopY = -liquidH;

        // Base reaction liquid: Blue copper hydroxide precipitate cloud
        const liquidGrad = ctx.createLinearGradient(0, -liquidH, 0, 0);
        liquidGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)"); // Azure top
        liquidGrad.addColorStop(0.4, "rgba(2, 132, 199, 0.9)"); // Royal blue
        liquidGrad.addColorStop(0.85, "rgba(3, 105, 161, 0.95)"); // Deep blue
        liquidGrad.addColorStop(1, "rgba(30, 58, 138, 0.98)"); // Precipitate bottom

        ctx.fillStyle = liquidGrad;
        ctx.beginPath();
        ctx.roundRect(-beakerW / 2 + 3, -liquidH, beakerW - 6, liquidH, [0, 0, 10, 10]);
        ctx.fill();

        // Meniscus surface curve
        ctx.fillStyle = "rgba(224, 242, 254, 0.6)";
        ctx.beginPath();
        ctx.ellipse(0, -liquidH, (beakerW - 6) / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Precipitate flecks floating inside liquid (Cu(OH)2 flakes)
        ctx.fillStyle = "rgba(186, 230, 253, 0.75)";
        for (let i = 0; i < 18; i++) {
            const flakeX = Math.sin(time * 1.5 + i * 1.2) * (beakerW * 0.36);
            const flakeY = -liquidH * (0.2 + (i % 8) * 0.1) + Math.sin(time * 2 + i) * 3;
            ctx.beginPath();
            ctx.arc(flakeX, flakeY, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rising micro-bubbles
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        state.bubbles.forEach((b: any) => {
            b.y += b.vy;
            b.wobble += dt * 3;
            if (b.y > liquidH - 8) {
                b.y = 2;
                b.x = (Math.random() - 0.5) * (beakerW - 20);
            }
            const curBubbleY = -b.y;
            const curBubbleX = b.x + Math.sin(b.wobble) * 2;
            ctx.beginPath();
            ctx.arc(curBubbleX, curBubbleY, b.size, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Beaker Glass Body (Cylindrical border & glass highlights)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Left rim, left wall, rounded bottom, right wall, right rim
        ctx.moveTo(-beakerW / 2 - 4, -beakerH);
        ctx.lineTo(-beakerW / 2, -beakerH);
        ctx.lineTo(-beakerW / 2, -6);
        ctx.quadraticCurveTo(-beakerW / 2, 0, -beakerW / 2 + 10, 0);
        ctx.lineTo(beakerW / 2 - 10, 0);
        ctx.quadraticCurveTo(beakerW / 2, 0, beakerW / 2, -6);
        ctx.lineTo(beakerW / 2, -beakerH);
        ctx.lineTo(beakerW / 2 + 4, -beakerH);
        ctx.stroke();

        // Graduation scale markings on beaker wall
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.font = "8px monospace";
        for (let ml = 20; ml <= 100; ml += 20) {
            const gy = (-beakerH * (ml / 120)) * 0.85;
            ctx.beginPath();
            ctx.moveTo(-beakerW / 2 + 4, gy);
            ctx.lineTo(-beakerW / 2 + (ml % 40 === 0 ? 14 : 9), gy);
            ctx.stroke();
            if (ml % 40 === 0) {
                ctx.fillText(`${ml}ml`, -beakerW / 2 + 18, gy + 3);
            }
        }

        // White frosted label spot on beaker
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(-beakerW * 0.15, -beakerH * 0.65, beakerW * 0.55, 24);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("Cu(OH)₂ ↓", -beakerW * 0.10, -beakerH * 0.65 + 15);

        ctx.restore();

        // 1.2 Render Pouring Reagent Flask on the Left
        ctx.save();
        ctx.translate(flaskBaseX, flaskBaseY);
        ctx.rotate(state.tiltAngle);

        const flaskW = beakerW * 0.88;
        const flaskH = flaskW * 1.5;

        // Erlenmeyer Flask Body (Tam giác mở rộng dần về đáy)
        const flaskPath = new Path2D();
        flaskPath.moveTo(-12, -flaskH); // Lip left
        flaskPath.lineTo(12, -flaskH); // Lip right
        flaskPath.lineTo(10, -flaskH * 0.65); // Neck right
        flaskPath.lineTo(flaskW * 0.65, 0); // Bottom right
        flaskPath.quadraticCurveTo(flaskW * 0.65, 8, flaskW * 0.5, 8);
        flaskPath.lineTo(-flaskW * 0.5, 8); // Bottom center
        flaskPath.quadraticCurveTo(-flaskW * 0.65, 8, -flaskW * 0.65, 0);
        flaskPath.lineTo(-10, -flaskH * 0.65); // Neck left
        flaskPath.closePath();

        // Liquid inside tilted flask
        ctx.save();
        ctx.clip(flaskPath);
        const flaskLiqGrad = ctx.createLinearGradient(-flaskW, 0, flaskW, -flaskH);
        flaskLiqGrad.addColorStop(0, "rgba(14, 165, 233, 0.9)");
        flaskLiqGrad.addColorStop(1, "rgba(56, 189, 248, 0.8)");
        ctx.fillStyle = flaskLiqGrad;
        // Liquid rotates against tilt to stay leveled with gravity
        ctx.rotate(-state.tiltAngle);
        ctx.fillRect(-flaskW * 1.5, -35, flaskW * 3, flaskH * 2);
        ctx.rotate(state.tiltAngle);
        ctx.restore();

        // Flask glass outline & reflection highlights
        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = 2.5;
        ctx.stroke(flaskPath);

        // Flask label
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillRect(-flaskW * 0.35, -flaskH * 0.38, flaskW * 0.7, 20);
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 8px monospace";
        ctx.fillText("CuSO₄ 1.0M", -flaskW * 0.28, -flaskH * 0.38 + 13);

        // Pour spout position in global coordinates
        const spoutLocalX = 14;
        const spoutLocalY = -flaskH + 2;
        const rad = state.tiltAngle;
        const spoutGlobalX = flaskBaseX + spoutLocalX * Math.cos(rad) - spoutLocalY * Math.sin(rad);
        const spoutGlobalY = flaskBaseY + spoutLocalX * Math.sin(rad) + spoutLocalY * Math.cos(rad);

        ctx.restore();

        // 1.3 Liquid Stream Arcing from Flask Spout into Beaker
        if (isPouring) {
            const targetLiquidX = beakerX;
            const targetLiquidY = beakerY - liquidH;

            // Stream path: Cubic bezier curve
            ctx.save();
            ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
            ctx.lineWidth = 4.5;
            ctx.lineCap = "round";

            const cp1x = spoutGlobalX + 25;
            const cp1y = spoutGlobalY + 10;
            const cp2x = targetLiquidX - 15;
            const cp2y = targetLiquidY - 30;

            ctx.beginPath();
            ctx.moveTo(spoutGlobalX, spoutGlobalY);
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, targetLiquidX, targetLiquidY);
            ctx.stroke();

            // Inner bright core
            ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Splash droplets at landing point
            ctx.fillStyle = "rgba(186, 230, 253, 0.85)";
            for (let i = 0; i < 4; i++) {
                const splashAngle = (i / 4) * Math.PI + Math.sin(time * 15 + i) * 0.5;
                const dist = 6 + Math.random() * 8;
                const sx = targetLiquidX + Math.cos(splashAngle) * dist;
                const sy = targetLiquidY - Math.sin(splashAngle) * dist;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Expanding ripple circles on liquid surface
            const rippleR = (time * 40) % 18;
            const rippleAlpha = Math.max(0, 1 - rippleR / 18);
            ctx.strokeStyle = `rgba(224, 242, 254, ${rippleAlpha * 0.7})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(targetLiquidX, targetLiquidY, rippleR, rippleR * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // 1.4 Virtual Hand / Phone Gyro Indicator Icon near flask
        ctx.save();
        ctx.translate(flaskBaseX - 35, flaskBaseY - 20);
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-24, -14, 48, 28, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        const tiltDeg = Math.round((state.tiltAngle * 180) / Math.PI);
        ctx.fillText(`📱 ${tiltDeg}°`, 0, 4);
        ctx.restore();
    };

    // ─── 2. PHYSICS OPTICS SIMULATION RENDERER ───
    const renderPhysicsLab = (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        benchY: number,
        dt: number,
        state: any,
        mouse: { x: number; y: number }
    ) => {
        const time = state.time;
        const axisY = h * 0.48;
        const lensX = w * 0.52;
        const f = Math.min(100, w * 0.20); // Focal length

        // Interactive object AB position
        let objX = w * 0.22;
        if (mouse.x > 0.1 && mouse.x < 0.45) {
            objX = w * mouse.x;
        }
        const objHeight = 55;
        const d = lensX - objX; // Distance from object to lens

        // Thin lens formula: 1/f = 1/d + 1/d' => d' = (d * f) / (d - f)
        const dPrime = d !== f ? (d * f) / (d - f) : 9999;
        const imageX = lensX + dPrime;
        const mag = -dPrime / d;
        const imgHeight = objHeight * mag;

        // 2.1 Principal optical axis (Trục chính quang học)
        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(w * 0.08, axisY);
        ctx.lineTo(w * 0.92, axisY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Bench scale ticks
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        for (let x = w * 0.1; x <= w * 0.9; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, axisY - 4);
            ctx.lineTo(x, axisY + 4);
            ctx.stroke();
        }

        // 2.2 Convex Lens (Thấu kính hội tụ) in center
        ctx.save();
        ctx.translate(lensX, axisY);

        // Biconvex glass gradient
        const lensGrad = ctx.createLinearGradient(-12, 0, 12, 0);
        lensGrad.addColorStop(0, "rgba(56, 189, 248, 0.2)");
        lensGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.65)");
        lensGrad.addColorStop(1, "rgba(56, 189, 248, 0.2)");

        ctx.fillStyle = lensGrad;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Lens stand holder
        ctx.fillStyle = "#334155";
        ctx.fillRect(-4, h * 0.32, 8, benchY - (axisY + h * 0.32));

        // Focal points markers F and F'
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(-f, 0, 3.5, 0, Math.PI * 2);
        ctx.arc(f, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 10px monospace";
        ctx.fillText("F", -f - 4, -8);
        ctx.fillText("F'", f - 4, -8);
        ctx.fillText("O", -4, 16);
        ctx.restore();

        // 2.3 Object Arrow AB (Vật sáng AB)
        ctx.save();
        ctx.strokeStyle = "#38bdf8";
        ctx.fillStyle = "#38bdf8";
        ctx.lineWidth = 3.5;
        // Arrow body
        ctx.beginPath();
        ctx.moveTo(objX, axisY);
        ctx.lineTo(objX, axisY - objHeight);
        ctx.stroke();
        // Arrow head pointing UP
        ctx.beginPath();
        ctx.moveTo(objX, axisY - objHeight - 4);
        ctx.lineTo(objX - 5, axisY - objHeight + 6);
        ctx.lineTo(objX + 5, axisY - objHeight + 6);
        ctx.closePath();
        ctx.fill();

        ctx.font = "bold 10px monospace";
        ctx.fillText("B", objX - 12, axisY - objHeight);
        ctx.fillText("A", objX - 12, axisY + 12);
        ctx.restore();

        // 2.4 Laser Light Rays (Các tia sáng khúc xạ đặc biệt)
        const rayOffset = (time * 40) % 16;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -rayOffset;

        // Tia 1: Đi song song trục chính -> Khúc xạ đi qua tiêu điểm F'
        ctx.strokeStyle = "#ef4444"; // Red laser
        ctx.beginPath();
        ctx.moveTo(objX, axisY - objHeight);
        ctx.lineTo(lensX, axisY - objHeight);
        ctx.lineTo(imageX, axisY - imgHeight);
        ctx.stroke();

        // Tia 2: Đi qua quang tâm O -> Truyền thẳng
        ctx.strokeStyle = "#22c55e"; // Green laser
        ctx.beginPath();
        ctx.moveTo(objX, axisY - objHeight);
        ctx.lineTo(lensX, axisY);
        ctx.lineTo(imageX, axisY - imgHeight);
        ctx.stroke();

        // Tia 3: Đi qua tiêu điểm F -> Khúc xạ song song trục chính
        ctx.strokeStyle = "#eab308"; // Amber laser
        ctx.beginPath();
        ctx.moveTo(objX, axisY - objHeight);
        ctx.lineTo(lensX, axisY - imgHeight);
        ctx.lineTo(imageX, axisY - imgHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 2.5 Inverted Real Image A'B' (Ảnh thật A'B' ngược chiều)
        if (dPrime > 0 && imageX < w * 0.95) {
            ctx.save();
            ctx.strokeStyle = "#a855f7"; // Purple arrow
            ctx.fillStyle = "#a855f7";
            ctx.lineWidth = 3.5;
            // Arrow body
            ctx.beginPath();
            ctx.moveTo(imageX, axisY);
            ctx.lineTo(imageX, axisY - imgHeight);
            ctx.stroke();
            // Arrow head pointing DOWN
            ctx.beginPath();
            ctx.moveTo(imageX, axisY - imgHeight + 4);
            ctx.lineTo(imageX - 5, axisY - imgHeight - 6);
            ctx.lineTo(imageX + 5, axisY - imgHeight - 6);
            ctx.closePath();
            ctx.fill();

            ctx.font = "bold 10px monospace";
            ctx.fillText("B'", imageX + 8, axisY - imgHeight);
            ctx.fillText("A'", imageX + 8, axisY - 6);
            ctx.restore();
        }
    };

    // ─── 3. BIOLOGY 3D CELL & HEART SIMULATION RENDERER ───
    const renderBiologyLab = (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        benchY: number,
        dt: number,
        state: any,
        mouse: { x: number; y: number }
    ) => {
        const time = state.time;
        const centerX = w * 0.50;
        const centerY = h * 0.46;
        const pulse = 1.0 + Math.sin(time * 3.5) * 0.05; // Cardiac/Cellular rhythmic pulse

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);

        // 3.1 Organic Plant/Animal Cell Outer Wall (Vách tế bào thực vật đa giác bo góc)
        ctx.strokeStyle = "rgba(34, 197, 94, 0.75)";
        ctx.lineWidth = 5;
        const cellR = Math.min(140, w * 0.26);

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Math.sin(time * 0.5 + i) * 0.05;
            const px = Math.cos(angle) * (cellR + (i % 2 === 0 ? 10 : -10));
            const py = Math.sin(angle) * (cellR * 0.85);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        // Cytoplasm translucent fill (Dịch bào tương tế bào chất)
        const cellGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, cellR);
        cellGrad.addColorStop(0, "rgba(16, 185, 129, 0.15)");
        cellGrad.addColorStop(0.7, "rgba(5, 150, 105, 0.25)");
        cellGrad.addColorStop(1, "rgba(4, 120, 87, 0.5)");
        ctx.fillStyle = cellGrad;
        ctx.fill();
        ctx.stroke();

        // 3.2 Cell Nucleus (Nhân tế bào với hạch nhân phát sáng)
        const nucleusX = -cellR * 0.25;
        const nucleusY = -cellR * 0.15;
        const nucleusR = cellR * 0.32;

        const nucleusGrad = ctx.createRadialGradient(nucleusX, nucleusY, 5, nucleusX, nucleusY, nucleusR);
        nucleusGrad.addColorStop(0, "rgba(168, 85, 247, 0.95)");
        nucleusGrad.addColorStop(0.7, "rgba(126, 34, 206, 0.85)");
        nucleusGrad.addColorStop(1, "rgba(88, 28, 135, 0.9)");

        ctx.fillStyle = nucleusGrad;
        ctx.strokeStyle = "rgba(192, 132, 252, 0.8)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(nucleusX, nucleusY, nucleusR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nucleolus (Hạch nhân)
        ctx.fillStyle = "rgba(243, 232, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(nucleusX - 4, nucleusY - 4, 7, 0, Math.PI * 2);
        ctx.fill();

        // Chromatin DNA threads
        ctx.strokeStyle = "rgba(233, 213, 255, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(nucleusX + 8, nucleusY + 6, 10, 0, Math.PI * 1.5);
        ctx.stroke();

        // 3.3 Chloroplasts (Lục lạp quang hợp hình hạt đậu xanh lá)
        const chloroPositions = [
            { x: cellR * 0.35, y: -cellR * 0.35, rot: 0.4 },
            { x: cellR * 0.42, y: cellR * 0.20, rot: -0.6 },
            { x: -cellR * 0.35, y: cellR * 0.35, rot: 0.8 },
            { x: 0, y: cellR * 0.45, rot: 0.1 },
        ];

        chloroPositions.forEach((pos, idx) => {
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(pos.rot + Math.sin(time + idx) * 0.1);
            ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
            ctx.strokeStyle = "rgba(187, 247, 208, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Grana thylakoid discs inside chloroplast
            ctx.strokeStyle = "rgba(20, 83, 45, 0.6)";
            ctx.lineWidth = 1.5;
            for (let d = -10; d <= 10; d += 6) {
                ctx.beginPath();
                ctx.moveTo(d, -6);
                ctx.lineTo(d, 6);
                ctx.stroke();
            }
            ctx.restore();
        });

        // 3.4 Floating Cytoplasmic streaming particles (Hạt ribosome)
        state.bioCells.forEach((c: any) => {
            c.x += c.vx;
            c.y += c.vy;
            if (Math.hypot(c.x, c.y) > cellR * 0.75) {
                c.vx *= -1;
                c.vy *= -1;
            }
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    };

    return (
        <div
            className="relative w-full rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden group select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({
                    x: (e.clientX - rect.left) / rect.width,
                    y: (e.clientY - rect.top) / rect.height,
                });
            }}
        >
            {/* 1. Header Toolbar: Tab Mode Switcher (Hóa Học, Vật Lý, Sinh Học) */}
            <div className="absolute top-0 inset-x-0 z-20 px-3 py-2.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                        onClick={() => setMode("chemistry")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            mode === "chemistry"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102"
                                : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                        }`}
                    >
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Hóa Học 3D</span>
                    </button>

                    <button
                        onClick={() => setMode("physics")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            mode === "physics"
                                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-102"
                                : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                        }`}
                    >
                        <Atom className="w-3.5 h-3.5 text-sky-300" />
                        <span>Vật Lý 3D</span>
                    </button>

                    <button
                        onClick={() => setMode("biology")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            mode === "biology"
                                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-102"
                                : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                        }`}
                    >
                        <Dna className="w-3.5 h-3.5 text-purple-300" />
                        <span>Sinh Học 3D</span>
                    </button>
                </div>

                {/* Right Status Badge */}
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Mô Phỏng 60 FPS</span>
                </div>
            </div>

            {/* 2. Main HTML5 Canvas (60FPS Interactive Stage) */}
            <div className="relative w-full h-[320px] sm:h-[390px] md:h-[430px]">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block cursor-crosshair"
                />

                {/* 3. Floating HUD Badge (Top-Right): Scientific Equation / Sensor Readout */}
                <div className="absolute top-14 right-3 z-10 pointer-events-none">
                    {mode === "chemistry" && (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/40 backdrop-blur-md text-white shadow-xl max-w-[210px] space-y-1 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3 text-sky-400" />
                                <span>Phản Ứng Trao Đổi</span>
                            </div>
                            <div className="font-mono text-xs font-bold text-white">
                                CuSO₄ + 2NaOH →
                            </div>
                            <div className="font-mono text-[11px] text-emerald-300 font-bold">
                                Cu(OH)₂↓ + Na₂SO₄
                            </div>
                            <div className="text-[10px] text-slate-300 pt-0.5 border-t border-slate-800 flex items-center justify-between">
                                <span>Hiện tượng:</span>
                                <span className="text-sky-300 font-semibold">Kết tủa xanh lam</span>
                            </div>
                        </div>
                    )}

                    {mode === "physics" && (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/40 backdrop-blur-md text-white shadow-xl max-w-[210px] space-y-1 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>Quang Hình Học</span>
                            </div>
                            <div className="font-mono text-xs font-bold text-white">
                                1/f = 1/d + 1/d&apos;
                            </div>
                            <div className="text-[10px] text-slate-300 pt-0.5 space-y-0.5 font-mono">
                                <div>f = +12.0 cm (Hội tụ)</div>
                                <div className="text-purple-300 font-semibold">Ảnh thật A&apos;B&apos; ngược chiều</div>
                            </div>
                        </div>
                    )}

                    {mode === "biology" && (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/40 backdrop-blur-md text-white shadow-xl max-w-[210px] space-y-1 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                                <Dna className="w-3 h-3 text-purple-400" />
                                <span>Tế Bào Thực Vật 3D</span>
                            </div>
                            <div className="text-xs font-bold text-white">
                                Lục lạp & Dịch bào tương
                            </div>
                            <div className="text-[10px] text-emerald-300 pt-0.5 font-mono">
                                Đang quang hợp (ATP, O₂)
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Floating HUD Badge (Bottom-Left): AI Cô giáo Mai speech bubble */}
                <div className="absolute bottom-3 left-3 z-10 pointer-events-none max-w-[260px] sm:max-w-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/92 border border-slate-700/80 backdrop-blur-md shadow-2xl flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-white">Cô giáo Mai (AI)</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-700 font-semibold">
                                    GDPT 2018
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug mt-1">
                                {mode === "chemistry" && "Dốc bình để thấy kết tủa Cu(OH)₂ xanh lam xuất hiện tức thì!"}
                                {mode === "physics" && "Di chuyển vật sáng AB lại gần thấu kính để quan sát ảnh A'B' phóng to!"}
                                {mode === "biology" && "Quan sát các hạt lục lạp xanh trôi nổi theo dòng tế bào chất nhé!"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 5. Floating Interactive Hint / CTA Button (Bottom-Right) */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                    <Link
                        href={mode === "chemistry" ? "/lab" : mode === "physics" ? "/physics" : "/biology"}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        <span>Mở Lab 3D</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
