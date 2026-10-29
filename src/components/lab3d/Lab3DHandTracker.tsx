"use client";

/**
 * ─── Lab3DHandTracker ───
 * Camera webcam + MediaPipe HandLandmarker (tasks-vision).
 * 
 * Xuất tọa độ 21 điểm đã Lerp-smooth vào handStateRef (MutableRefObject).
 * KHÔNG dùng useState cho tọa độ — React KHÔNG bao giờ re-render vì dữ liệu tay.
 * 
 * Hiển thị:
 * - Video preview nhỏ (góc dưới trái) với skeleton vẽ lên canvas
 * - Nút bật/tắt camera
 * - Chỉ báo gesture hiện tại
 */

import React, { useRef, useEffect, useState, useCallback, MutableRefObject } from "react";
import { Camera, Hand, AlertCircle } from "lucide-react";
import {
    HandState,
    DEFAULT_HAND_STATE,
    updateHandState,
    HandLandmark,
} from "@/lib/handTracking";

interface Lab3DHandTrackerProps {
    /** Ref chia sẻ với Lab3DScene — dữ liệu tay cập nhật trực tiếp ở đây */
    handStateRef: MutableRefObject<HandState>;
    /** Show/hide video preview */
    showPreview?: boolean;
    /** Tự động khởi động camera khi mở lab 3D (mặc định: true) */
    autoStart?: boolean;
}

// MediaPipe HandLandmarker connections for skeleton drawing
const HAND_CONNECTIONS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // index
    [0, 9], [9, 10], [10, 11], [11, 12],  // middle
    [0, 13], [13, 14], [14, 15], [15, 16],// ring
    [0, 17], [17, 18], [18, 19], [19, 20],// pinky
    [5, 9], [9, 13], [13, 17],            // palm
];

