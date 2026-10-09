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

            const maxDuration = Math.max(...result.effects.map((e) => e.duration)) + 1000;
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
        const maxDuration = Math.max(...activeReaction.result.effects.map((e) => e.duration)) + 1000;
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
        const maxDuration = Math.max(...result.effects.map((e) => e.duration)) + 1000;
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

    // ── Lab đầy đủ cho Vật lý / Sinh học (thay cho "Đang phát triển") ──
    if (activeExperiment && (activeExperiment.subject === "biology" || activeExperiment.subject === "physics")) {
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
            {/* Top Bar */}
            <header className="bg-white dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between z-20 flex-shrink-0 transition-colors duration-200 sticky top-0" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04) " }}>
                <div className="flex items-center gap-3">
                    <svg viewBox="0 0 28 28" className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 3v5M16 3v5" strokeLinecap="round" />
                        <path d="M10 10h8M8 14h12M6 18h16" />
                        <path d="M8 10l-2 14h16L20 10H8Z" />
                        <path d="M10 10l-2 14" strokeWidth="0.8" />
                        <path d="M18 10l2 14" strokeWidth="0.8" />
                    </svg>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Simlab Edu</h1>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Nền tảng Giáo dục Kỹ thuật số</p>
                    </div>
                    {assignment && (
                        <Link
                            href="/dashboard/student"
                            className="ml-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors inline-flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            Bài tập
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Status */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        <span
                            className={`w-2 h-2 rounded-full ${labStatus === "reacting"
                                ? "bg-blue-500 animate-pulse"
                                : labStatus === "complete"
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-gray-600"
                                }`}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {labStatus === "idle"
                                ? "Sẵn sàng"
                                : labStatus === "reacting"
                                    ? "Đang phản ứng..."
                                    : "Hoàn thành"}
                        </span>
                    </div>

                    {/* Glassware indicator */}
                    {hasBothChemicals && glassware && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                            <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                            </svg>
                            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                {glasswareNames[glassware]}
                            </span>
                        </div>
                    )}

                    {/* Phím tắt */}
                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600" title="Phím tắt: T = Thí nghiệm, L = Xóa, D = Sáng/Tối, Esc = Đóng">
                        <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                        </svg>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">T · L · D</span>
                    </div>

                    {/* Buttons */}
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
                        <button onClick={() => setShowExperiments(true)} className="lab-btn px-3 py-1.5 text-xs flex items-center gap-1" title="Xem thí nghiệm mẫu">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                            </svg>
                            Thí nghiệm
                        </button>
                        {hasAnyChemical && !hasBothChemicals && !activeReaction && (
                            <button onClick={handleHeat} className="lab-btn px-3 py-1.5 text-xs flex items-center gap-1" title="Đốt nóng hóa chất">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a5.25 5.25 0 0 0 5.25-5.25c0-1.77-1.13-3.06-2.25-4.5-.75-.96-1.5-2.06-1.5-3.75 0-1.2.36-2.07.75-3-1.2.3-2.85 1.5-3.75 3-1.2 2.01-1.5 3.94-1.5 5.25A5.25 5.25 0 0 0 12 21Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a5.25 5.25 0 0 1-5.25-5.25c0-1.77 1.13-3.06 2.25-4.5.75-.96 1.5-2.06 1.5-3.75 0-1.2-.36-2.07-.75-3-1.2.3-2.85 1.5-3.75 3-1.2 2.01-1.5 3.94-1.5 5.25A5.25 5.25 0 0 1 12 21Z" />
                                </svg>
                                Đốt nóng
                            </button>
                        )}
                        {hasBothChemicals && !activeReaction && (
                            <button onClick={handleReact} className="lab-btn-primary px-4 py-1.5 text-xs flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 18h13.5A2.25 2.25 0 0 0 21 15.75V8.25A2.25 2.25 0 0 0 18.75 6H5.25A2.25 2.25 0 0 0 3 8.25v7.5A2.25 2.25 0 0 0 5.25 18Z" />
                                </svg>
                                Phản ứng
                            </button>
                        )}
                        {hasAnyChemical && (
                            <button onClick={handleClearAll} className="lab-btn-danger px-3 py-1.5 text-xs flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                Xóa
                            </button>
                        )}
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
                        >
                            {isDark ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </header>

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

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Chemical Selector */}
                <div className="w-72 flex-shrink-0 h-full border-r border-gray-200 dark:border-gray-700">
                    <ChemicalSelector
                        onSelect={handleSelectChemical}
                        disabled={!!activeReaction}
                        selectedIds={[chemical1?.id, chemical2?.id].filter(Boolean) as string[]}
                        slot1={chemical1}
                        slot2={chemical2}
                        onReplace={handleReplaceChemical}
                    />
                </div>

                {/* Center: Lab Area */}
                <div className="flex-1 flex flex-col items-center gap-4 overflow-y-auto p-6">
                    {/* Lab Bench */}
                    <div className="relative w-full max-w-3xl">
                        <div
                            className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-6 transition-colors duration-200"
                            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
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

                            {/* Drop zone — Single test tube area */}
                            <div
                                className={`relative z-10 flex flex-col items-center justify-center py-6 px-4 min-h-[300px] transition-all duration-200 rounded-xl ${dragOver && !hasAnyChemical
                                    ? "bg-blue-50/50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700"
                                    : ""
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {/* Empty state with drop hint */}
                                {!hasAnyChemical && !dragOver && (
                                    <div className="flex flex-col items-center gap-3 py-8">
                                        <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-1 transition-colors duration-200" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                                            <svg viewBox="0 0 40 60" className="w-10 h-14 text-blue-400/70" fill="none" stroke="currentColor" strokeWidth="1.2">
                                                <path d="M14 4 L14 40 Q14 52 20 54 Q26 52 26 40 L26 4" />
                                                <rect x="12" y="1" width="16" height="5" rx="1.5" />
                                                <path d="M16 4 L16 38 Q16 48 20 50 Q24 48 24 38 L24 4" opacity="0.3" />
                                                <line x1="15" y1="12" x2="19" y2="12" opacity="0.2" />
                                                <line x1="15" y1="20" x2="19" y2="20" opacity="0.2" />
                                                <line x1="15" y1="28" x2="19" y2="28" opacity="0.2" />
                                            </svg>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Chào mừng đến với Simlab</h3>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md text-center leading-relaxed">
                                            Kéo thả hóa chất từ kho bên trái vào đây để khám phá các phản ứng hóa học thú vị!
                                        </p>
                                        <div className="flex items-center justify-center gap-4 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 6-6-6-6m9 12h9" />
                                                </svg>
                                                Kéo thả
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
                                                </svg>
                                                Click chọn
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                                Quan sát
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Drag over empty hint */}
                                {!hasAnyChemical && dragOver && (
                                    <div className="flex flex-col items-center gap-2 py-12">
                                        <svg className="w-12 h-12 text-blue-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-3-3m3 3l3-3" />
                                        </svg>
                                        <p className="text-sm font-medium text-blue-500 dark:text-blue-400">Thả hóa chất vào đây</p>
                                    </div>
                                )}

                                {/* Test tube area — shown when chemical is added */}
                                {showTube && (
                                    <div ref={beakerAreaRef} className="flex flex-col items-center gap-3 animate-tube-appear">
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

                                {/* Chemical labels under the tube */}
                                {hasAnyChemical && (
                                    <div className="flex items-center gap-3 mt-4">
                                        {chemical1 && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                {chemical1.name}
                                            </span>
                                        )}
                                        {chemical2 && (
                                            <>
                                                <span className="text-gray-300 dark:text-gray-600 text-xs">+</span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                    {chemical2.name}
                                                </span>
                                            </>
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
                        <ReactionInfo reaction={activeReaction.result} />
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
                        <p className="text-3xl">🏅</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-2">Bạn đã mở khóa huy hiệu mới!</p>
                        <div className="mt-4 space-y-2">
                            {newBadges.map((b) => (
                                <div
                                    key={b.id}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-left"
                                >
                                    <span className="text-2xl">{b.icon}</span>
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
                                <p className="text-base font-bold text-gray-800 dark:text-gray-100 mt-2">🧪 Kéo thả hóa chất</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                    Chọn hóa chất ở bảng bên trái và kéo vào 2 vị trí (ống nghiệm). Khi đủ 2 hóa chất,
                                    phản ứng sẽ tự động diễn ra — hãy quan sát hiện tượng!
                                </p>
                            </>
                        )}
                        {walkthroughStep === 1 && (
                            <>
                                <p className="text-base font-bold text-gray-800 dark:text-gray-100 mt-2">🔥 Thử nghiệm tự do</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                    Kéo thả hóa chất và quan sát phản ứng. Nộp bài tập đúng sẽ giúp bạn mở khóa huy hiệu.
                                </p>
                            </>
                        )}
                        {walkthroughStep === 2 && (
                            <>
                                <p className="text-base font-bold text-gray-800 dark:text-gray-100 mt-2">⌨️ Phím tắt</p>
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
        </div>
    );
}
