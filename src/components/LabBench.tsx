"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Chemical, getChemicalById, isLiquidState } from "@/lib/chemicals";
import { getReaction, getHeatingReaction, ReactionResult } from "@/lib/reactions";
import { GlasswareType, suggestGlassware, getTransactionType, glasswareNames, TransactionType } from "@/lib/glassware";
import { Experiment, experiments } from "@/lib/experiments";
import {
    Assignment,
    Submission,
    BadgeDef,
    getAssignmentById,
    getCurrentUser,
    getSubmission,
    submitAssignment,
    recordSubmission,
    isWalkthroughDone,
    setWalkthroughDone,
} from "@/lib/storage";
import confetti from "canvas-confetti";
import Beaker from "./Beaker";
import ReactionEffects from "./ReactionEffects";
import ChemicalSelector from "./ChemicalSelector";
import ReactionInfo from "./ReactionInfo";
import ExperimentPanel from "./ExperimentPanel";
import SafetyModal from "./SafetyModal";
import AssignmentQuiz from "./AssignmentQuiz";
import ScienceLab from "./ScienceLab";
import { Tour, TourStep } from "./Tour";
import LabHeader from "./LabHeader";
import LabAITutorWidget from "./LabAITutorWidget";
import { FlaskConical, RotateCcw, X, Sparkles, FolderOpen, Maximize2, Minimize2, BookOpen, Video, Award, Flame, Keyboard } from "lucide-react";

export type ActiveReaction = {
    result: ReactionResult;
    startTime: number;
};

// ─── Pour stream overlay component ───
function PourStream({
    color,
    isLiquid,
    position,
    onComplete,
}: {
    color: string;
    isLiquid: boolean;
    position: { left: number; top: number };
    onComplete: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onComplete, 900);
        return () => clearTimeout(t);
    }, [onComplete]);

    return (
        <div className="fixed pointer-events-none z-50" style={{ left: position.left, top: position.top, width: 3, height: 120 }}>
            {/* Stream line */}
            <div
                className="w-full"
                style={{
                    height: "100%",
                    background: isLiquid
                        ? `linear-gradient(to bottom, ${color}, ${color}dd, transparent)`
                        : `linear-gradient(to bottom, ${color}cc, transparent)`,
                    borderRadius: "2px",
                    filter: "blur(1.5px)",
                    opacity: 0.7,
                    animation: "pour-trail 0.9s ease-out forwards",
                }}
            />
            {/* Particles for solid dropping */}
            {!isLiquid && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 w-3 h-3 rounded-sm"
                    style={{
                        backgroundColor: color,
                        animation: "drop-solid 0.7s ease-in forwards",
                    }}
                />
            )}
        </div>
    );
}

