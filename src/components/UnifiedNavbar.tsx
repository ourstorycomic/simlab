"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogoMark } from "./Footer";
import { getCurrentUser, logout, User } from "@/lib/storage";
import {
    FlaskConical,
    Atom,
    Dna,
    Box,
    Trophy,
    X,
    School,
    GraduationCap,
} from "lucide-react";

export type NavSubject = "chemistry" | "physics" | "biology" | "3d" | "minigame" | "dashboard" | "home";

interface UnifiedNavbarProps {
    currentSubject?: NavSubject;
    centerContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    onTourOpen?: () => void;
    hideSubjectTabs?: boolean;
}

export default function UnifiedNavbar({
    currentSubject,
    centerContent,
    rightContent,
    onTourOpen,
    hideSubjectTabs = false,
}: UnifiedNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isDark, setIsDark] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Xác định subject hiện tại nếu không truyền qua prop
    const activeSubject: NavSubject = currentSubject || (() => {
        if (pathname === "/") return "home";
        if (pathname?.startsWith("/lab/3d")) return "3d";
        if (pathname?.startsWith("/lab")) return "chemistry";
        if (pathname?.startsWith("/physics")) return "physics";
        if (pathname?.startsWith("/biology")) return "biology";
        if (pathname?.startsWith("/minigame")) return "minigame";
        if (pathname?.startsWith("/dashboard")) return "dashboard";
        return "home";
    })();

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
        setUser(getCurrentUser());

        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTheme = useCallback(() => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("simlab-theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("simlab-theme", "light");
        }
    }, [isDark]);

    const handleLogout = useCallback(() => {
        logout();
        setUser(null);
        setUserDropdownOpen(false);
        router.push("/");
    }, [router]);

    // Danh sách 3 phân môn cốt lõi THPT + Không gian 3D + Đấu trường
    const SUBJECT_TABS = [
        {
            id: "chemistry" as const,
            label: "Hóa học",
            sublabel: "107 chất • Phản ứng",
            href: "/lab",
            icon: FlaskConical,
            activeColor: "border-sky-500/50 bg-sky-500/10 text-sky-400 font-semibold shadow-xs",
        },
        {
            id: "physics" as const,
            label: "Vật lý",
            sublabel: "Cơ • Điện • Quang",
            href: "/physics",
            icon: Atom,
            activeColor: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 font-semibold shadow-xs",
        },
        {
            id: "biology" as const,
            label: "Sinh học 3D",
            sublabel: "Giải phẫu • Tế bào",
            href: "/biology",
            icon: Dna,
            activeColor: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold shadow-xs",
        },
        {
            id: "3d" as const,
            label: "Lab 3D VR",
            sublabel: "AI Hand Tracking",
            href: "/lab/3d",
            icon: Box,
            activeColor: "border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-bold shadow-xs",
            isNew: true,
        },
        {
            id: "minigame" as const,
            label: "Đấu trường PT",
            sublabel: "Thi đua tính điểm",
            href: "/minigame",
            icon: Trophy,
            activeColor: "border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold shadow-xs",
        },
    ];

    return (
        <header className="sticky top-0 z-40 w-full h-16 bg-[#0a0f1d]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-sm transition-colors select-none">
            <div className="max-w-[1720px] mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-3">
                
                {/* ─── LEFT: Logo Doanh nghiệp + Bộ môn THPT ─── */}
                <div className="flex items-center gap-3 md:gap-5 shrink-0">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 group shrink-0 focus-visible:outline-none"
                        title="Về trang chủ SimLab Edu"
                    >
                        <div className="relative">
                            <LogoMark className="w-8 h-8 sm:w-9 sm:h-9 transition-transform group-hover:scale-105 duration-200" />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">
                                    SimLab
                                </span>
                                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 tracking-wider">
                                    Edu
                                </span>
                            </div>
                            <span className="hidden xl:inline text-[9px] text-slate-400 font-medium tracking-wide">
                                Nền tảng Thực hành Kỹ thuật số THPT
                            </span>
                        </div>
                    </Link>

                    {/* Vách ngăn dọc */}
                    <div className="hidden lg:block w-px h-6 bg-slate-800 shrink-0" />

                    {/* Tab Chuyển Đổi Phân Môn GDPT 2018 (Desktop) */}
                    {!hideSubjectTabs && (
                        <nav
                            aria-label="Danh mục phòng thực hành"
                            className="hidden lg:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner shrink-0"
                        >
                            {SUBJECT_TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeSubject === tab.id;
                                return (
                                    <Link
                                        key={tab.id}
                                        href={tab.href}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                                            isActive
                                                ? tab.activeColor
                                                : "border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
                                        }`}
                                    >
                                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-current" : "text-slate-400"}`} />
                                        <span className="font-semibold">{tab.label}</span>
                                        {tab.isNew && (
                                            <span className="px-1 py-0.2 text-[8px] font-black bg-cyan-400 text-slate-950 rounded uppercase tracking-wider">
                                                3D
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                {/* ─── CENTER: Nội dung ngữ cảnh (Thanh công cụ thí nghiệm hoặc Breadcrumb) ─── */}
                {centerContent && (
                    <div className="hidden xl:flex items-center justify-center flex-1 max-w-xl mx-auto">
                        {centerContent}
                    </div>
                )}

                {/* ─── RIGHT: Tiện ích, Tour, Tài khoản Giáo viên/Học sinh ─── */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {rightContent}

                    {/* Nút Hướng dẫn sử dụng phòng Lab */}
                    {onTourOpen && (
                        <button
                            onClick={onTourOpen}
                            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors shadow-xs"
                            title="Mở hướng dẫn từng bước"
                        >
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
                            </svg>
                            <span>Hướng dẫn</span>
                        </button>
                    )}

                    {/* Tiêu chuẩn GDPT 2018 (Chứng nhận doanh nghiệp EdTech) */}
                    <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[11px] font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Chuẩn GDPT 2018</span>
                    </div>

                    {/* ── Menu Tài Khoản Cá Nhân (Đã Đăng Nhập) / Nút Đăng Nhập (Khách) ── */}
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left transition-all shadow-xs group cursor-pointer"
                                aria-expanded={userDropdownOpen}
                                aria-haspopup="true"
                            >
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden sm:flex flex-col leading-tight max-w-[130px]">
                                    <span className="text-xs font-bold text-slate-100 truncate group-hover:text-blue-300">
                                        {user.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate">
                                        {user.role === "teacher" ? "Giáo viên THPT" : "Học sinh THPT"}
                                    </span>
                                </div>
                                <svg
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? "rotate-180 text-blue-400" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {/* Dropdown Menu Tài Khoản */}
                            {userDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-slate-900/98 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    {/* Header Menu */}
                                    <div className="px-3 py-2.5 border-b border-slate-800 mb-1.5">
                                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{user.email}</p>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                user.role === "teacher"
                                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                            }`}>
                                                {user.role === "teacher" ? "Giáo viên Bộ môn" : "Học sinh THPT"}
                                            </span>
                                            {user.school && (
                                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={user.school}>
                                                    • {user.school}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="space-y-0.5">
                                        <Link
                                            href={user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student"}
                                            onClick={() => setUserDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                                            </svg>
                                            <span>Bảng điều khiển lớp học</span>
                                        </Link>
                                        <Link
                                            href="/minigame"
                                            onClick={() => setUserDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                                        >
                                            <Trophy className="w-4 h-4 text-amber-400" />
                                            <span>Đấu trường & Điểm số</span>
                                        </Link>
                                    </div>

                                    {/* Đăng xuất */}
                                    <div className="border-t border-slate-800 mt-2 pt-1.5">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                            </svg>
                                            <span>Đăng xuất hệ thống</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/"
                                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-xs"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/"
                                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:-translate-y-0.5"
                            >
                                Dành cho Trường học
                            </Link>
                        </div>
                    )}

                    {/* Nút Đổi Theme Tối/Sáng */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors cursor-pointer"
                        title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
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

                    {/* Nút Mobile Hamburger Menu */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                        aria-label="Mở menu điều hướng"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* ─── Mobile Drawer Menu ─── */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-x-0 top-16 bg-slate-950/98 border-b border-slate-800 shadow-2xl backdrop-blur-2xl p-4 z-50 animate-in slide-in-from-top-4 duration-200">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                        Phòng Thực Hành THPT Chuẩn GDPT 2018
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {SUBJECT_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeSubject === tab.id;
                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${
                                        isActive
                                            ? tab.activeColor
                                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <div>
                                        <p className="leading-tight">{tab.label}</p>
                                        <p className="text-[9px] text-slate-400 font-normal leading-tight">{tab.sublabel}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {user ? (
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">{user.name}</p>
                                    <p className="text-[10px] text-slate-400">{user.role === "teacher" ? "Giáo viên" : "Học sinh"}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-900/50"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        <div className="pt-3 border-t border-slate-800 flex gap-2">
                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-blue-600 text-white shadow"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