export default function Lab3DHandTracker({
    handStateRef,
    showPreview = true,
    autoStart = true,
}: Lab3DHandTrackerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handLandmarkerRef = useRef<any>(null);
    const animFrameRef = useRef<number>(0);

    const [cameraActive, setCameraActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gestureLabel, setGestureLabel] = useState<string>("Đang khởi tạo camera...");

    // ─── Initialize MediaPipe HandLandmarker ───
    const initHandLandmarker = useCallback(async () => {
        try {
            // Dynamic import to avoid SSR issues with Next.js
            const vision = await import("@mediapipe/tasks-vision");
            const { HandLandmarker, FilesetResolver } = vision;

            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "CPU",
                },
                runningMode: "VIDEO",
                numHands: 2, // ✅ Theo dõi đồng thời cả 2 bàn tay (Tay Trái + Tay Phải)
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            handLandmarkerRef.current = handLandmarker;
            return handLandmarker;
        } catch (err) {
            console.error("Failed to init HandLandmarker:", err);
            setError("Không thể khởi tạo MediaPipe. Kiểm tra kết nối mạng.");
            return null;
        }
    }, []);

    // ─── Start Camera ───
    const startCamera = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Init MediaPipe
            const handLandmarker = await initHandLandmarker();
            if (!handLandmarker) {
                setLoading(false);
                return;
            }

            // 2. Request camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user",
                    frameRate: { ideal: 30 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraActive(true);
            setLoading(false);

            // 3. Start detection loop
            let lastVideoTime = -1;

            const detectFrame = () => {
                const video = videoRef.current;
                const handLandmarkerInstance = handLandmarkerRef.current;

                if (!video || !handLandmarkerInstance || video.readyState < 2) {
                    animFrameRef.current = requestAnimationFrame(detectFrame);
                    return;
                }

                const now = performance.now();

                if (video.currentTime !== lastVideoTime) {
                    lastVideoTime = video.currentTime;

                    try {
                        const results = handLandmarkerInstance.detectForVideo(video, now);

                        // ✅ Đồng bộ cả 2 bàn tay vào MutableRef
                        const { updateMultiHandState } = require("@/lib/handTracking");
                        updateMultiHandState(handStateRef.current, results, now);

                        // Vẽ skeleton preview lên canvas cho cả 2 tay
                        drawHandsSkeleton(results);

                        // Cập nhật label gesture hiển thị
                        const hs = handStateRef.current;
                        if (!hs.detected && !hs.leftHand.detected && !hs.rightHand.detected) {
                            setGestureLabel("Đưa tay vào khung hình...");
                        } else {
                            const gestureIcon = (hand: any) => {
                                if (hand.isPinkyExtended && !hand.isMiddleExtended && !hand.isIndexExtended) return "Mở tủ (Út)";
                                if (hand.isIndexExtended && !hand.isPinkyExtended) return "Cầm bình (Trỏ)";
                                if (hand.isMiddleExtended && !hand.isIndexExtended && !hand.isPinkyExtended) return "Chọn chất (Giữa)";
                                if (hand.gesture === "POUR") return "Rót";
                                if (hand.extendedFingersCount === 0 || hand.gesture === "GRAB") return "Nắm (Thả)";
                                return "Xòe / Thả";
                            };

                            const parts = [];
                            if (hs.leftHand.detected) {
                                parts.push(`Trái: ${gestureIcon(hs.leftHand)}`);
                            }
                            if (hs.rightHand.detected) {
                                parts.push(`Phải: ${gestureIcon(hs.rightHand)}`);
                            }
                            setGestureLabel(parts.length > 0 ? parts.join(" | ") : "Đã nhận diện");
                        }
                    } catch (err) {
                        // Frame skip
                    }
                }

                animFrameRef.current = requestAnimationFrame(detectFrame);
            };

            detectFrame();
        } catch (err: any) {
            console.error("Camera error:", err);
            if (err.name === "NotAllowedError") {
                setError("Bạn cần cấp quyền truy cập camera.");
            } else {
                setError("Không thể mở camera. Kiểm tra thiết bị.");
            }
            setLoading(false);
        }
    }, [initHandLandmarker, handStateRef]);

    // ─── Stop Camera ───
    const stopCamera = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
        if (handLandmarkerRef.current) {
            handLandmarkerRef.current.close();
            handLandmarkerRef.current = null;
        }
        setCameraActive(false);
        setGestureLabel("Chưa bật camera");

        // Reset hand state
        Object.assign(handStateRef.current, DEFAULT_HAND_STATE);
    }, [handStateRef]);

    // Auto-start camera on mount if autoStart is true
    useEffect(() => {
        if (autoStart) {
            const timer = setTimeout(() => {
                startCamera();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [autoStart, startCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // ─── Draw hand skeleton on canvas for up to 2 hands ───
    const drawHandsSkeleton = useCallback((results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!results || !results.landmarks || results.landmarks.length === 0) return;

        const w = canvas.width;
        const h = canvas.height;

        results.landmarks.forEach((landmarks: any[], index: number) => {
            const handedness = results.handednesses?.[index]?.[0]?.categoryName || (index === 0 ? "Right" : "Left");
            const isLeft = handedness === "Left";

            const strokeColor = isLeft ? "rgba(56, 189, 248, 0.85)" : "rgba(16, 185, 129, 0.85)";
            const tipColor = isLeft ? "#38bdf8" : "#10b981";
            const jointColor = isLeft ? "#0284c7" : "#059669";

            // Draw connections
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2.5;
            for (const [i, j] of HAND_CONNECTIONS) {
                const a = landmarks[i];
                const b = landmarks[j];
                if (!a || !b) continue;
                ctx.beginPath();
                ctx.moveTo(a.x * w, a.y * h);
                ctx.lineTo(b.x * w, b.y * h);
                ctx.stroke();
            }

            // Draw landmarks
            for (let i = 0; i < landmarks.length; i++) {
                const lm = landmarks[i];
                const isTip = [4, 8, 12, 16, 20].includes(i);
                ctx.beginPath();
                ctx.arc(lm.x * w, lm.y * h, isTip ? 5 : 3, 0, Math.PI * 2);
                ctx.fillStyle = isTip ? tipColor : jointColor;
                ctx.fill();
                if (isTip) {
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
            }

            // Label text over wrist
            const wrist = landmarks[0];
            if (wrist) {
                ctx.font = "bold 12px sans-serif";
                ctx.fillStyle = tipColor;
                ctx.fillText(isLeft ? "Tay Trái" : "Tay Phải", wrist.x * w - 24, wrist.y * h + 18);
            }
        });
    }, []);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, []);

    // ─── Render ───
    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 select-none">
            {/* Camera preview */}
            {showPreview && (
                <div
                    onClick={!cameraActive && !loading ? startCamera : undefined}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-2xl backdrop-blur-md group ${
                        cameraActive
                            ? "border-emerald-500/80 shadow-emerald-500/25 ring-2 ring-emerald-500/20"
                            : "border-cyan-500/50 hover:border-cyan-400 cursor-pointer shadow-cyan-500/10 hover:scale-[1.02]"
                    }`}
                    style={{ width: 256, height: 192 }}
                    title={!cameraActive ? "Bấm vào để kích hoạt Camera Hand Tracking" : "Camera Hand Tracking đang hoạt động"}
                >
                    {/* Top bar header */}
                    <div className="absolute top-0 left-0 right-0 z-10 px-2.5 py-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-[11px] font-bold text-white tracking-wide">
                                Camera Hand AI
                            </span>
                        </div>
                        {cameraActive ? (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-[9px] font-black text-emerald-300 tracking-wider">LIVE</span>
                            </span>
                        ) : (
                            <span className="text-[9px] font-semibold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
                                CHẠM ĐỂ BẬT
                            </span>
                        )}
                    </div>

                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                        playsInline
                        muted
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ transform: "scaleX(-1)" }}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                    {/* Gesture indicator */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="text-[11px] font-bold text-white bg-black/70 backdrop-blur-md px-2 py-0.8 rounded-lg border border-white/10 shadow-sm flex items-center gap-1.5">
                            <Hand className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{gestureLabel}</span>
                        </span>
                    </div>

                    {/* Error overlay */}
                    {error && (
                        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-3 z-20">
                            <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
                            <p className="text-xs text-red-200 text-center font-medium">{error}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startCamera();
                                }}
                                className="mt-2 text-[10px] bg-red-800 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-semibold"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 z-20">
                            <div className="relative">
                                <div className="w-9 h-9 border-3 border-emerald-500/20 rounded-full" />
                                <div className="absolute inset-0 w-9 h-9 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-xs font-semibold text-emerald-300">Đang bật camera & AI...</p>
                            <p className="text-[10px] text-slate-400">MediaPipe Hand Tracking</p>
                        </div>
                    )}

                    {/* Camera off placeholder */}
                    {!cameraActive && !loading && !error && (
                        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center gap-2 p-3 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-emerald-600/30 border border-cyan-400/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                <Camera className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Camera đang tắt</p>
                                <p className="text-[10px] text-cyan-300 mt-0.5 animate-pulse">Bấm vào đây để Bật Camera</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    cameraActive
                        ? "bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                } ${loading ? "opacity-60 cursor-wait" : ""}`}
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Đang khởi tạo...
                    </>
                ) : cameraActive ? (
                    <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113Z" />
                            <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0 1 15.75 12ZM12.53 15.713l-4.243-4.244a3.75 3.75 0 0 0 4.244 4.243Z" />
                            <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 0 0-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 0 1 6.75 12Z" />
                        </svg>
                        Tắt Camera
                    </>
                ) : (
                    <>
                        <Hand className="w-4 h-4" />
                        Bật Hand Tracking
                    </>
                )}
            </button>
        </div>
    );
}
