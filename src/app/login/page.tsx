"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Footer, { LogoMark } from "@/components/Footer";
import { useToast } from "@/components/toast";
import {
    getCurrentUser,
    syncUser,
    setSession,
    seedIfNeeded,
    User,
} from "@/lib/storage";
import {
    School,
    GraduationCap,
    Lock,
    ArrowRight,
    Eye,
    CheckCircle2,
    ShieldCheck,
} from "lucide-react";

function UserIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function MailIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

function EyeOffIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
    );
}

type AuthMode = "login" | "register";
type UserRole = "student" | "teacher";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [mode, setMode] = useState<AuthMode>(
        searchParams?.get("mode") === "register" ? "register" : "login"
    );
    const [role, setRole] = useState<UserRole>(
        searchParams?.get("role") === "teacher" ? "teacher" : "student"
    );

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [school, setSchool] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        seedIfNeeded();
        const user = getCurrentUser();
        if (user) {
            router.replace(user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
        }
    }, [router]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            seedIfNeeded();

            try {
                const cleanEmail = email.trim();
                let res;
                if (mode === "register") {
                    res = await fetch("/api/auth/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: name.trim(),
                            email: cleanEmail,
                            password,
                            role,
                            school: school.trim() || undefined,
                        }),
                    });
                } else {
                    res = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: cleanEmail, password }),
                    });
                }

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Không thể xác thực thông tin đăng nhập.");
                }

                const loggedIn = (await res.json()) as User;
                syncUser(loggedIn);
                setSession(loggedIn.id, rememberMe);
                showToast(`Xin chào ${loggedIn.name}! Đăng nhập thành công.`);
                router.push(loggedIn.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
            } catch (err: any) {
                setError(err instanceof Error ? err.message : "Có lỗi xảy ra trong quá trình xác thực.");
            } finally {
                setLoading(false);
            }
        },
        [mode, name, email, password, role, school, rememberMe, router, showToast]
    );

    // Đăng nhập nhanh tài khoản mẫu dành cho Giám khảo & Thầy cô đánh giá
    const handleQuickDemo = useCallback(
        async (demoRole: "teacher" | "student") => {
            setError("");
            setLoading(true);
            const demoEmail = demoRole === "teacher" ? "teacher@simlab.edu.vn" : "student@simlab.edu.vn";
            const demoPass = "123456";

            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: demoEmail, password: demoPass }),
                });

                if (res.ok) {
                    const loggedIn = (await res.json()) as User;
                    syncUser(loggedIn);
                    setSession(loggedIn.id, true);
                    showToast(`Đã đăng nhập tài khoản mẫu: ${loggedIn.name}`);
                    router.push(demoRole === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
                } else {
                    throw new Error("Không thể kết nối máy chủ thử nghiệm.");
                }
            } catch {
                setError("Lỗi kết nối tài khoản mẫu. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        },
        [router, showToast]
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
            {/* Header Thống nhất */}
            <UnifiedNavbar hideSubjectTabs={false} />

            {/* Main Auth Container */}
            <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    
                    {/* Enterprise Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
                        
                        {/* Accent Bar */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

                        {/* Brand Header */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 mb-3">
                                <LogoMark className="w-9 h-9" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                {mode === "login" ? "Cổng Đăng Nhập Giáo Dục" : "Khởi Tạo Tài Khoản THPT"}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Hệ thống thực hành khoa học số chuẩn GDPT 2018
                            </p>
                        </div>

                        {/* Mode Selector Tabs */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 mb-5">
                            <button
                                type="button"
                                onClick={() => { setMode("login"); setError(""); }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    mode === "login"
                                        ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                Đăng Nhập
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode("register"); setError(""); }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    mode === "register"
                                        ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                Đăng Ký
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === "register" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Họ và Tên
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                placeholder="VD: Nguyễn Văn An"
                                                className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Vai trò trong nhà trường
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setRole("student")}
                                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                    role === "student"
                                                        ? "bg-blue-50 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500/60 text-blue-600 dark:text-blue-300"
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400"
                                                }`}
                                            >
                                                <GraduationCap className="w-3.5 h-3.5" />
                                                <span>Học sinh THPT</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRole("teacher")}
                                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                    role === "teacher"
                                                        ? "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/60 text-emerald-600 dark:text-emerald-300"
                                                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400"
                                                }`}
                                            >
                                                <School className="w-3.5 h-3.5" />
                                                <span>Giáo viên / Tổ CM</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Trường THPT (Tùy chọn)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={school}
                                                onChange={(e) => setSchool(e.target.value)}
                                                placeholder="VD: THPT Chuyên KHTN"
                                                className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                            <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Địa chỉ Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="dia_chi_email@thpt.edu.vn"
                                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <MailIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full px-3.5 py-2.5 pl-9 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                                    />
                                    <span>Ghi nhớ phiên đăng nhập</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{loading ? "Đang xác thực..." : mode === "login" ? "Đăng Nhập Cổng Giáo Dục" : "Khởi Tạo Tài Khoản"}</span>
                            </button>
                        </form>

                        {/* Demo Accounts for evaluators */}
                        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 font-medium">
                                Tài khoản mẫu phục vụ đánh giá chuyên môn:
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleQuickDemo("teacher")}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <School className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Giáo viên Demo</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickDemo("student")}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Học sinh Demo</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#070b14]" />}>
            <LoginContent />
        </Suspense>
    );
}
