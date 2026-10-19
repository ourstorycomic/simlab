"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Footer, { LogoMark } from "@/components/Footer";
import confetti from "canvas-confetti";
import { sound } from "@/lib/gameSound";
import {
  EQUATION_DATABASE,
  EquationItem,
  RANK_TIERS,
  getGameRound,
  getRankTier,
} from "@/lib/equationGameData";
import {
  DEFAULT_LEADERBOARD,
  LeaderboardEntry,
  getLocalLeaderboard,
  saveLocalScore,
  DEFAULT_XP_LEADERBOARD,
  XpLeaderboardEntry,
} from "@/lib/leaderboardStorage";
import {
  getCurrentUser,
  addActivity,
  initStore,
  User,
  getProgress,
  getLevel,
  getLevelTitle,
  UserProgress,
  getUsers,
} from "@/lib/storage";

export type GameMode = "blitz" | "campaign" | "survival";
export type LeaderboardTab = GameMode | "xp";

// ─── Component hiển thị Công thức Hóa học Chuẩn Đẹp (Subscripts <sub> thật, không lỗi font) ───
export function FormulaDisplay({
  formula,
  className = "",
}: {
  formula: string;
  className?: string;
}) {
  const subMap: Record<string, string> = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
    "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  };

  let formatted = formula.replace(/([₀-₉])/g, (_, m) => `<sub>${subMap[m]}</sub>`);
  formatted = formatted.replace(
    /↑/g,
    '<span class="inline-block text-emerald-400 font-black ml-1 text-xs px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">↑ khí</span>'
  );
  formatted = formatted.replace(
    /↓/g,
    '<span class="inline-block text-amber-400 font-black ml-1 text-xs px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">↓ tủa</span>'
  );
  formatted = formatted.replace(
    /(\((?:loãng|đặc|khí|rắn|dd)\))/g,
    '<span class="text-slate-400 text-xs font-normal ml-1 italic">$1</span>'
  );

  return (
    <span
      className={`font-sans font-bold tracking-tight inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  );
}

// ─── Bộ Icon SVG Tối Giản, Hiện Đại (Chuẩn UI Chuyên Nghiệp) ───
function IconClock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconFlame({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
    </svg>
  );
}

function IconTrophy({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
      <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function IconShield({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconTarget({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="6" r="6" />
      <circle cx="12" cy="2" r="2" />
    </svg>
  );
}

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconVolume({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function IconVolumeOff({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.11 1.23" />
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    </svg>
  );
}

function IconBeaker({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3h15" />
      <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" />
      <path d="M6 14h12" />
    </svg>
  );
}

function IconAward({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function IconArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconRotateCcw({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function IconShare({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconLayers({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconInfo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconHeart({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function IconPhysics({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function IconBiology({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
    </svg>
  );
}

function IconZap({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export default function EquationMinigame() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [playerName, setPlayerName] = useState<string>("");
  const [playerSchool, setPlayerSchool] = useState<string>("");

  const [mode, setMode] = useState<GameMode>("blitz");
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [gameState, setGameState] = useState<"lobby" | "playing" | "gameover">("lobby");
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [lives, setLives] = useState<number>(3);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(1);
  const [campaignGrade, setCampaignGrade] = useState<number>(8);

  const [leftItems, setLeftItems] = useState<{ id: string; formula: string }[]>([]);
  const [rightItems, setRightItems] = useState<{ id: string; formula: string }[]>([]);
  const [equationsMap, setEquationsMap] = useState<Record<string, EquationItem>>({});
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [errorShakeId, setErrorShakeId] = useState<string | null>(null);
  const [justMatchedItem, setJustMatchedItem] = useState<EquationItem | null>(null);
  const [floatingScore, setFloatingScore] = useState<{ text: string; isPenalty?: boolean } | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>("blitz");
  const [leaderboardGradeFilter, setLeaderboardGradeFilter] = useState<number>(0);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const leftPortRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rightPortRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [portCoords, setPortCoords] = useState<{
    left: Record<string, { x: number; y: number }>;
    right: Record<string, { x: number; y: number }>;
  }>({ left: {}, right: {} });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionUsedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    const initPlayerSession = async () => {
      // 1. Kiểm tra nhanh user từ cache
      let u = getCurrentUser();
      if (!u) {
        try {
          await initStore();
          u = getCurrentUser();
        } catch (e) {}
      }

      if (isMounted) {
        if (u) {
          setCurrentUser(u);
          setPlayerName(u.name);
          setPlayerSchool(u.school || "SimLab Edu");
          setUserProgress(getProgress(u.id));
        } else {
          setCurrentUser(null);
          setPlayerName("Khách chơi thử");
          setPlayerSchool("");
          setUserProgress(null);
        }
      }
    };

    initPlayerSession();
    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await fetch("/api/minigame/leaderboard");
      if (res.ok) {
        const data = await res.json();
        if (data.scores && data.scores.length > 0) {
          setLeaderboard(data.scores);
          return;
        }
      }
    } catch (e) {}
    setLeaderboard(getLocalLeaderboard());
  };

  useEffect(() => {
    sound.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Đóng bảng xếp hạng khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && leaderboardOpen) {
        setLeaderboardOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leaderboardOpen]);

  // Cập nhật tọa độ cổng nối cho các tia laser SVG (chính xác từng pixel)
  const updatePortPositions = useCallback(() => {
    if (!arenaRef.current) return;
    requestAnimationFrame(() => {
      if (!arenaRef.current) return;
      const arenaRect = arenaRef.current.getBoundingClientRect();

      const leftPorts: Record<string, { x: number; y: number }> = {};
      const rightPorts: Record<string, { x: number; y: number }> = {};

      leftPortRefs.current.forEach((el, id) => {
        if (el && arenaRef.current) {
          const r = el.getBoundingClientRect();
          leftPorts[id] = {
            x: r.left + r.width / 2 - arenaRect.left,
            y: r.top + r.height / 2 - arenaRect.top,
          };
        }
      });

      rightPortRefs.current.forEach((el, id) => {
        if (el && arenaRef.current) {
          const r = el.getBoundingClientRect();
          rightPorts[id] = {
            x: r.left + r.width / 2 - arenaRect.left,
            y: r.top + r.height / 2 - arenaRect.top,
          };
        }
      });

      // Bảo toàn và gộp tọa độ để dây nối không bao giờ bị biến mất
      setPortCoords((prev) => ({
        left: { ...prev.left, ...leftPorts },
        right: { ...prev.right, ...rightPorts },
      }));
    });
  }, []);

  useEffect(() => {
    updatePortPositions();
    const handleResize = () => updatePortPositions();
    window.addEventListener("resize", handleResize);

    let ro: ResizeObserver | null = null;
    if (arenaRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updatePortPositions());
      ro.observe(arenaRef.current);
    }

    const t1 = setTimeout(updatePortPositions, 50);
    const t2 = setTimeout(updatePortPositions, 150);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (ro) ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updatePortPositions, gameState, matchedIds, justMatchedItem]);

  const startNewRound = useCallback(
    (gradeToUse: number) => {
      const { leftList, rightList, equations } = getGameRound({
        grade: gradeToUse,
        count: 5,
        excludeIds: sessionUsedIdsRef.current,
      });

      // Ghi nhớ các ID đã xuất hiện trong ván này để không bao giờ bị lặp lại
      leftList.forEach((item) => sessionUsedIdsRef.current.add(item.id));

      leftPortRefs.current.clear();
      rightPortRefs.current.clear();
      setLeftItems(leftList);
      setRightItems(rightList);
      setEquationsMap(equations);
      setMatchedIds(new Set());
      setSelectedLeft(null);
      setSelectedRight(null);
      setTimeout(updatePortPositions, 50);
    },
    [updatePortPositions]
  );

  const handleStartGame = (chosenMode: GameMode = mode) => {
    // Reset bộ nhớ câu hỏi cho ván chơi mới
    sessionUsedIdsRef.current = new Set();

    setMode(chosenMode);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setJustMatchedItem(null);
    setPlayerRank(null);

    const initialGrade = chosenMode === "campaign" ? 8 : selectedGrade;
    setCampaignGrade(initialGrade);
    setCurrentRoundIdx(1);

    if (chosenMode === "blitz") {
      setTimeLeft(60);
    } else if (chosenMode === "survival") {
      setLives(3);
      setTimeLeft(999);
    } else {
      setTimeLeft(90);
    }

    startNewRound(initialGrade);
    setGameState("playing");
    setLeaderboardOpen(false);
    sound.playSelect();
  };

  useEffect(() => {
    if (gameState !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (mode === "survival") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 10 && prev > 1) {
          sound.playTick();
        }
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, mode]);

  const handleGameOver = useCallback(() => {
    setGameState("gameover");
    if (timerRef.current) clearInterval(timerRef.current);

    sound.playVictory();

    try {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
      });
    } catch (e) {}

    const totalAnswers = correctCount + wrongCount;
    const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 100;

    const finalUserName = currentUser ? currentUser.name : (playerName || "Khách chơi thử");
    const finalUserSchool = currentUser ? (currentUser.school || "SimLab Edu") : (playerSchool || "Khách");
    const finalAvatarColor = currentUser?.avatarColor || "#2563eb";
    const finalAvatarIcon = currentUser?.avatarIcon || (currentUser?.role === "teacher" ? "GV" : "HS");

    const result = saveLocalScore({
      userId: currentUser?.id,
      userName: finalUserName,
      userSchool: finalUserSchool,
      avatarColor: finalAvatarColor,
      avatarIcon: finalAvatarIcon,
      score,
      maxCombo,
      accuracy,
      matchesCount: correctCount,
      mode,
      grade: selectedGrade,
    });

    setPlayerRank(result.rank);

    // Gửi điểm thật lên Supabase Leaderboard
    fetch("/api/minigame/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser?.id || null,
        userName: finalUserName,
        userSchool: finalUserSchool,
        avatarColor: finalAvatarColor,
        avatarIcon: finalAvatarIcon,
        score,
        maxCombo,
        accuracy,
        matchesCount: correctCount,
        mode,
        grade: selectedGrade,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadLeaderboard();
        }
      })
      .catch(() => {});

    // Cộng XP trực tiếp vào hồ sơ học sinh / giáo viên thật
    const xpCalculated = Math.round(score / 15) + correctCount * 5;
    setEarnedXp(xpCalculated);

    if (currentUser) {
      try {
        addActivity(
          currentUser.id,
          "reaction",
          `Minigame Nối Phương Trình: ${score} điểm`,
          xpCalculated,
          `Hoàn thành ${correctCount} phương trình, Max combo ${maxCombo}x`
        );
        setUserProgress(getProgress(currentUser.id));
      } catch (e) {}
    }
  }, [correctCount, wrongCount, currentUser, playerName, playerSchool, score, maxCombo, mode, selectedGrade]);

  const handleSelectLeft = (id: string) => {
    if (isLocked) return;
    if (matchedIds.has(id)) return;
    sound.playSelect();

    if (selectedRight) {
      checkMatch(id, selectedRight);
    } else {
      setSelectedLeft((prev) => (prev === id ? null : id));
    }
  };

  const handleSelectRight = (id: string) => {
    if (isLocked) return;
    if (matchedIds.has(id)) return;
    sound.playSelect();

    if (selectedLeft) {
      checkMatch(selectedLeft, id);
    } else {
      setSelectedRight((prev) => (prev === id ? null : id));
    }
  };

  const checkMatch = (leftId: string, rightId: string) => {
    if (isLocked) return;
    const isCorrect = leftId === rightId;

    if (isCorrect) {
      const eq = equationsMap[leftId];
      setJustMatchedItem(eq);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setCorrectCount((prev) => prev + 1);

      const multiplier = nextCombo >= 10 ? 3.0 : nextCombo >= 6 ? 2.0 : nextCombo >= 3 ? 1.5 : 1.0;
      const pointsEarned = Math.round((eq?.points || 100) * multiplier);
      setScore((prev) => prev + pointsEarned);

      setFloatingScore({
        text: `+${pointsEarned}đ! ${nextCombo >= 2 ? `🔥 ${nextCombo}x Combo` : ""}`,
      });
      setTimeout(() => setFloatingScore(null), 900);

      if (nextCombo === 5 || nextCombo === 10) {
        sound.playComboFire();
      } else {
        sound.playMatchSuccess(nextCombo);
      }

      if (mode === "blitz") {
        setTimeLeft((prev) => Math.min(prev + 3, 90));
      }

      setMatchedIds((prev) => {
        const next = new Set(prev);
        next.add(leftId);
        return next;
      });

      setSelectedLeft(null);
      setSelectedRight(null);
      setTimeout(updatePortPositions, 30);

      const nextCount = matchedIds.size + 1;
      if (nextCount >= leftItems.length) {
        setTimeout(() => {
          if (mode === "campaign") {
            if (campaignGrade < 12) {
              const nextGrade = campaignGrade + 1;
              setCampaignGrade(nextGrade);
              setCurrentRoundIdx((prev) => prev + 1);
              setTimeLeft((prev) => prev + 30);
              startNewRound(nextGrade);
            } else {
              handleGameOver();
            }
          } else {
            setCurrentRoundIdx((prev) => prev + 1);
            startNewRound(selectedGrade);
          }
        }, 700);
      }
    } else {
      // ─── CHỐNG ĐOÁN BỪA / NỐI BỪA (ANTI-SPAM COOLDOWN) ───
      sound.playError();
      setErrorShakeId(`${leftId}-${rightId}`);
      setIsLocked(true); // Khóa tạm thời không cho bấm spam liên tục

      setCombo(0);
      setWrongCount((prev) => prev + 1);

      // Phạt trừ 40 điểm
      setScore((prev) => Math.max(0, prev - 40));

      // Phạt trừ 5 giây trong chế độ Đua Tốc Độ
      if (mode === "blitz") {
        setTimeLeft((prev) => Math.max(0, prev - 5));
        setFloatingScore({
          text: `-5s ⏱️ Nối sai phản ứng (-40đ)`,
          isPenalty: true,
        });
      } else {
        setFloatingScore({
          text: `Sai chất phản ứng (-40đ)`,
          isPenalty: true,
        });
      }
      setTimeout(() => setFloatingScore(null), 900);

      if (mode === "survival") {
        const nextLives = lives - 1;
        setLives(nextLives);
        if (nextLives <= 0) {
          handleGameOver();
        }
      }

      // Khóa 600ms chống spam click, xóa lựa chọn để người chơi chọn lại
      setTimeout(() => {
        setErrorShakeId(null);
        setSelectedLeft(null);
        setSelectedRight(null);
        setIsLocked(false);
      }, 600);
    }
  };

  const currentRankTier = useMemo(() => getRankTier(score), [score]);

  // Đối thủ đang bám đuổi (Top 1)
  const topLeader = useMemo(() => leaderboard[0] || DEFAULT_LEADERBOARD[0], [leaderboard]);
  const targetLeaderScore = Math.max(topLeader?.score || 4350, 500);
  const progressToTop = Math.min(100, Math.round((score / targetLeaderScore) * 100));

  const handleShareChallenge = () => {
    const text = `🔥 Tôi vừa ghi được ${score} điểm trong Đấu Trường Nối Phương Trình Hóa Học trên SimLab Edu! Danh hiệu: ${currentRankTier.badge} ${currentRankTier.title}. Hãy thử vượt kỷ lục của tôi tại: https://simlab.vercel.app/minigame`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const xpLeaderboard = useMemo(() => {
    const list: XpLeaderboardEntry[] = [...DEFAULT_XP_LEADERBOARD];

    try {
      const realUsers = getUsers();
      for (const u of realUsers) {
        if (u.role === "teacher") continue;
        const p = getProgress(u.id);
        const userLevel = getLevel(p.xp);
        const existingIdx = list.findIndex(
          (item) => item.userId === u.id || item.userName.trim().toLowerCase() === u.name.trim().toLowerCase()
        );
        const entry: XpLeaderboardEntry = {
          id: `xp-user-${u.id}`,
          userId: u.id,
          userName: u.name,
          userSchool: u.school || "SimLab Edu",
          avatarColor: u.avatarColor || "#2563eb",
          avatarIcon: u.avatarIcon || "HS",
          xp: p.xp,
          level: userLevel.level,
          streak: p.streak || 0,
        };
        if (existingIdx >= 0) {
          list[existingIdx] = entry;
        } else if (p.xp > 0 || u.id === currentUser?.id) {
          list.push(entry);
        }
      }
    } catch (e) {}

    if (currentUser && !list.some((item) => item.userId === currentUser.id)) {
      const p = userProgress || getProgress(currentUser.id);
      list.push({
        id: `xp-current-${currentUser.id}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userSchool: currentUser.school || "SimLab Edu",
        avatarColor: currentUser.avatarColor || "#2563eb",
        avatarIcon: currentUser.avatarIcon || "HS",
        xp: p.xp,
        level: getLevel(p.xp).level,
        streak: p.streak || 0,
      });
    }

    return list.sort((a, b) => b.xp - a.xp);
  }, [currentUser, userProgress]);

  const filteredLeaderboard = useMemo(() => {
    if (leaderboardTab === "xp") return [];
    let list = leaderboard.filter((item) => (item.mode || "blitz") === leaderboardTab);
    if (leaderboardGradeFilter > 0) {
      list = list.filter((item) => item.grade === 0 || item.grade === leaderboardGradeFilter);
    }
    return list;
  }, [leaderboard, leaderboardTab, leaderboardGradeFilter]);

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#070b14] text-slate-100 select-none overflow-x-hidden">
      {/* ─── VÙNG GLOW KHÔNG GIAN PHÒNG LAB ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ─── TOP COCKPIT BAR (HEADER TRÀN VIỀN) ─── */}
      <header className="relative z-30 h-16 px-3 sm:px-6 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between shrink-0">
        {/* Brand & Subject Switcher Tabs */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <LogoMark className="w-7 h-7 sm:w-8 sm:h-8" />
            <div className="hidden xl:block">
              <span className="font-bold text-white text-base tracking-tight group-hover:text-blue-400 transition-colors">
                Simlab Edu
              </span>
              <p className="text-[10px] text-slate-400 leading-none">Phòng thực hành ảo</p>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Subject Switcher Tabs (Hóa học, Vật lý, Sinh học, Nối phương trình) */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <Link
              href="/lab"
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all border border-transparent"
              title="Phòng thí nghiệm Hóa học ảo"
            >
              <IconBeaker className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Hóa học</span>
            </Link>

            <Link
              href="/physics"
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all border border-transparent"
              title="Phòng thực hành Vật lý ảo"
            >
              <IconPhysics className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Vật lý</span>
            </Link>

            <Link
              href="/biology"
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all border border-transparent"
              title="Mô hình Sinh học 3D"
            >
              <IconBiology className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Sinh học</span>
            </Link>

            <Link
              href="/minigame"
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-xs"
              title="Bài tập Ghép nối Phương trình Hóa học"
            >
              <IconTarget className="w-3.5 h-3.5 text-blue-400" />
              <span>Nối phương trình</span>
            </Link>
          </nav>
        </div>

        {/* HUD Chỉ số trung tâm (Khi đang làm bài) */}
        {gameState === "playing" && (
          <div className="flex items-center gap-3 sm:gap-5 bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2 shadow-inner">
            {/* Điểm số */}
            <div className="flex items-center gap-2">
              <IconTrophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block leading-none">Điểm</span>
                <span className="text-sm sm:text-base font-bold text-amber-300 leading-none">{score}</span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            {/* Chuỗi đúng liên tiếp */}
            <div className="flex items-center gap-1.5">
              <IconFlame className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block leading-none">Chuỗi</span>
                <span className={`text-sm sm:text-base font-bold leading-none ${combo >= 5 ? "text-orange-400" : "text-slate-200"}`}>
                  {combo}x
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            {/* Độ chính xác */}
            <div className="hidden md:flex items-center gap-1.5">
              <IconTarget className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block leading-none">Chính xác</span>
                <span
                  className={`text-sm sm:text-base font-bold leading-none ${
                    (correctCount + wrongCount === 0)
                      ? "text-slate-300"
                      : Math.round((correctCount / (correctCount + wrongCount)) * 100) < 60
                      ? "text-rose-400"
                      : Math.round((correctCount / (correctCount + wrongCount)) * 100) < 80
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {correctCount + wrongCount === 0 ? "100%" : `${Math.round((correctCount / (correctCount + wrongCount)) * 100)}%`}
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-800" />

            {/* Thời gian hoặc Mạng */}
            {mode === "survival" ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mr-1">Lượt:</span>
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <IconHeart
                      key={i}
                      className={`w-3.5 h-3.5 ${i < lives ? "text-rose-500" : "text-slate-700"}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <IconClock className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block leading-none">Thời gian</span>
                  <span className={`text-sm sm:text-base font-bold leading-none ${timeLeft <= 10 ? "text-rose-400 animate-pulse" : "text-cyan-400"}`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right utility buttons */}
        <div className="flex items-center gap-2.5">
          {/* Nút Bảng Xếp Hạng */}
          <button
            id="btn-leaderboard"
            onClick={() => {
              if (!leaderboardOpen) {
                setLeaderboardTab(mode);
              }
              setLeaderboardOpen(!leaderboardOpen);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              leaderboardOpen
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800"
            }`}
          >
            <IconTrophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Bảng xếp hạng</span>
          </button>

          {/* Âm thanh */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <IconVolume className="w-4 h-4" /> : <IconVolumeOff className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User profile chip ở góc trên */}
          {currentUser ? (
            <Link
              href={currentUser.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student"}
              title="Xem hồ sơ học bạ và điểm tích lũy"
              className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800 hover:opacity-85 transition-opacity"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                style={{ backgroundColor: currentUser.avatarColor || "#2563eb" }}
              >
                {currentUser.name ? currentUser.name.split(" ").slice(-1)[0][0] : "U"}
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-white leading-tight">{currentUser.name}</span>
                  {userProgress && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <IconZap className="w-2.5 h-2.5 text-amber-400" />
                      {userProgress.xp} XP
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 leading-none">
                  {currentUser.role === "teacher"
                    ? "Giáo viên"
                    : `Cấp ${userProgress ? getLevel(userProgress.xp).level : 1} • Học sinh`}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* ─── VÙNG NỘI DUNG CHÍNH (FULL VIEWPORT) ─── */}
      <main className="relative z-10 flex-1 w-full p-3 sm:p-6 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
        {/* MÀN HÌNH 1: SẢNH CHỜ (LOBBY HIỆN ĐẠI) */}
        {gameState === "lobby" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-2 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium mb-3 shadow-sm">
              <IconBeaker className="w-3.5 h-3.5 text-blue-400" />
              <span>Thực hành Hóa học Tương tác • GDPT 2018</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2.5 text-white">
              Ghép Nối Phương Trình Phản Ứng
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mb-6 leading-relaxed">
              Rèn luyện kỹ năng nhận diện chất phản ứng, xác định sản phẩm tạo thành và ghi nhớ hiện tượng thí nghiệm thực tế theo phương pháp phản xạ trực quan.
            </p>

            {/* THẺ ĐẤU THỦ CHÍNH CHỦ (TÀI KHOẢN HỆ THỐNG XÁC THỰC) */}
            {currentUser ? (
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 text-left flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center gap-3.5 w-full md:w-auto">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-md text-white font-bold"
                    style={{ backgroundColor: currentUser.avatarColor || "#2563eb" }}
                  >
                    {currentUser.name ? currentUser.name.split(" ").slice(-1)[0][0] : "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold text-white">{currentUser.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {currentUser.role === "teacher" ? "Giáo viên" : "Học sinh"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <IconCheck className="w-3 h-3" />
                        Tài khoản xác thực
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Đơn vị: <strong className="text-slate-100">{currentUser.school || "SimLab Edu"}</strong> • <span className="text-slate-400 font-mono text-[11px]">{currentUser.email}</span>
                    </p>
                  </div>
                </div>

                {/* Khối hiển thị Điểm Kinh Nghiệm (XP) & Cấp Độ */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 justify-between md:justify-end">
                  {userProgress && (
                    <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Kinh nghiệm tích lũy</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <IconZap className="w-4 h-4 text-amber-400" />
                          <span className="text-base font-extrabold text-amber-300">{userProgress.xp}</span>
                          <span className="text-[11px] text-slate-400 font-semibold">XP</span>
                        </div>
                      </div>
                      <div className="h-7 w-px bg-slate-800" />
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Cấp bậc</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-blue-400">
                            Cấp {getLevel(userProgress.xp).level}
                          </span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            · {getLevelTitle(getLevel(userProgress.xp).level)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:items-end text-xs">
                    <Link
                      href={currentUser.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student"}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <span>Hồ sơ & Học bạ</span>
                      <IconArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href="/"
                      className="text-[11px] text-slate-500 hover:text-slate-400 underline transition-colors mt-1"
                    >
                      Đổi tài khoản
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 text-left flex flex-col sm:flex-row gap-4 items-center justify-between shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <IconInfo className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Bạn chưa đăng nhập tài khoản SimLab</h4>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                      Đăng nhập để kết quả thực hành được ghi nhận vào học bạ số và tích lũy XP thăng cấp.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Link
                    href="/"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Đăng nhập</span>
                  </Link>
                  <button
                    onClick={() => {
                      setPlayerName("Khách chơi thử");
                      setPlayerSchool("Chơi thử");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                  >
                    Làm bài thử (Khách)
                  </button>
                </div>
              </div>
            )}

            {/* 1. Chọn chế độ luyện tập */}
            <div className="w-full mb-6 text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                1. Chọn chế độ luyện tập:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <button
                  onClick={() => setMode("blitz")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === "blitz"
                      ? "bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/40 text-white shadow-md shadow-blue-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                      <IconClock className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">60 giây</span>
                  </div>
                  <div className="font-semibold text-sm text-white mb-1">Phản xạ tính giờ</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Mỗi phương trình đúng được cộng <strong className="text-blue-400">+3s</strong>. Ghép sai bị trừ 5s để rèn phản xạ nhanh.
                  </div>
                </button>

                <button
                  onClick={() => setMode("campaign")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === "campaign"
                      ? "bg-purple-600/10 border-purple-500 ring-1 ring-purple-500/40 text-white shadow-md shadow-purple-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                      <IconLayers className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Lớp 8 - 12</span>
                  </div>
                  <div className="font-semibold text-sm text-white mb-1">Lộ trình theo khối lớp</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Thử thách liên hoàn qua 5 ải từ <strong className="text-purple-400">Lớp 8 đến Lớp 12</strong> bám sát SGK GDPT 2018.
                  </div>
                </button>

                <button
                  onClick={() => setMode("survival")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === "survival"
                      ? "bg-emerald-600/10 border-emerald-500 ring-1 ring-emerald-500/40 text-white shadow-md shadow-emerald-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <IconShield className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Tối đa 3 lỗi</span>
                  </div>
                  <div className="font-semibold text-sm text-white mb-1">Rèn luyện độ chuẩn xác</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Không giới hạn thời gian. Ghép sai quá 3 lần sẽ kết thúc bài để rèn tính cẩn trọng.
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Chọn khối lớp kiến thức */}
            <div className="w-full mb-8 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  2. Chọn khối lớp kiến thức:
                </span>
                {mode === "campaign" && (
                  <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/30 w-fit">
                    Lộ trình tự động: Lớp 8 ➔ Lớp 12
                  </span>
                )}
              </div>

              {mode === "campaign" ? (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <IconLayers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-purple-200">
                        Lộ trình Vượt Ải Cấp Lớp Tự Động
                      </div>
                      <div className="text-xs text-purple-400/80 mt-0.5">
                        Ải 1 (Lớp 8) ➔ Ải 2 (Lớp 9) ➔ Ải 3 (Lớp 10) ➔ Ải 4 (Lớp 11) ➔ Ải 5 (Lớp 12). Hoàn thành mỗi ải được +30s và thăng cấp.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    5 Ải Kiến Thức
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { id: 0, label: "Tất cả", desc: "Tổng hợp các lớp" },
                    { id: 8, label: "Lớp 8", desc: "Phản ứng cơ bản" },
                    { id: 9, label: "Lớp 9", desc: "Vô cơ & Kim loại" },
                    { id: 10, label: "Lớp 10", desc: "Oxi hóa - khử" },
                    { id: 11, label: "Lớp 11", desc: "Cân bằng ion" },
                    { id: 12, label: "Lớp 12", desc: "Este & Polime" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGrade(g.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        selectedGrade === g.id
                          ? "bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/40 text-white font-semibold shadow-sm"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <span className="font-bold text-xs sm:text-sm text-white">{g.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{g.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nút Bắt đầu */}
            <button
              onClick={() => handleStartGame()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Bắt đầu luyện tập</span>
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* MÀN HÌNH 2: ĐANG THI ĐẤU (EXPANSIVE ARENA) */}
        {gameState === "playing" && (
          <div className="flex-1 w-full h-full flex flex-col justify-between py-1">
            {/* Thanh thanh tiến độ đấu trường & bám đuổi Top 1 */}
            <div className="w-full flex items-center justify-between gap-4 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 mb-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-medium">
                  Vòng {currentRoundIdx} • Đã ghép đúng {matchedIds.size}/5 phương trình
                </span>
              </div>

              {/* Bám đuổi Top 1 Leader */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span className="text-slate-400">Dẫn đầu bảng:</span>
                <span className="font-semibold text-amber-300">
                  {topLeader.userName} ({targetLeaderScore} điểm)
                </span>
                <div className="w-28 h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressToTop}%` }}
                  />
                </div>
                <span className="text-[10px] text-amber-400 font-mono">{progressToTop}%</span>
              </div>
            </div>

            {/* BẢNG ĐẤU TRƯỜNG CHÍNH (HAI CỘT + SVG LASER Ở GIỮA) */}
            <div
              ref={arenaRef}
              className="relative flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-16 items-center px-2 sm:px-6 my-auto"
            >
              {/* SVG DÂY NỐI PHẢN ỨNG (Z-30 TRÊN CARD ĐỂ KHÔNG BAO GIỜ BỊ CHE MẤT) */}
              <svg
                className="pointer-events-none absolute inset-0 w-full h-full z-30 hidden md:block"
                style={{ overflow: "visible" }}
              >
                {Array.from(matchedIds).map((id) => {
                  const p1 = portCoords.left[id];
                  const p2 = portCoords.right[id];
                  if (!p1 || !p2) return null;

                  const dx = Math.abs(p2.x - p1.x);
                  const dy = p2.y - p1.y;
                  const bow = Math.abs(dy) < 10 ? 20 : 0;
                  const ctrlY1 = p1.y + bow;
                  const ctrlY2 = p2.y + bow;
                  const path = `M ${p1.x} ${p1.y} C ${p1.x + dx * 0.45} ${ctrlY1}, ${p2.x - dx * 0.45} ${ctrlY2}, ${p2.x} ${p2.y}`;

                  return (
                    <g key={`matched-line-${id}`}>
                      {/* Lớp nền mờ */}
                      <path
                        d={path}
                        stroke="#059669"
                        strokeWidth="5"
                        fill="none"
                        opacity="0.25"
                      />
                      {/* Dây nối liên kết hóa học chính */}
                      <path
                        d={path}
                        stroke="#10b981"
                        strokeWidth="2.5"
                        fill="none"
                      />
                      {/* Nốt gắn kết */}
                      <circle cx={p1.x} cy={p1.y} r="4" fill="#10b981" stroke="#064e3b" strokeWidth="1.5" />
                      <circle cx={p2.x} cy={p2.y} r="4" fill="#10b981" stroke="#064e3b" strokeWidth="1.5" />
                    </g>
                  );
                })}
              </svg>

              {/* CỘT TRÁI: CHẤT PHẢN ỨNG */}
              <div className="flex flex-col gap-2.5 z-20">
                <div className="flex items-center justify-between px-1 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Chất tham gia (Vế trái)</span>
                  <span className="text-[11px] text-slate-500 font-normal lowercase">chọn để bắt đầu</span>
                </div>

                {leftItems.map((item, idx) => {
                  const isMatched = matchedIds.has(item.id);
                  const isSelected = selectedLeft === item.id;
                  const isShaking = errorShakeId?.startsWith(item.id);

                  return (
                    <button
                      key={item.id}
                      disabled={isMatched || isLocked}
                      onClick={() => handleSelectLeft(item.id)}
                      className={`group relative w-full p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                        isMatched
                          ? "bg-slate-900/40 border-emerald-500/30 text-emerald-300 opacity-60 pointer-events-none"
                          : isSelected
                          ? "bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-md text-white"
                          : "bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-100"
                      } ${isShaking ? "animate-shake bg-rose-950/60 border-rose-500 text-rose-200" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isMatched
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                          }`}
                        >
                          {isMatched ? <IconCheck className="w-3.5 h-3.5" /> : `A${idx + 1}`}
                        </div>
                        <div className="flex flex-col">
                          <FormulaDisplay formula={item.formula} className="text-base sm:text-lg font-semibold" />
                          {equationsMap[item.id]?.categoryLabel && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {equationsMap[item.id].categoryLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cổng kết nối */}
                      <div
                        ref={(el) => {
                          if (el) leftPortRefs.current.set(item.id, el);
                          else leftPortRefs.current.delete(item.id);
                        }}
                        id={`port-left-${item.id}`}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0 ${
                          isMatched
                            ? "bg-emerald-400 border-emerald-300"
                            : isSelected
                            ? "bg-blue-400 border-white scale-110"
                            : "bg-slate-800 border-slate-600 group-hover:border-blue-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* CỘT PHẢI: SẢN PHẨM HÌNH THÀNH */}
              <div className="flex flex-col gap-2.5 z-20">
                <div className="flex items-center justify-between px-1 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Sản phẩm tạo thành (Vế phải)</span>
                  <span className="text-[11px] text-slate-500 font-normal lowercase">ghép cặp tương ứng</span>
                </div>

                {rightItems.map((item, idx) => {
                  const isMatched = matchedIds.has(item.id);
                  const isSelected = selectedRight === item.id;
                  const isShaking = errorShakeId?.endsWith(item.id);

                  return (
                    <button
                      key={item.id}
                      disabled={isMatched || isLocked}
                      onClick={() => handleSelectRight(item.id)}
                      className={`group relative w-full p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                        isMatched
                          ? "bg-slate-900/40 border-emerald-500/30 text-emerald-300 opacity-60 pointer-events-none"
                          : isSelected
                          ? "bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md text-white"
                          : "bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-100"
                      } ${isShaking ? "animate-shake bg-rose-950/60 border-rose-500 text-rose-200" : ""}`}
                    >
                      {/* Cổng kết nối */}
                      <div
                        ref={(el) => {
                          if (el) rightPortRefs.current.set(item.id, el);
                          else rightPortRefs.current.delete(item.id);
                        }}
                        id={`port-right-${item.id}`}
                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0 ${
                          isMatched
                            ? "bg-emerald-400 border-emerald-300"
                            : isSelected
                            ? "bg-indigo-400 border-white scale-110"
                            : "bg-slate-800 border-slate-600 group-hover:border-indigo-400"
                        }`}
                      />

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <FormulaDisplay formula={item.formula} className="text-base sm:text-lg font-semibold text-right" />
                          {equationsMap[item.id]?.categoryLabel && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {equationsMap[item.id].categoryLabel}
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isMatched
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                          }`}
                        >
                          {isMatched ? <IconCheck className="w-3.5 h-3.5" /> : `B${idx + 1}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PHẦN HIỂN THỊ HIỆN TƯỢNG HÓA HỌC KHI NỐI ĐÚNG */}
            <div className="w-full h-18 min-h-[68px] shrink-0 mt-2 flex items-center">
              {justMatchedItem ? (
                <div className="w-full h-full p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md flex items-center gap-3 shadow-md animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <IconCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs overflow-hidden">
                    <div className="flex items-center gap-2 mb-0.5 truncate">
                      <span className="font-medium text-slate-400">Phương trình:</span>
                      <FormulaDisplay formula={justMatchedItem.fullEquation} className="text-emerald-300 font-bold text-sm" />
                      {justMatchedItem.condition && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 text-[10px] font-medium border border-slate-700">
                          {justMatchedItem.condition}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 font-normal truncate">
                      <span className="text-slate-400">Hiện tượng: </span>
                      {justMatchedItem.phenomenon}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full px-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <IconInfo className="w-4 h-4 text-blue-400" />
                    <span>Chọn 1 chất ở <strong>Vế trái</strong> và 1 sản phẩm ở <strong>Vế phải</strong> để ghép cặp phản ứng</span>
                  </span>
                  <span className="hidden sm:inline text-slate-400 text-[11px]">Nối liên tiếp chính xác để tăng hệ số điểm</span>
                </div>
              )}
            </div>

            {/* POPUP THÔNG BÁO ĐIỂM SỐ HOẶC PHẠT */}
            {floatingScore && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                <div
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl ${
                    floatingScore.isPenalty
                      ? "bg-rose-600 text-white border border-rose-500 shadow-rose-600/30"
                      : "bg-blue-600 text-white border border-blue-500 shadow-blue-600/30"
                  }`}
                >
                  {floatingScore.text}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MÀN HÌNH 3: TỔNG KẾT BÀI THỰC HÀNH */}
        {gameState === "gameover" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto py-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
              <IconAward className="w-8 h-8" />
            </div>

            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Hoàn thành bài thực hành
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {currentRankTier.title}
            </h2>
            <p className="text-xs text-slate-400 mb-6 max-w-md">
              Kết quả của bạn đã được ghi nhận vào hồ sơ học tập và hệ thống xếp hạng SimLab.
            </p>

            <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 shadow-md">
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1">Điểm ván này</span>
                <span className="text-2xl font-bold text-amber-400">{score}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Xếp hạng</span>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2 flex flex-col justify-center">
                <span className="text-[10px] font-semibold text-cyan-400 uppercase block mb-0.5 flex items-center justify-center gap-1">
                  <IconZap className="w-3 h-3 text-cyan-400" />
                  XP nhận được
                </span>
                <span className="text-2xl font-extrabold text-cyan-300">+{earnedXp}</span>
                <span className="text-[9px] text-cyan-400/80 block mt-0.5">Đã cộng vào hồ sơ</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1">Chuỗi cao nhất</span>
                <span className="text-2xl font-bold text-orange-400">{maxCombo}x</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Combo</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1">Đã ghép đúng</span>
                <span className="text-2xl font-bold text-emerald-400">{correctCount}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Phương trình</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1">Hạng Bảng Vàng</span>
                <span className="text-2xl font-bold text-blue-400">{playerRank ? `#${playerRank}` : "--"}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Kỷ lục cá nhân</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={() => handleStartGame(mode)}
                className="flex-1 min-w-[140px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                <IconRotateCcw className="w-4 h-4" />
                <span>Làm lại bài</span>
              </button>

              <button
                onClick={handleShareChallenge}
                className="flex-1 min-w-[140px] px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <IconShare className="w-4 h-4 text-slate-400" />
                <span>{copySuccess ? "Đã sao chép liên kết" : "Chia sẻ kết quả"}</span>
              </button>

              <button
                onClick={() => setGameState("lobby")}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition-all"
              >
                Đổi chế độ
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── FOOTER TOÀN DIỆN CỦA HỆ THỐNG SIMLAB EDU ─── */}
      <Footer className="border-t border-slate-800/80 bg-slate-950/95 text-slate-400 mt-auto" />

      {/* ─── LEADERBOARD DRAWER / SLIDE-OVER ─── */}
      {leaderboardOpen && (
        <div
          id="leaderboard-backdrop"
          onClick={() => setLeaderboardOpen(false)}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-5 sm:p-6 flex flex-col justify-between shadow-2xl animate-slide-left cursor-default overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <IconTrophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Bảng xếp hạng thành tích</h3>
                </div>
                <button
                  id="btn-close-leaderboard"
                  onClick={() => setLeaderboardOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Tab chuyển đổi 4 Bảng Xếp Hạng: 3 Chế Độ + Top XP */}
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-3">
                <button
                  id="tab-mode-blitz"
                  onClick={() => setLeaderboardTab("blitz")}
                  className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                    leaderboardTab === "blitz"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <IconClock className="w-3 h-3 text-blue-300" />
                    <span>Phản xạ</span>
                  </span>
                  <span className="text-[9px] opacity-75 font-normal">60 giây</span>
                </button>

                <button
                  id="tab-mode-campaign"
                  onClick={() => setLeaderboardTab("campaign")}
                  className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                    leaderboardTab === "campaign"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <IconLayers className="w-3 h-3 text-purple-300" />
                    <span>Vượt ải</span>
                  </span>
                  <span className="text-[9px] opacity-75 font-normal">Lớp 8 - 12</span>
                </button>

                <button
                  id="tab-mode-survival"
                  onClick={() => setLeaderboardTab("survival")}
                  className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                    leaderboardTab === "survival"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <IconShield className="w-3 h-3 text-emerald-300" />
                    <span>Sinh tồn</span>
                  </span>
                  <span className="text-[9px] opacity-75 font-normal">3 mạng</span>
                </button>

                <button
                  id="tab-mode-xp"
                  onClick={() => setLeaderboardTab("xp")}
                  className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                    leaderboardTab === "xp"
                      ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/50"
                      : "text-amber-400/90 hover:text-amber-300 hover:bg-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold">
                    <IconZap className="w-3 h-3 text-amber-300" />
                    <span>Top XP</span>
                  </span>
                  <span className="text-[9px] opacity-80 font-normal">Tích lũy</span>
                </button>
              </div>

              {/* Ghi chú thông tin bảng xếp hạng */}
              <div className="mb-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <IconZap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {leaderboardTab === "xp" ? (
                    <>
                      <strong>Bảng Vàng Danh Vọng (Top XP)</strong> ghi nhận tổng điểm kinh nghiệm tích lũy qua tất cả bài thực hành và minigame của học sinh toàn hệ thống SimLab.
                    </>
                  ) : (
                    <>
                      Bảng xếp hạng <strong>{leaderboardTab === "blitz" ? "Phản xạ 60s" : leaderboardTab === "campaign" ? "Vượt ải cấp lớp" : "Sinh tồn 3 mạng"}</strong> lưu kỷ lục cao nhất của mỗi người chơi. XP được cộng dồn sau mỗi trận vào hồ sơ.
                    </>
                  )}
                </span>
              </div>

              {/* Lọc khối lớp (chỉ hiển thị cho 3 chế độ trận đấu) */}
              {leaderboardTab !== "xp" && (
                <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-3.5">
                  {[
                    { id: 0, label: "Tất cả" },
                    { id: 8, label: "Lớp 8-9" },
                    { id: 10, label: "Lớp 10" },
                    { id: 11, label: "Lớp 11" },
                    { id: 12, label: "Lớp 12" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setLeaderboardGradeFilter(f.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                        leaderboardGradeFilter === f.id
                          ? "bg-slate-800 text-white font-semibold shadow-sm border border-slate-700"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Danh sách thứ hạng */}
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-310px)] custom-scrollbar pr-1">
                {leaderboardTab === "xp" ? (
                  xpLeaderboard.map((entry, idx) => {
                    const isMe = currentUser && entry.userId === currentUser.id;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isMe
                            ? "bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30 shadow-md shadow-amber-500/10"
                            : idx === 0
                            ? "bg-amber-500/10 border-amber-500/30"
                            : idx === 1
                            ? "bg-slate-800/60 border-slate-700/80"
                            : idx === 2
                            ? "bg-slate-800/40 border-slate-800"
                            : "bg-slate-950/40 border-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 text-center text-xs font-bold ${
                              idx === 0
                                ? "text-amber-400"
                                : idx === 1
                                ? "text-slate-300"
                                : idx === 2
                                ? "text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: entry.avatarColor || "#2563eb" }}
                          >
                            {entry.userName ? entry.userName.split(" ").slice(-1)[0][0] : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-white">{entry.userName}</p>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate max-w-[155px]">
                              {entry.userSchool || "SimLab Edu"} • Cấp {entry.level}
                              {entry.streak > 0 && ` • 🔥 ${entry.streak} ngày`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-amber-300">{entry.xp.toLocaleString()}</span>
                          <span className="text-[10px] text-amber-400/80 ml-1 font-semibold">XP</span>
                        </div>
                      </div>
                    );
                  })
                ) : filteredLeaderboard.length === 0 ? (
                  <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-500">
                      <IconTrophy className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">Chưa có kỷ lục nào trong bộ lọc này</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      Hãy bắt đầu chơi để là người đầu tiên ghi danh lên Bảng Vàng!
                    </p>
                  </div>
                ) : (
                  filteredLeaderboard.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        idx === 0
                          ? "bg-amber-500/10 border-amber-500/30"
                          : idx === 1
                          ? "bg-slate-800/60 border-slate-700/80"
                          : idx === 2
                          ? "bg-slate-800/40 border-slate-800"
                          : "bg-slate-950/40 border-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 text-center text-xs font-bold ${
                            idx === 0
                              ? "text-amber-400"
                              : idx === 1
                              ? "text-slate-300"
                              : idx === 2
                              ? "text-amber-600"
                              : "text-slate-500"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: entry.avatarColor || "#2563eb" }}
                        >
                          {entry.userName ? entry.userName.split(" ").slice(-1)[0][0] : "U"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{entry.userName}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[155px]">
                            {entry.userSchool || "SimLab Edu"} • Chuỗi: {entry.maxCombo}x
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-300">{entry.score}</span>
                        <span className="text-[10px] text-slate-400 ml-1">đ</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {leaderboardTab === "xp" ? (
              <Link
                href={currentUser?.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student"}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md shadow-amber-600/25 transition-all mt-3 flex items-center justify-center gap-2"
              >
                <IconZap className="w-3.5 h-3.5" />
                <span>Xem chi tiết học bạ & danh hiệu của bạn</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={() => {
                  setLeaderboardOpen(false);
                  setMode(leaderboardTab);
                  if (gameState !== "playing") handleStartGame(leaderboardTab);
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/25 transition-all mt-3 flex items-center justify-center gap-2"
              >
                <span>Vào chơi {leaderboardTab === "blitz" ? "Phản xạ 60s" : leaderboardTab === "campaign" ? "Vượt ải cấp lớp" : "Sinh tồn"}</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
