"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "./Footer";
import { getCurrentUser, User } from "@/lib/storage";

export type LabSubject = "chemistry" | "physics" | "biology";

interface LabHeaderProps {
    currentSubject: LabSubject;
    centerContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    onTourOpen?: () => void;
}

export default function LabHeader({
    currentSubject,
    centerContent,
    rightContent,
    onTourOpen,
}: LabHeaderProps) {
    const [isDark, setIsDark] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
        setUser(getCurrentUser());
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("simlab-theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("simlab-theme", "light");
        }
    };

    const SUBJECTS = [
        {
            id: "chemistry" as const,
            label: "Hóa học",
            href: "/lab",
            icon: (
                <svg width="16" height="16" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            ),
            activeClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        },
        {
            id: "physics" as const,
            label: "Vật lý",
            href: "/physics",
            icon: (
                <svg width="16" height="16" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
            ),
            activeClass: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        },
        {
            id: "biology" as const,
            label: "Sinh học 3D",
            href: "/biology",
            icon: (
                <svg width="16" height="16" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
                </svg>
            ),
            activeClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        },
    ];

    return (
        <header className="sticky top-0 z-30 h-16 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between flex-shrink-0 transition-colors shadow-xs">
            {/* Left: Brand + Subject Switcher */}
            <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <LogoMark className="w-7 h-7 sm:w-8 sm:h-8" />
                    <div className="hidden md:block">
                        <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight group-hover:text-blue-500 transition-colors">
                            Simlab Edu
                        </span>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">Phòng thực hành ảo</p>
                    </div>
                </Link>

                <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

                {/* Subject Switcher Tabs */}
                <nav className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700/60">
                    {SUBJECTS.map((s) => {
                        const isActive = currentSubject === s.id;
                        return (
                            <Link
                                key={s.id}
                                href={s.href}
                                className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                    isActive
                                        ? `${s.activeClass} shadow-xs`
                                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-700/60"
                                }`}
                            >
                                {s.icon}
                                <span className={isActive ? "inline" : "hidden sm:inline"}>{s.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Minigame Shortcut */}
                <Link
                    href="/minigame"
                    className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/20 transition-all shadow-xs shrink-0"
                    title="Đấu trường Nối Phương Trình Hóa Học — Đua Top Nhận Quà"
                >
                    <span className="text-sm">⚡</span>
                    <span className="hidden sm:inline">Minigame Nối PT</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-full font-black uppercase tracking-wider shadow-xs">
                        HOT
                    </span>
                </Link>
            </div>

            {/* Center: Subject specific controls */}
            {centerContent && (
                <div className="hidden md:flex items-center gap-2">{centerContent}</div>
            )}

            {/* Right: Actions + Utilities */}
            <div className="flex items-center gap-2 sm:gap-3">
                {rightContent}

                {/* Tour / Hướng dẫn */}
                {onTourOpen && (
                    <button
                        onClick={onTourOpen}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                        title="Xem hướng dẫn sử dụng"
                    >
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
                        </svg>
                        <span className="hidden sm:inline">Hướng dẫn</span>
                    </button>
                )}

                {/* Dashboard or Home Link */}
                {user ? (
                    <Link
                        href={user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student"}
                        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                        title="Vào bảng điều khiển tài khoản"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                        <span>Dashboard</span>
                    </Link>
                ) : (
                    <Link
                        href="/"
                        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 transition-colors"
                    >
                        <span>Trang chủ</span>
                    </Link>
                )}

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                    title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
                    aria-label="Đổi giao diện sáng/tối"
                >
                    {isDark ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                        </svg>
                    )}
                </button>
            </div>
        </header>
    );
}