export default function LabBench() {
    const [chemical1, setChemical1] = useState<Chemical | null>(null);
    const [chemical2, setChemical2] = useState<Chemical | null>(null);
    const [activeReaction, setActiveReaction] = useState<ActiveReaction | null>(null);
    const [labStatus, setLabStatus] = useState<"idle" | "reacting" | "complete">("idle");
    const [dragOver, setDragOver] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [touchDraggingChem, setTouchDraggingChem] = useState<Chemical | null>(null);
    const [touchGhostPos, setTouchGhostPos] = useState<{ x: number; y: number } | null>(null);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Gamification: walkthrough 90s + badge feedback
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [tourOpen, setTourOpen] = useState(false);
    const tourSteps: TourStep[] = [
        { target: "#tour-chemical-selector", title: "Kho hóa chất", description: "Tại đây bạn có thể chọn các hóa chất để tiến hành thí nghiệm." },
        { target: "#tour-beaker-area", title: "Khu vực phản ứng", description: "Hóa chất sẽ được hòa trộn ở đây. Kéo thả hoặc click để thêm vào ống nghiệm." },
        { target: "#tour-reaction-info", title: "Thông tin phản ứng", description: "Bảng này sẽ hiện phương trình và hiện tượng hóa học xảy ra." },
        { target: "#tour-tools", title: "Thanh công cụ", description: "Thay đổi chế độ xem, đun nóng, hoặc xóa ống nghiệm bằng các nút công cụ này." }
    ];
    const [walkthroughStep, setWalkthroughStep] = useState(0);
    const [newBadges, setNewBadges] = useState<BadgeDef[]>([]);
    const [labUser, setLabUser] = useState<{ id: string } | null>(null);
    const walkthroughTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Experiments panel
    const [showExperiments, setShowExperiments] = useState(false);

    // Safety acknowledgment modal
    const [safetyModal, setSafetyModal] = useState<{ chemical: Chemical; slot: 1 | 2 } | null>(null);
    const safetyAcceptedRef = useRef(false);

    // Pour animation state
    const [pourAnim, setPourAnim] = useState<{ color: string; isLiquid: boolean } | null>(null);
    const [pourPos, setPourPos] = useState<{ left: number; top: number } | null>(null);
    const [showTube, setShowTube] = useState(false);

    // Dark mode state (default dark, applied from localStorage on mount to avoid hydration mismatch)
    const [isDark, setIsDark] = useState<boolean>(true);

    // Assignment mode (từ /lab?assignment=<id>)
    const searchParams = useSearchParams();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState<Submission | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);

    // Logging & Grading for MVP Requirements
    const [processScore, setProcessScore] = useState<number>(10);
    const [safetyErrors, setSafetyErrors] = useState<string[]>([]);
    const [actionsLog, setActionsLog] = useState<string[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("simlab-theme");
            if (saved === "light") {
                document.documentElement.classList.remove("dark");
                setIsDark(false);
            } else {
                document.documentElement.classList.add("dark");
                setIsDark(true);
            }
        } catch {
            document.documentElement.classList.add("dark");
            setIsDark(true);
        }
    }, []);

    // Walkthrough 90 giây: hiện 1 lần cho học sinh (hoặc khách) khi vào lab
    useEffect(() => {
        const user = getCurrentUser();
        const uid = user?.role === "student" ? user.id : "guest";
        setLabUser({ id: uid });
        if (isWalkthroughDone(uid)) return;
        setTourOpen(true);
        walkthroughTimerRef.current = setTimeout(() => {
            setShowWalkthrough(false);
            setWalkthroughDone(uid);
        }, 90000);
        return () => {
            if (walkthroughTimerRef.current) clearTimeout(walkthroughTimerRef.current);
        };
    }, []);

    // Glassware
    const [glassware, setGlassware] = useState<GlasswareType>("test-tube");

    // Transaction animation
    const [txnActive, setTxnActive] = useState<{ type: TransactionType; color: string } | null>(null);

    // Track if we've shown the tube
    const tubeVisibleRef = useRef(false);

    // Ref to the beaker area (for positioning the pour stream)
    const beakerAreaRef = useRef<HTMLDivElement | null>(null);

    // Update glassware based on chemicals + reaction
    useEffect(() => {
        const result = activeReaction?.result || null;
        if (chemical1 && chemical2) {
            const g = suggestGlassware(chemical1, chemical2, result);
            setGlassware(g);
        } else {
            setGlassware("test-tube");
        }
    }, [chemical1, chemical2, activeReaction]);

    // Show tube when first chemical is added
    useEffect(() => {
        if (chemical1 && !tubeVisibleRef.current) {
            setShowTube(true);
            tubeVisibleRef.current = true;
        }
        if (!chemical1) {
            setShowTube(false);
            tubeVisibleRef.current = false;
        }
    }, [chemical1]);

    // Measure the beaker position so the pour stream pours into the tube
    useEffect(() => {
        if (pourAnim && showTube && beakerAreaRef.current) {
            const rect = beakerAreaRef.current.getBoundingClientRect();
            setPourPos({ left: rect.left + rect.width / 2 - 1.5, top: rect.top });
        }
    }, [pourAnim, showTube]);

    const toggleDarkMode = useCallback(() => {
        const root = document.documentElement;
        const next = !root.classList.contains("dark");
        root.classList.toggle("dark", next);
        setIsDark(next);
        try {
            localStorage.setItem("simlab-theme", next ? "dark" : "light");
        } catch {
            // localStorage unavailable — ignore
        }
    }, []);

    const triggerPourAnim = useCallback((chemical: Chemical) => {
        const isLiquid = isLiquidState(chemical.state);
        const color = isLiquid
            ? chemical.liquidColor
            : chemical.solidColor || chemical.color;
        setPourAnim({ color, isLiquid });
    }, []);

    const handlePourComplete = useCallback(() => {
        setPourAnim(null);
    }, []);

    const triggerTransaction = useCallback((chemical: Chemical) => {
        const txnType = getTransactionType(chemical);
        const isLiquid = isLiquidState(chemical.state);
        const color = isLiquid ? chemical.liquidColor : chemical.solidColor || chemical.color;
        setTxnActive({ type: txnType, color });
        setTimeout(() => setTxnActive(null), 900);
    }, []);

    // Place a chemical into a slot, gated by the safety modal for hazardous substances
    const placeChemical = useCallback((slot: 1 | 2, chemical: Chemical) => {
        const hazardous = chemical.hazardous || chemical.corrosive || chemical.toxic || chemical.flammable;
        if (hazardous && !safetyAcceptedRef.current) {
            setSafetyModal({ chemical, slot });
            return;
        }

        // Logging & MVP Grading
        setActionsLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Thêm: ${chemical.name}`]);
        // If there is an assignment, check if this chemical is allowed
        const currentExp = assignment ? experiments.find(e => e.id === assignment.experimentId) : null;
        if (currentExp && !currentExp.chemicalIds.includes(chemical.id)) {
            setSafetyErrors((prev) => {
                const msg = `Chọn sai hóa chất (${chemical.name})`;
                if (!prev.includes(msg)) {
                    setProcessScore((s) => Math.max(0, s - 1));
                    return [...prev, msg];
                }
                return prev;
            });
        }

        if (slot === 1) setChemical1(chemical);
        else setChemical2(chemical);
        triggerPourAnim(chemical);
        triggerTransaction(chemical);
    }, [triggerPourAnim, triggerTransaction, assignment]);

    const handleSelectChemical = useCallback((chemical: Chemical) => {
        if (activeReaction) return;

        if (!chemical1) {
            placeChemical(1, chemical);
        } else if (!chemical2 && chemical1.id !== chemical.id) {
            placeChemical(2, chemical);
        }
    }, [activeReaction, chemical1, chemical2, placeChemical]);

    const handleReplaceChemical = useCallback((slot: 1 | 2, chemical: Chemical) => {
        if (activeReaction) return;
        if (slot === 1) {
            if (chemical2 && chemical2.id === chemical.id) return;
            placeChemical(1, chemical);
        } else {
            if (chemical1 && chemical1.id === chemical.id) return;
            placeChemical(2, chemical);
        }
    }, [activeReaction, chemical1, chemical2, placeChemical]);

    // ─── Drag & Drop (single zone) ───
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);

            if (activeReaction) return;

            const chemicalId = e.dataTransfer.getData("application/simlab-chemical");
            if (!chemicalId) return;

            const chemical = getChemicalById(chemicalId);
            if (!chemical) return;

            // If already in use
            if (chemical1?.id === chemical.id || chemical2?.id === chemical.id) return;

            if (!chemical1) {
                placeChemical(1, chemical);
            } else if (!chemical2) {
                placeChemical(2, chemical);
            }
        },
        [activeReaction, chemical1, chemical2, placeChemical]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
        }
    }, []);

    // ─── Touch Drag & Drop for Mobile & Tablet ───
    const handleTouchDragStart = useCallback((chemical: Chemical, x: number, y: number) => {
        if (activeReaction) return;
        if (chemical1?.id === chemical.id || chemical2?.id === chemical.id) return;
        setTouchDraggingChem(chemical);
        setTouchGhostPos({ x, y });
    }, [activeReaction, chemical1, chemical2]);

    const handleTouchDragMove = useCallback((x: number, y: number) => {
        setTouchGhostPos({ x, y });
        const el = document.elementFromPoint(x, y);
        const isOverDropZone = !!el?.closest('[data-drop-zone="beaker"]');
        setDragOver(isOverDropZone);
    }, []);

    const handleTouchDragEnd = useCallback(() => {
        if (touchDraggingChem && dragOver) {
            if (!chemical1) {
                placeChemical(1, touchDraggingChem);
            } else if (!chemical2 && chemical1.id !== touchDraggingChem.id) {
                placeChemical(2, touchDraggingChem);
                // When both chemicals are chosen, auto close drawer on phone
                setMobileSidebarOpen(false);
            }
            if (typeof window !== "undefined" && navigator.vibrate) {
                navigator.vibrate([40, 30, 40]);
            }
        }
        setTouchDraggingChem(null);
        setTouchGhostPos(null);
        setDragOver(false);
    }, [touchDraggingChem, dragOver, chemical1, chemical2, placeChemical]);

    // ─── Trigger reaction ───
    const triggerReaction = useCallback((chem1: Chemical, chem2: Chemical) => {
        const result = getReaction(chem1, chem2);
        if (result) {
            setLabStatus("reacting");
            const reaction: ActiveReaction = {
                result,
                startTime: Date.now(),
            };
            setActiveReaction(reaction);

            // Celebration confetti for spectacular reactions
            const spectacular = ["precipitation", "combustion", "complex", "gas_evolution"].includes(result.type);
            if (spectacular) {
                setTimeout(() => {
                    confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 }, zIndex: 100 });
                }, 400);
            }

            const maxDuration = Math.max(0, ...result.effects.map((e) => e.duration)) + 1000;
            setTimeout(() => {
                setLabStatus("complete");
            }, maxDuration);
        } else {
            // No reaction — still show as complete with empty reaction
            setLabStatus("complete");
        }
    }, []);

    // Auto-trigger when both chemicals are present
    const prevChem2Ref = useRef<Chemical | null>(null);
    useEffect(() => {
        if (chemical1 && chemical2 && !activeReaction && prevChem2Ref.current === null && chemical2 !== null) {
            // Wait for pour animation to finish then trigger
            const timer = setTimeout(() => triggerReaction(chemical1, chemical2), 1200);
            return () => clearTimeout(timer);
        }
        prevChem2Ref.current = chemical2;
    }, [chemical2, chemical1, activeReaction, triggerReaction]);

    const handleReact = useCallback(() => {
        if (chemical1 && chemical2 && !activeReaction) {
            triggerReaction(chemical1, chemical2);
        }
    }, [chemical1, chemical2, activeReaction, triggerReaction]);

    const handleClearAll = useCallback(() => {
        setChemical1(null);
        setChemical2(null);
        setActiveReaction(null);
        setLabStatus("idle");
        setPourAnim(null);
        setTxnActive(null);
        setShowTube(false);
        tubeVisibleRef.current = false;
        prevChem2Ref.current = null;
        setSafetyModal(null);
    }, []);

    const handleReplayReaction = useCallback(() => {
        if (!chemical1 || !chemical2) return;
        const c1 = chemical1;
        const c2 = chemical2;
        setActiveReaction(null);
        setLabStatus("idle");
        setTimeout(() => {
            triggerReaction(c1, c2);
        }, 150);
    }, [chemical1, chemical2, triggerReaction]);

    // Phím tắt: T = xem thí nghiệm, L = xóa, D = chuyển chế độ sáng/tối, Esc = đóng
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const key = e.key.toLowerCase();
            if (key === "t") {
                setShowExperiments((prev) => !prev);
            } else if (key === "l") {
                handleClearAll();
            } else if (key === "d") {
                toggleDarkMode();
            } else if (e.key === "Escape") {
                setShowExperiments(false);
                setShowQuiz(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleClearAll, toggleDarkMode]);

    const handleClearSlot = useCallback((slot: 1 | 2) => {
        if (activeReaction) return;
        if (slot === 1) {
            if (chemical2) {
                setChemical1(chemical2);
                setChemical2(null);
            } else {
                setChemical1(null);
            }
        } else {
            setChemical2(null);
        }
    }, [activeReaction, chemical2]);

    const [progress, setProgress] = useState(0);

    // Animate the progress bar while a reaction is running
    useEffect(() => {
        if (labStatus !== "reacting" || !activeReaction) {
            setProgress(0);
            return;
        }
        const maxDuration = Math.max(0, ...activeReaction.result.effects.map((e) => e.duration)) + 1000;
        const update = () => {
            const elapsed = Date.now() - activeReaction.startTime;
            setProgress(Math.min(elapsed / maxDuration, 1));
        };
        update();
        const interval = setInterval(update, 50);
        return () => clearInterval(interval);
    }, [labStatus, activeReaction]);

    // Resolve the combined color for the test tube content
    const getCombinedColor = useCallback(() => {
        if (activeReaction?.result) {
            const colorEffect = activeReaction.result.effects.find((e) => e.type === "color_change");
            if (colorEffect?.targetColor) return colorEffect.targetColor;
        }
        // Mix the two chemical colors
        const c1 = chemical1?.liquidColor || chemical1?.color || "#ffffff";
        const c2 = chemical2?.liquidColor || chemical2?.color || "#ffffff";
        return c1; // use first chemical's color as base
    }, [activeReaction, chemical1, chemical2]);

    const displayChemical = React.useMemo(() => {
        if (!chemical1 && !chemical2) return null;
        if (chemical1 && !chemical2) return chemical1;
        if (!chemical1 && chemical2) return chemical2;
        if (chemical1 && chemical2) {
            const color = getCombinedColor();
            const isLiquid1 = isLiquidState(chemical1.state);
            const isLiquid2 = isLiquidState(chemical2.state);
            const anyLiquid = isLiquid1 || isLiquid2;
            return {
                ...chemical1,
                id: "combined",
                name: `${chemical1.name} + ${chemical2.name}`,
                formula: `${chemical1.formula} + ${chemical2.formula}`,
                liquidColor: color,
                liquidColorEnd: color,
                state: anyLiquid ? ("aqueous" as const) : ("solid" as const),
            } as Chemical;
        }
        return null;
    }, [chemical1, chemical2, getCombinedColor]);

    // Heat a single chemical (combustion / thermal decomposition)
    const handleHeat = useCallback(() => {
        if (!displayChemical || activeReaction) return;
        const result = getHeatingReaction(displayChemical);
        if (!result) return;
        setLabStatus("reacting");
        setActiveReaction({ result, startTime: Date.now() });
        const maxDuration = Math.max(0, ...result.effects.map((e) => e.duration)) + 1000;
        setTimeout(() => setLabStatus("complete"), maxDuration);
        if (result.type === "combustion") {
            setTimeout(() => {
                confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ["#f59e0b", "#ef4444", "#fbbf24"], zIndex: 100 });
            }, 300);
        }
    }, [displayChemical, activeReaction]);

    // Run a guided sample experiment
    const runExperiment = useCallback((exp: Experiment) => {
        handleClearAll();
        setShowExperiments(false);
        const chems = exp.chemicalIds
            .map((id) => getChemicalById(id))
            .filter((c): c is Chemical => c !== undefined && c !== null);
        if (chems.length === 0) return;
        setChemical1(chems[0]);
        triggerPourAnim(chems[0]);
        triggerTransaction(chems[0]);
        if (chems.length > 1) setChemical2(chems[1]);
    }, [handleClearAll, triggerPourAnim, triggerTransaction]);

    // ─── Chế độ bài tập: đọc /lab?assignment=... và tự chạy thí nghiệm được giao ───
    useEffect(() => {
        const assignmentId = searchParams.get("assignment");
        if (!assignmentId) return;
        const a = getAssignmentById(assignmentId);
        if (!a) return;
        setAssignment(a);
        const user = getCurrentUser();
        if (user && user.role === "student") {
            setStudentId(user.id);
            setSubmitted(getSubmission(a.id, user.id));
        }
        const exp = experiments.find((e) => e.id === a.experimentId);
        if (exp) {
            const timer = setTimeout(() => runExperiment(exp), 400);
            return () => clearTimeout(timer);
        }
    }, [searchParams, runExperiment]);

    const hasBothChemicals = chemical1 !== null && chemical2 !== null;
    const hasAnyChemical = chemical1 !== null || chemical2 !== null;

    const activeExperiment = assignment
        ? experiments.find((e) => e.id === assignment.experimentId) ?? null
        : null;

    // ── Chuyển tiếp sang Lab Sinh học 3D chuyên sâu nếu là bài tập Sinh học ──
    if (activeExperiment && activeExperiment.subject === "biology") {
        if (typeof window !== "undefined" && assignment) {
            window.location.href = `/biology?assignment=${assignment.id}`;
        }
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950 text-slate-300">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-emerald-400">Đang chuyển tiếp tới Phòng thí nghiệm Sinh học 3D…</p>
                </div>
            </div>
        );
    }

    // ── Lab đầy đủ cho Vật lý (thay cho "Đang phát triển") ──
    if (activeExperiment && activeExperiment.subject === "physics") {
        return (
            <ScienceLab
                experiment={activeExperiment}
                assignment={assignment}
                studentId={studentId}
                submitted={submitted}
                onSubmit={(score: number, answers: number[], log: string[]) => {
                    if (!assignment || !studentId) return;
                    const quizLen = assignment?.customQuiz?.length || activeExperiment.quiz.length || 1;
                    const sub = submitAssignment({
                        assignmentId: assignment.id,
                        studentId,
                        correctCount: Math.round(score * quizLen / 10),
                        totalQuestions: quizLen,
                        answers,
                        processScore: 10,
                        safetyErrors: [],
                        actionsLog: log,
                    });
                    recordSubmission(studentId, score);
                    setSubmitted(sub);
                }}
            />
        );
    }

    return (
        <div className="relative w-full h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0a0e17] transition-colors duration-300 overflow-hidden">
            {/* Premium Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 dark:bg-purple-600/10 blur-3xl" />
            </div>

            {/* Standardized Lab Header */}
            <LabHeader
                currentSubject="chemistry"
                onTourOpen={() => setTourOpen(true)}
                centerContent={
                    <>
                        {/* Status */}
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    labStatus === "reacting"
                                        ? "bg-blue-500 animate-pulse"
                                        : labStatus === "complete"
                                            ? "bg-green-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                }`}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                {labStatus === "idle"
                                    ? "Sẵn sàng"
                                    : labStatus === "reacting"
                                        ? "Đang phản ứng..."
                                        : "Hoàn thành"}
                            </span>
                        </div>

                        {/* Glassware indicator */}
                        {hasBothChemicals && glassware && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                                <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                    {glasswareNames[glassware]}
                                </span>
                            </div>
                        )}

                        {/* Shortcuts badge */}
                        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700" title="Phím tắt: T = Thí nghiệm, L = Xóa, D = Sáng/Tối, Esc = Đóng">
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 font-mono">T · L · D</span>
                        </div>
                    </>
                }
                rightContent={
                    <div className="flex items-center gap-2">
                        {assignment && (
                            <button
                                onClick={() => setShowQuiz(true)}
                                className="lab-btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                                title="Trả lời câu hỏi và nộp bài"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                                {submitted ? "Xem lại bài" : "Nộp bài"}
                            </button>
                        )}
                        <button onClick={() => setShowExperiments(true)} className="lab-btn px-3 py-1.5 text-xs flex items-center gap-1.5" title="Xem thí nghiệm mẫu (T)">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                            </svg>
                            <span className="hidden sm:inline">Thí nghiệm</span>
                        </button>
                        {hasAnyChemical && !hasBothChemicals && !activeReaction && (
                            <button onClick={handleHeat} className="lab-btn px-3 py-1.5 text-xs flex items-center gap-1.5" title="Đốt nóng hóa chất">
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                </svg>
                                <span className="hidden sm:inline">Đốt nóng</span>
                            </button>
                        )}
                        {hasBothChemicals && !activeReaction && (
                            <button onClick={handleReact} className="lab-btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 shadow-sm">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 18h13.5A2.25 2.25 0 0 0 21 15.75V8.25A2.25 2.25 0 0 0 18.75 6H5.25A2.25 2.25 0 0 0 3 8.25v7.5A2.25 2.25 0 0 0 5.25 18Z" />
                                </svg>
                                <span>Phản ứng</span>
                            </button>
                        )}
                        {hasAnyChemical && (
                            <button
                                onClick={handleClearAll}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                title="Dọn sạch bàn thí nghiệm để bắt đầu bài mới (L)"
                            >
                                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden lg:inline">Xóa bàn</span>
                            </button>
                        )}
                    </div>
                }
            />

            {/* Assignment banner */}
            {assignment && (
                <div className="flex items-center justify-between gap-3 px-5 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                        </svg>
                        <span className="truncate font-semibold">{assignment.title}</span>
                        {submitted && (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">
                                Đã nộp · {submitted.correctCount}/{submitted.totalQuestions} câu đúng
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowQuiz(true)}
                        className="flex-shrink-0 font-semibold inline-flex items-center gap-1 underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-300"
                    >
                        {submitted ? "Xem lại bài làm" : "Nộp bài"}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Mobile Chemical Drawer Toggle Button & Bar (visible only on mobile phones < md) */}
            <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
                >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Mở kho hóa chất</span>
                    <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded-full font-mono font-bold">
                        {[chemical1, chemical2].filter(Boolean).length}/2 đã chọn
                    </span>
                </button>
                {hasAnyChemical && (
                    <button
                        onClick={handleClearAll}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 text-xs font-medium"
                        title="Dọn sạch ống nghiệm"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Chemical Selector Sidebar: Visible side-by-side on iPad (md: 768px+) & Desktop, collapsible in Theater/Focus mode */}
                <div 
                    id="tour-chemical-selector" 
                    className={`${(isTheaterMode || sidebarCollapsed) ? "hidden" : "hidden md:block"} w-64 lg:w-72 xl:w-80 flex-shrink-0 h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300`}
                >
                    <ChemicalSelector
                        onSelect={handleSelectChemical}
                        disabled={!!activeReaction}
                        selectedIds={[chemical1?.id, chemical2?.id].filter(Boolean) as string[]}
                        slot1={chemical1}
                        slot2={chemical2}
                        onReplace={handleReplaceChemical}
                        onReset={handleClearAll}
                        onTouchDragStart={handleTouchDragStart}
                        onTouchDragMove={handleTouchDragMove}
                        onTouchDragEnd={handleTouchDragEnd}
                    />
                </div>

                {/* Drawer (visible on mobile phones OR when sidebar is collapsed/in theater mode on iPad/Desktop) */}
                {mobileSidebarOpen && (
                    <div className="fixed inset-0 z-50 flex">
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                            onClick={() => setMobileSidebarOpen(false)}
                            aria-hidden="true"
                        />
                        <div className="relative z-10 w-[85%] max-w-xs sm:max-w-sm h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-700 animate-in slide-in-from-left duration-200">
                            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                                    <FlaskConical className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Kho hóa chất</span>
                                </span>
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1"
                                    aria-label="Đóng"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Đóng</span>
                                </button>
                            </div>

                            {/* Mobile Drawer Slot Status & Quick Action */}
                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1 truncate max-w-[48%]">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                        <span className="text-gray-400 truncate">{chemical1 ? chemical1.name : "Chất 1: Trống"}</span>
                                    </div>
                                    <div className="flex items-center gap-1 truncate max-w-[48%]">
                                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                        <span className="text-gray-400 truncate">{chemical2 ? chemical2.name : "Chất 2: Trống"}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                                >
                                    {chemical1 && chemical2 ? "Đóng kho để xem phản ứng ngay!" : "Trở về xem ống nghiệm"}
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <ChemicalSelector
                                    onSelect={(chem) => {
                                        handleSelectChemical(chem);
                                        // Auto-close drawer if both chemicals are filled
                                        if (chemical1 && !chemical2) {
                                            setMobileSidebarOpen(false);
                                        }
                                    }}
                                    disabled={!!activeReaction}
                                    selectedIds={[chemical1?.id, chemical2?.id].filter(Boolean) as string[]}
                                    slot1={chemical1}
                                    slot2={chemical2}
                                    onReplace={handleReplaceChemical}
                                    onReset={handleClearAll}
                                    onTouchDragStart={handleTouchDragStart}
                                    onTouchDragMove={handleTouchDragMove}
                                    onTouchDragEnd={handleTouchDragEnd}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Center: Lab Area */}
                <div id="tour-beaker-area" data-drop-zone="beaker" className="flex-1 flex flex-col items-center gap-4 sm:gap-6 overflow-y-auto p-2 sm:p-5 md:p-6 pb-28 custom-scrollbar w-full">
                    {/* Floating Open Chemical Drawer Pill when sidebar is collapsed or in Theater mode */}
                    {(isTheaterMode || sidebarCollapsed) && (
                        <div className="sticky top-1 z-20 flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-top duration-200">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all"
                            >
                                <FlaskConical className="w-3.5 h-3.5" />
                                <span>Mở kho hóa chất</span>
                                <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded-full font-mono">
                                    {[chemical1, chemical2].filter(Boolean).length}/2 đã chọn
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsTheaterMode(false);
                                    setSidebarCollapsed(false);
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-md backdrop-blur transition-all"
                                title="Hiện lại bảng kho bên cạnh"
                            >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Hiện bảng kho bên cạnh</span>
                            </button>
                        </div>
                    )}

                    {/* Lab Bench — Full Width & Spacious for iPad and Desktop */}
                    <div className={`relative w-full transition-all duration-300 ${isTheaterMode ? "max-w-none px-0 sm:px-2" : "max-w-6xl xl:max-w-7xl"}`}>
                        <div
                            data-drop-zone="beaker"
                            className={`bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden p-3 sm:p-6 md:p-8 transition-all duration-300 shadow-sm flex flex-col justify-between ${
                                isTheaterMode ? "min-h-[80vh] sm:min-h-[85vh]" : "min-h-[560px] sm:min-h-[640px] md:min-h-[700px] lg:min-h-[760px]"
                            }`}
                        >
                            {/* Grid background */}
                            <div
                                className="absolute inset-0 opacity-30 pointer-events-none dark:opacity-10"
                                style={{
                                    backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
                                    backgroundSize: "40px 40px",
                                }}
                            />

                            {/* Lab table texture (subtle dark wood grain) */}
                            <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none lab-bench-texture" aria-hidden="true" />

                            {/* Bench Header Toolbar */}
                            <div className="relative z-10 flex items-center justify-between gap-2 pb-3 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                                        Bàn thí nghiệm Hóa học
                                        {isTheaterMode && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold border border-amber-500/30 inline-flex items-center gap-1">
                                                <Maximize2 className="w-3 h-3" />
                                                <span>Chế độ Trình chiếu</span>
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button
                                        onClick={() => setIsTheaterMode(!isTheaterMode)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                                            isTheaterMode
                                                ? "bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-400/50"
                                                : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                        }`}
                                        title={isTheaterMode ? "Thu nhỏ về kích thước chuẩn" : "Phóng to toàn màn hình cho học sinh/khán giả quan sát"}
                                    >
                                        {isTheaterMode ? (
                                            <>
                                                <Minimize2 className="w-3.5 h-3.5" />
                                                <span>Thu nhỏ</span>
                                            </>
                                        ) : (
                                            <>
                                                <Maximize2 className="w-3.5 h-3.5" />
                                                <span>Trình chiếu</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                        className="hidden md:flex px-2.5 py-1.5 rounded-xl text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 items-center gap-1.5 transition-all"
                                        title={sidebarCollapsed ? "Mở kho hóa chất bên cạnh" : "Thu gọn kho hóa chất"}
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        <span>{sidebarCollapsed ? "Mở kho" : "Ẩn kho"}</span>
                                    </button>
                                    {hasAnyChemical && (
                                        <button
                                            onClick={handleClearAll}
                                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 transition-all"
                                            title="Dọn sạch ống nghiệm"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Dọn bàn</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Drop zone — Single test tube area */}
                            <div
                                data-drop-zone="beaker"
                                className={`relative z-10 flex-1 flex flex-col items-center justify-center py-6 sm:py-8 px-4 transition-all duration-200 rounded-xl ${dragOver && !hasAnyChemical
                                    ? "bg-blue-50/50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700"
                                    : ""
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {/* Empty state with drop hint */}
                                {!hasAnyChemical && !dragOver && (
                                    <div className="flex flex-col items-center justify-center gap-4 py-12 sm:py-16 my-auto">
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white dark:bg-gray-800 border-2 border-dashed border-blue-400/50 dark:border-blue-500/40 flex items-center justify-center mb-1 transition-colors duration-200 shadow-sm animate-pulse">
                                            <svg viewBox="0 0 40 60" className="w-16 h-20 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.4}>
                                                <path d="M14 4 L14 40 Q14 52 20 54 Q26 52 26 40 L26 4" />
                                                <rect x="12" y="1" width="16" height="5" rx="1.5" />
                                                <path d="M16 4 L16 38 Q16 48 20 50 Q24 48 24 38 L24 4" opacity="0.3" />
                                                <line x1="15" y1="12" x2="19" y2="12" opacity="0.2" />
                                                <line x1="15" y1="20" x2="19" y2="20" opacity="0.2" />
                                                <line x1="15" y1="28" x2="19" y2="28" opacity="0.2" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-gray-100">Bàn Thí Nghiệm Hóa Học</h3>
                                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg text-center leading-relaxed">
                                            Chọn 2 hóa chất từ kho bên cạnh để hòa trộn vào ống nghiệm và quan sát các hiện tượng phản ứng thực tế!
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                                            <button
                                                onClick={() => setMobileSidebarOpen(true)}
                                                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                                            >
                                                <FlaskConical className="w-4 h-4" />
                                                <span>Mở kho chọn hóa chất</span>
                                            </button>
                                            <button
                                                onClick={() => setShowExperiments(true)}
                                                className="px-5 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs active:scale-95 transition-all"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                <span>Xem thí nghiệm mẫu</span>
                                            </button>
                                            <button
                                                onClick={() => setIsTheaterMode(!isTheaterMode)}
                                                className="px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs active:scale-95 transition-all"
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                                <span>{isTheaterMode ? "Thu nhỏ lại" : "Chế độ Trình chiếu"}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Drag over empty hint */}
                                {!hasAnyChemical && dragOver && (
                                    <div className="flex flex-col items-center gap-2 py-20">
                                        <svg className="w-16 h-16 text-blue-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-3-3m3 3l3-3" />
                                        </svg>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Thả hóa chất vào đây</p>
                                    </div>
                                )}

                                {/* Test tube area — Zoomed and prominent for audience and presentations */}
                                {showTube && (
                                    <div
                                        ref={beakerAreaRef}
                                        className={`flex flex-col items-center gap-4 animate-tube-appear transform origin-center my-6 sm:my-10 transition-transform duration-300 ${
                                            isTheaterMode
                                                ? "scale-150 sm:scale-175 md:scale-190 lg:scale-210"
                                                : "scale-130 sm:scale-140 md:scale-155 lg:scale-170"
                                        }`}
                                    >
                                        <Beaker
                                            chemical={displayChemical}
                                            reaction={activeReaction?.result ?? null}
                                            isReacting={labStatus === "reacting"}
                                            slotNumber={1}
                                            onClear={() => handleClearSlot(1)}
                                            isDragOver={false}
                                            glassware={glassware}
                                            transactionType={txnActive?.type || "none"}
                                            transactionColor={txnActive?.color || "#3b82f6"}
                                            showTransaction={!!txnActive}
                                        />
                                    </div>
                                )}

                                {/* Chemical labels & Action buttons under the tube */}
                                {hasAnyChemical && (
                                    <div className="flex flex-col items-center gap-3.5 mt-6 w-full">
                                        <div className="flex items-center gap-3 flex-wrap justify-center">
                                            {chemical1 && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-xs">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                    {chemical1.name}
                                                </span>
                                            )}
                                            {chemical2 && (
                                                <>
                                                    <span className="text-gray-300 dark:text-gray-600 text-xs font-black">+</span>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-xs">
                                                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                        {chemical2.name}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Thanh điều hướng thao tác: Làm thí nghiệm khác / Làm lại ngay trên bàn */}
                                        <div className="flex items-center gap-2.5 mt-1 flex-wrap justify-center">
                                            <button
                                                onClick={handleClearAll}
                                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all"
                                                title="Dọn sạch bàn thí nghiệm để bắt đầu làm bài thí nghiệm mới"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Làm thí nghiệm khác (Dọn bàn)</span>
                                            </button>

                                            {activeReaction && (
                                                <button
                                                    onClick={handleReplayReaction}
                                                    className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-gray-200 dark:border-gray-600 shadow-xs"
                                                    title="Chạy lại phản ứng này"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                    <span>Làm lại</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setShowExperiments(true)}
                                                className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border border-purple-200 dark:border-purple-800 shadow-xs"
                                                title="Khám phá các bài thí nghiệm mẫu"
                                            >
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>Đổi bài mẫu</span>
                                            </button>
                                        </div>

                                        {/* Scroll hint to video when available */}
                                        {activeReaction?.result?.realVideo && labStatus === "complete" && (
                                            <a
                                                href="#reaction-details-area"
                                                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-bold shadow-sm transition-all animate-bounce"
                                            >
                                                <Video className="w-3.5 h-3.5" />
                                                <span>Kéo xuống dưới để xem Video thí nghiệm thực tế ↓</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pour stream animation */}
                    {pourAnim && pourPos && (
                        <PourStream
                            color={pourAnim.color}
                            isLiquid={pourAnim.isLiquid}
                            position={pourPos}
                            onComplete={handlePourComplete}
                        />
                    )}

                    {/* Progress bar */}
                    {labStatus === "reacting" && (
                        <div className="w-full max-w-lg mx-auto animate-fade-in">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg h-2 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress * 100}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-1.5 px-1">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">Phản ứng đang diễn ra...</p>
                                <p className="text-[10px] font-medium text-blue-500">{Math.round(progress * 100)}%</p>
                            </div>
                        </div>
                    )}

                    {/* No reaction message */}
                    {labStatus === "complete" && !activeReaction && chemical1 && chemical2 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-4 text-center animate-scale-in max-w-sm transition-colors duration-200" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2 border border-amber-200 dark:border-amber-700">
                                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Không có phản ứng</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Giữa <span className="text-blue-600 dark:text-blue-400 font-medium">{chemical1.name}</span> và{" "}
                                <span className="text-purple-600 dark:text-purple-400 font-medium">{chemical2.name}</span>
                            </p>
                            <button onClick={handleClearAll} className="lab-btn mt-3 text-xs">Thử lại</button>
                        </div>
                    )}

                    {/* Reaction Info */}
                    {activeReaction && labStatus === "complete" && (
                        <ReactionInfo
                            reaction={activeReaction.result}
                            onReset={handleClearAll}
                            onReplay={chemical1 && chemical2 ? handleReplayReaction : undefined}
                            onOpenExperiments={() => setShowExperiments(true)}
                        />
                    )}
                </div>
            </div>

            {/* Reaction Effects Overlay */}
            {activeReaction && labStatus === "reacting" && (
                <ReactionEffects reaction={activeReaction.result} slot1={chemical1} slot2={chemical2} />
            )}

            {/* Sample experiments panel */}
            <ExperimentPanel
                open={showExperiments}
                onClose={() => setShowExperiments(false)}
                onRun={runExperiment}
            />

            {/* Assignment quiz overlay */}
            {assignment && showQuiz && activeExperiment && (
                <AssignmentQuiz
                    experiment={activeExperiment}
                    assignmentTitle={assignment.title}
                    studentId={studentId}
                    customQuiz={assignment.customQuiz}
                    onSubmit={(correctCount, totalQuestions, answers) => {
                        if (studentId) {
                            setSubmitted(
                                submitAssignment({
                                    assignmentId: assignment.id,
                                    studentId,
                                    correctCount,
                                    totalQuestions,
                                    answers,
                                    processScore,
                                    safetyErrors,
                                    actionsLog,
                                })
                            );
                            // Gamification: ghi nhận nộp bài → mở khóa huy hiệu
                            const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) / 10 : 0;
                            const { newBadges } = recordSubmission(studentId, score);
                            if (newBadges.length > 0) setNewBadges(newBadges);
                        }
                        setShowQuiz(false);
                    }}
                    onClose={() => setShowQuiz(false)}
                />
            )}

            {/* Safety acknowledgment modal */}
            {safetyModal && (
                <SafetyModal
                    open
                    chemicalName={safetyModal.chemical.name}
                    warnings={[
                        ...(safetyModal.chemical.corrosive ? ["corrosive" as const] : []),
                        ...(safetyModal.chemical.toxic ? ["toxic" as const] : []),
                        ...(safetyModal.chemical.flammable ? ["flammable" as const] : []),
                        ...(safetyModal.chemical.hazardous &&
                            !safetyModal.chemical.corrosive &&
                            !safetyModal.chemical.toxic &&
                            !safetyModal.chemical.flammable
                            ? ["hazardous" as const]
                            : []),
                    ]}
                    onClose={() => setSafetyModal(null)}
                    onAccept={() => {
                        if (safetyModal) {
                            safetyAcceptedRef.current = true;
                            const { slot, chemical } = safetyModal;
                            setSafetyModal(null);
                            placeChemical(slot, chemical);
                        }
                    }}
                />
            )}

            {/* Badge feedback */}
            {newBadges.length > 0 && (
                <div className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-black/40 animate-fade-in">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-2xl shadow-xl p-6 text-center animate-scale-in">
                        <Award className="w-10 h-10 text-amber-500 mx-auto" />
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-2">Bạn đã mở khóa huy hiệu mới!</p>
                        <div className="mt-4 space-y-2">
                            {newBadges.map((b) => (
                                <div
                                    key={b.id}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-left"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{b.label}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{b.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setNewBadges([])}
                            className="lab-btn-primary mt-5 w-full py-2 text-sm"
                        >
                            Tuyệt vời!
                        </button>
                    </div>
                </div>
            )}

            {/* Walkthrough 90s */}
            {showWalkthrough && (
                <div className="fixed inset-0 z-[97] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 animate-scale-in">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                            Hướng dẫn nhanh · Bước {walkthroughStep + 1}/3
                        </p>
                        {walkthroughStep === 0 && (
                            <>
                                <p className="text-base font-bold text-gray-800 dark:text-gray-100 mt-2 flex items-center gap-1.5">
                                    <FlaskConical className="w-4 h-4 text-blue-500" />
                                    <span>Kéo thả hóa chất</span>
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                    Chọn hóa chất ở bảng bên trái và kéo vào 2 vị trí (ống nghiệm). Khi đủ 2 hóa chất,
                                    phản ứng sẽ tự động diễn ra — hãy quan sát hiện tượng!
                                </p>
                            </>
                        )}
                        {walkthroughStep === 1 && (
                            <>
                                <p className="text-base font-bold text-gray-800 dark:text-gray-100 mt-2 flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-amber-500" />
                                    <span>Thử nghiệm tự do</span>
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                    Kéo thả hóa chất và quan sát phản ứng. Nộp bài tập đúng sẽ giúp bạn mở khóa huy hiệu.
                                </p>
                            </>
                        )}
                        {walkthroughStep === 2 && (
                            <>
                                <p className="text-base font-bold text-gray-800 dark:text-gray-100 mt-2 flex items-center gap-1.5">
                                    <Keyboard className="w-4 h-4 text-purple-500" />
                                    <span>Phím tắt</span>
                                </p>
                                <div className="mt-3 space-y-2">
                                    {[
                                        ["T", "Mở bảng thí nghiệm mẫu"],
                                        ["L", "Xóa toàn bộ dụng cụ"],
                                        ["D", "Chuyển chế độ sáng / tối"],
                                        ["Esc", "Đóng cửa sổ bật lên"],
                                    ].map(([key, desc]) => (
                                        <div key={key} className="flex items-center gap-3">
                                            <kbd className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-[11px] font-bold text-gray-600 dark:text-gray-300 min-w-8 text-center">
                                                {key}
                                            </kbd>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setShowWalkthrough(false);
                                    setWalkthroughDone(labUser?.id ?? "guest");
                                }}
                                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                Bỏ qua
                            </button>
                            <button
                                onClick={() => {
                                    if (walkthroughStep < 2) {
                                        setWalkthroughStep((s) => s + 1);
                                    } else {
                                        setShowWalkthrough(false);
                                        setWalkthroughDone(labUser?.id ?? "guest");
                                    }
                                }}
                                className="lab-btn-primary px-5 py-2 text-sm"
                            >
                                {walkthroughStep < 2 ? "Tiếp tục" : "Bắt đầu thí nghiệm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Ghost Badge while dragging chemical with finger */}
            {touchDraggingChem && touchGhostPos && (
                <div 
                    className="fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/95 text-white border-2 border-emerald-400 shadow-2xl backdrop-blur-md animate-pulse"
                    style={{ left: touchGhostPos.x, top: touchGhostPos.y }}
                >
                    <FlaskConical className="w-5 h-5 text-emerald-300" />
                    <div className="text-left">
                        <div className="font-bold text-xs text-emerald-300">{touchDraggingChem.name}</div>
                        <div className="text-[10px] text-slate-300 font-mono">{touchDraggingChem.formula}</div>
                    </div>
                </div>
            )}

            {/* Trợ lý ảo AI Tutor RAG SGK GDPT 2018 */}
            <LabAITutorWidget
                chemical1={chemical1}
                chemical2={chemical2}
                activeReaction={activeReaction}
            />
        </div>
    );
}
