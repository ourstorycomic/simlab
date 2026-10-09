"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Role,
    User,
    getCurrentUser,
    loginUser,
    logout,
    registerUser,
    seedIfNeeded,
    setSession,
    syncUser,
} from "@/lib/storage";
import { useToast } from "@/components/toast";

type AuthMode = "login" | "register";

const DEMO_ACCOUNTS: { role: Role; label: string; email: string; password: string }[] = [
    { role: "teacher", label: "Giáo viên", email: "gv@simlab.vn", password: "demo123" },
    { role: "student", label: "Học sinh", email: "hs@simlab.vn", password: "demo123" },
];

function LogoMark({ className = "w-7 h-7" }: { className?: string }) {
    return (
        <svg viewBox="0 0 28 28" className={`${className} text-blue-600 dark:text-blue-400`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 3v5M16 3v5" strokeLinecap="round" />
            <path d="M10 10h8M8 14h12M6 18h16" />
            <path d="M8 10l-2 14h16L20 10H8Z" />
            <path d="M10 10l-2 14" strokeWidth="0.8" />
            <path d="M18 10l2 14" strokeWidth="0.8" />
        </svg>
    );
}

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
    );
}

export default function Home() {
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [mode, setMode] = useState<AuthMode>("login");
    const [role, setRole] = useState<Role>("student");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [school, setSchool] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    useEffect(() => {
        seedIfNeeded();
        setUser(getCurrentUser());
    }, []);

    const handleAuth = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            seedIfNeeded();
            try {
                let loggedIn: User | null = null;
                
                let res;
                if (mode === "register") {
                    res = await fetch("/api/auth/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, email, password, role, school: school || undefined })
                    });
                } else {
                    res = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password })
                    });
                }

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Lỗi kết nối máy chủ Supabase. Hãy kiểm tra biến môi trường trên Vercel.");
                }

                loggedIn = await res.json() as User;
                
                // BẮT BUỘC ĐỒNG BỘ: lưu vào cache local để hàm getCurrentUser() ở Dashboard tìm thấy
                syncUser(loggedIn);

                setSession(loggedIn.id, rememberMe);
                setUser(loggedIn);
                showToast(`${mode === "register" ? "Đăng ký" : "Đăng nhập"} thành công qua Supabase! Xin chào ${loggedIn.name}!`);
                router.push(loggedIn.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            } finally {
                setLoading(false);
            }
        },
        [mode, name, email, password, role, school, rememberMe, router, showToast]
    );

    const handleLogout = useCallback(() => {
        logout();
        setUser(null);
        showToast("Đã đăng xuất khỏi Simlab", "info");
    }, [showToast]);

    const handleEnterLab = useCallback(() => {
        router.push("/lab");
    }, [router]);

    const handleEnterBiology = useCallback(() => {
        router.push("/biology");
    }, [router]);

    const handleDemoLogin = useCallback(
        async (demoEmail: string, demoPassword: string, demoLabel: string) => {
            setError("");
            seedIfNeeded();
            try {
                let res;
                res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: demoEmail, password: demoPassword })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Lỗi kết nối máy chủ Supabase. Hãy kiểm tra biến môi trường trên Vercel.");
                }

                let loggedIn = await res.json() as User;

                setSession(loggedIn.id);
                setUser(loggedIn);
                showToast(`Đã đăng nhập tài khoản demo — ${demoLabel}`);
                router.push(loggedIn.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            }
        },
        [router, showToast]
    );

    // ─── Trạng thái đã đăng nhập ───
    useEffect(() => {
        if (user) {
            router.replace(user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
        }
    }, [user, router]);

    if (user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0e17] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3">
                    <Spinner className="w-8 h-8 text-blue-500" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Đang chuyển hướng đến Bảng điều khiển...</p>
                </div>
            </div>
        );
    }

    // ─── Trang chủ + Auth ───
    return (
        <div className="relative min-h-screen bg-[#f8fafc] dark:bg-[#0a0e17] overflow-x-hidden transition-colors duration-300">
            {/* Decorative gradient blobs */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-blue-200/50 dark:bg-blue-500/10 blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-violet-200/50 dark:bg-violet-500/10 blur-3xl" />
                <div className="absolute -bottom-40 left-1/4 w-[26rem] h-[26rem] rounded-full bg-cyan-200/40 dark:bg-cyan-500/10 blur-3xl" />
            </div>

            {/* Nav */}
            <header className="relative z-20 sticky top-0 border-b border-gray-200/70 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LogoMark className="w-8 h-8" />
                        <div>
                            <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">Simlab Edu</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Nền tảng Giáo dục Kỹ thuật số</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth" })}
                            className="lab-btn px-4 py-2 text-sm rounded-full"
                        >
                            Đăng nhập
                        </button>
                        <button onClick={handleEnterLab} className="lab-btn-primary px-4 py-2 text-sm rounded-full">
                            Lab Hóa học
                        </button>
                        <button onClick={handleEnterBiology} className="lab-btn px-4 py-2 text-sm rounded-full bg-emerald-500 text-white border-transparent hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                            Lab Sinh học
                        </button>
                        <button onClick={() => router.push("/physics")} className="lab-btn px-4 py-2 text-sm rounded-full bg-indigo-500 text-white border-transparent hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                            Lab Vật lý
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-14 md:pt-20 grid md:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-start">
                {/* Left: Hero */}
                <section>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                        </svg>
                        Chứng nhận Chuẩn GDPT 2018
                    </span>

                    <h2 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-gray-900 dark:text-white leading-[1.15] mt-6 mb-5 tracking-tight">
                        Nền tảng thực hành
                        <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                            Khoa Học Kỹ Thuật Số
                        </span>
                    </h2>
                    <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-xl">
                        Hệ sinh thái EdTech toàn diện giúp các trường học triển khai thí nghiệm Hóa học, Vật lý và Sinh học an toàn, tiết kiệm chi phí và đo lường được hiệu quả học tập theo thời gian thực.
                    </p>

                    <div className="flex flex-wrap gap-4 mb-10">
                        <button onClick={() => document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth" })} className="lab-btn-primary px-7 py-3.5 text-sm font-semibold rounded-full inline-flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300">
                            Khởi tạo lớp học miễn phí
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                        <button onClick={handleEnterLab} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-7 py-3.5 text-sm font-semibold rounded-full inline-flex items-center gap-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5">
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                            </svg>
                            Trải nghiệm Demo Hóa học
                        </button>
                    </div>



                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800/80 dark:to-blue-900/10 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.315 48.315 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">100%</p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Bám sát chương trình</p>
                        </div>
                        <div className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-800/80 dark:to-emerald-900/10 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">An toàn</p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Không rủi ro hóa chất</p>
                        </div>
                        <div className="bg-gradient-to-br from-white to-violet-50/50 dark:from-gray-800/80 dark:to-violet-900/10 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">AI</p>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Chấm điểm tự động</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2.5 inline-flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                </svg>
                                Dành cho giáo viên
                            </h3>
                            <ul className="text-[13px] text-gray-500 dark:text-gray-400 space-y-1.5">
                                <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 font-bold">✓</span> Tạo lớp học với mã mời học sinh</li>
                                <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 font-bold">✓</span> Giao thí nghiệm theo đúng bài học SGK</li>
                                <li className="flex gap-2"><span className="text-blue-500 dark:text-blue-400 font-bold">✓</span> Chấm điểm tự động, xuất CSV, in bảng điểm</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2.5 inline-flex items-center gap-2">
                                <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                                Dành cho học sinh
                            </h3>
                            <ul className="text-[13px] text-gray-500 dark:text-gray-400 space-y-1.5">
                                <li className="flex gap-2"><span className="text-violet-500 dark:text-violet-400 font-bold">✓</span> Vào lớp bằng mã mời</li>
                                <li className="flex gap-2"><span className="text-violet-500 dark:text-violet-400 font-bold">✓</span> Làm thí nghiệm ảo an toàn, có hướng dẫn từng bước</li>
                                <li className="flex gap-2"><span className="text-violet-500 dark:text-violet-400 font-bold">✓</span> Trả lời câu hỏi và nộp bài ngay trong phòng lab</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Right: Auth card */}
                <section id="auth-card" className="scroll-mt-24 lg:mt-6">
                    <div className="bg-white dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl shadow-blue-900/5 p-6 md:p-8 relative overflow-hidden">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Bắt đầu ngay</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Đăng nhập để vào hệ thống quản lý</p>
                        </div>
                        {/* Mode tabs */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 mb-5">
                            <button
                                onClick={() => { setMode("login"); setError(""); }}
                                aria-pressed={mode === "login"}
                                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === "login"
                                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                            >
                                Đăng nhập
                            </button>
                            <button
                                onClick={() => { setMode("register"); setError(""); }}
                                aria-pressed={mode === "register"}
                                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === "register"
                                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                            >
                                Đăng ký
                            </button>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-3.5" noValidate>
                            {mode === "register" && (
                                <>
                                    <div>
                                        <label htmlFor="auth-name" className="lab-label">Tên của bạn</label>
                                        <input
                                            id="auth-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="VD: Nguyễn Văn An"
                                            className="lab-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="lab-label">Bạn là ai?</label>
                                        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Chọn vai trò">
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={role === "student"}
                                                onClick={() => setRole("student")}
                                                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${role === "student"
                                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                                                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                Học sinh
                                            </button>
                                            <button
                                                type="button"
                                                role="radio"
                                                aria-checked={role === "teacher"}
                                                onClick={() => setRole("teacher")}
                                                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${role === "teacher"
                                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                                                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                Giáo viên
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="auth-school" className="lab-label">Trường (không bắt buộc)</label>
                                        <input
                                            id="auth-school"
                                            value={school}
                                            onChange={(e) => setSchool(e.target.value)}
                                            placeholder="VD: THPT Chuyên KHTN"
                                            className="lab-input"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label htmlFor="auth-email" className="lab-label">Email</label>
                                <input
                                    id="auth-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="lab-input"
                                />
                            </div>
                            <div>
                                <label htmlFor="auth-password" className="lab-label">Mật khẩu</label>
                                <input
                                    id="auth-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="lab-input"
                                />
                            </div>

                            {error && (
                                <div role="alert" className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 inline-flex items-start gap-1.5">
                                    <svg className="w-3.5 h-3.5 mt-px flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM12 3l9 18H3l9-18Z" />
                                    </svg>
                                    {error}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="remember-me" className="text-sm text-gray-600 dark:text-gray-400">
                                    Lưu đăng nhập
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="lab-btn-primary w-full px-4 py-2.5 text-sm rounded-lg inline-flex items-center justify-center gap-2"
                            >
                                {loading && <Spinner className="w-4 h-4" />}
                                {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                            </button>
                        </form>


                    </div>
                </section>

                {/* Product preview band */}
                <section className="mt-20 md:mt-28 lg:col-span-2">
                    <div className="text-center mb-10">
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Vì sao chọn Simlab</p>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100 mt-2">
                            Trải nghiệm học khoa học <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-violet-600">hoàn toàn mới</span>
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            {
                                icon: (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                                ),
                                title: "Phòng lab an toàn, sinh động",
                                desc: "Hóa học với 67 hóa chất. Sinh học với mô hình 3D xoay 360 độ. Làm thí nghiệm và tìm hiểu giải phẫu bất cứ lúc nào.",
                            },
                            {
                                icon: (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                ),
                                title: "Giao bài, chấm điểm tự động",
                                desc: "Giáo viên tạo lớp bằng mã mời, giao thí nghiệm theo đúng bài SGK, hệ thống tự chấm và xuất điểm CSV.",
                            },
                            {
                                icon: (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.648-.394 1.31-.713 1.982-.925m-4.874 4.325A9.046 9.046 0 0 1 9.75 10.25c.806 0 1.533-.446 2.031-1.08m-4.874 4.325a8.99 8.99 0 0 1-1.3 3.754m1.3-3.754a8.99 8.99 0 0 1 0-3.754m0 3.754.006.003m6.224-6.16a9.046 9.046 0 0 1 2.861-2.4c.648-.394 1.31-.713 1.982-.925m-4.843 3.325a8.99 8.99 0 0 1 1.3 3.754m-1.3-3.754.006-.003m0 3.754.006.003M16.5 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                ),
                                title: "Báo cáo chi tiết, trực quan",
                                desc: "Theo dõi điểm trung bình, phân bố điểm và tỷ lệ nộp bài từng lớp, từng bài tập bằng biểu đồ trực quan.",
                            },
                        ].map((f) => (
                            <div
                                key={f.title}
                                className="group bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                        {f.icon}
                                    </svg>
                                </div>
                                <h4 className="text-base font-bold text-gray-800 dark:text-gray-100">{f.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="relative z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <LogoMark className="w-8 h-8" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">Simlab Edu</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-xs">
                                Nền tảng thực hành khoa học kỹ thuật số toàn diện dành cho các trường trung học phổ thông. Giải pháp EdTech đạt chuẩn GDPT 2018.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">
                                    <span className="sr-only">Facebook</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">
                                    <span className="sr-only">LinkedIn</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sản phẩm</h3>
                            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Lab Hóa học (MVP)</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Lab Vật lý (Beta)</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Lab Sinh học (Sắp ra mắt)</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Bảng điều khiển Giáo viên</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">API Tích hợp LMS</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tài nguyên</h3>
                            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Tài liệu HDSD</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Giáo án GDPT 2018</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Thư viện Video</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Blog Giáo dục</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Cộng đồng Giáo viên</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Công ty</h3>
                            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Về chúng tôi</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Tuyển dụng</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Liên hệ Sales</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Điều khoản Dịch vụ</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Chính sách Bảo mật</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            © 2026 Simlab Enterprise. Đã đăng ký bản quyền. Được phát triển tại Việt Nam.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Bảo mật dữ liệu chuẩn ISO 27001</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            <span>Tuân thủ FERPA & GDPR</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
