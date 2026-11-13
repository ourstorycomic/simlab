"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Footer, { LogoMark } from "@/components/Footer";
import {
    FlaskConical,
    Atom,
    Dna,
    Box,
    Trophy,
    GraduationCap,
    School,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
    Zap,
    ArrowRight,
    Play,
    Users,
    Compass,
    Check,
    ChevronRight,
    Lock,
    Eye,
    Smartphone,
    Bot,
} from "lucide-react";

type AuthRole = "student" | "teacher";
type AuthTab = "login" | "register";

export default function Home() {
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);

    // Auth Form State
    const [authMode, setAuthMode] = useState<AuthTab>("login");
    const [selectedRole, setSelectedRole] = useState<AuthRole>("student");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [school, setSchool] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Live interactive preview tab on homepage
    const [activeDemoTab, setActiveDemoTab] = useState<"chemistry" | "physics" | "biology" | "3d">("chemistry");

    useEffect(() => {
        seedIfNeeded();
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }, []);

    // Điều hướng nhanh khi đã có phiên đăng nhập
    const handleDashboardRedirect = useCallback(() => {
        if (!user) return;
        router.push(user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
    }, [user, router]);

    // Xử lý Đăng nhập / Đăng ký qua API & Local sync
    const handleAuth = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            seedIfNeeded();

            try {
                const cleanEmail = email.trim();
                let res;
                if (authMode === "register") {
                    res = await fetch("/api/auth/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: name.trim(),
                            email: cleanEmail,
                            password,
                            role: selectedRole,
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
                setUser(loggedIn);
                showToast(`Xin chào ${loggedIn.name}! Đăng nhập thành công.`);
                router.push(loggedIn.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
            } catch (err: any) {
                setError(err instanceof Error ? err.message : "Có lỗi xảy ra trong quá trình xác thực.");
            } finally {
                setLoading(false);
            }
        },
        [authMode, name, email, password, selectedRole, school, rememberMe, router, showToast]
    );

    // Đăng nhập nhanh tài khoản thử nghiệm dành cho Giáo viên / Học sinh
    const handleQuickDemoLogin = useCallback(
        (role: "teacher" | "student") => {
            setError("");
            const demoEmail = role === "teacher" ? "teacher@simlab.edu.vn" : "student@simlab.edu.vn";
            const demoPass = "123456";
            setEmail(demoEmail);
            setPassword(demoPass);
            setSelectedRole(role);
            setAuthMode("login");

            // Tự động submit demo
            setTimeout(async () => {
                setLoading(true);
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
                        setUser(loggedIn);
                        showToast(`Đã đăng nhập tài khoản mẫu: ${loggedIn.name}`);
                        router.push(role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
                    }
                } catch {
                    // Fallback local
                } finally {
                    setLoading(false);
                }
            }, 100);
        },
        [router, showToast]
    );

    return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
            {/* ─── 1. Unified Enterprise Navbar ─── */}
            <UnifiedNavbar currentSubject="home" />

            {/* ─── 2. Hero Section: Corporate & National Curriculum Authority ─── */}
            <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-slate-800/80">
                {/* Background Grid & Radial Lighting */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.22) 0%, transparent 60%), radial-gradient(#1e293b 1px, transparent 1px)`,
                        backgroundSize: "100% 100%, 32px 32px",
                    }}
                />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        
                        {/* Cột trái: Tuyên ngôn giá trị & Định vị thương hiệu EdTech */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            
                            {/* Huy hiệu Tiêu chuẩn GDPT 2018 */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold shadow-inner">
                                <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
                                <span>Chuẩn Chương trình Giáo dục Phổ thông 2018 (GDPT 2018)</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            </div>

                            {/* Tiêu đề chính mang tính học thuật & tầm vóc chuyển đổi số */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
                                Nền tảng Phòng Thí Nghiệm Số &{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">
                                    Mô Phỏng Khoa Học THPT
                                </span>
                            </h1>

                            {/* Nội dung giải pháp hướng tới Nhà trường, Thầy cô & Học sinh */}
                            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Giải pháp thực hành liên môn <strong>Hóa học — Vật lý — Sinh học</strong> toàn diện với công nghệ mô phỏng WebGL 3D, cử chỉ camera AI Hand Tracking và bộ điều khiển thông minh. Giúp các trường THPT chuẩn hóa cơ sở vật chất, triệt tiêu 100% rủi ro hóa chất độc hại và tiết kiệm 85% chi phí thực nghiệm.
                            </p>

                            {/* Nhóm nút hành động chính */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                                <Link
                                    href="/lab"
                                    className="px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <FlaskConical className="w-4 h-4" />
                                    <span>Trải nghiệm Phòng Lab Hóa</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>

                                <Link
                                    href="/lab/3d"
                                    className="px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400/80 transition-all flex items-center gap-2 hover:-translate-y-0.5"
                                >
                                    <Box className="w-4 h-4 text-cyan-400" />
                                    <span>Không Gian Lab 3D VR</span>
                                </Link>

                                <button
                                    onClick={() => document.getElementById("auth-portal")?.scrollIntoView({ behavior: "smooth" })}
                                    className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all"
                                >
                                    Cổng Giáo Viên & Nhà Trường
                                </button>
                            </div>

                            {/* Dải chỉ số kiểm chứng thực tế (Credibility Metrics) */}
                            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 text-left">
                                <div>
                                    <p className="text-2xl font-black text-white">107+</p>
                                    <p className="text-xs text-slate-400 font-medium">Hóa chất & Thuốc thử chuẩn</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-emerald-400">14</p>
                                    <p className="text-xs text-slate-400 font-medium">Hệ cơ quan giải phẫu 3D</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-indigo-400">100%</p>
                                    <p className="text-xs text-slate-400 font-medium">Chuẩn SGK GDPT 2018</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-amber-400">0%</p>
                                    <p className="text-xs text-slate-400 font-medium">Rủi ro cháy nổ & Khí độc</p>
                                </div>
                            </div>
                        </div>

                        {/* Cột phải: Cổng Đăng Nhập Doanh Nghiệp & Nhà Trường (Auth Portal) */}
                        <div className="lg:col-span-5" id="auth-portal">
                            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                                
                                {/* Decor viền trên */}
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />

                                <div className="mb-6 text-center sm:text-left">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-xl font-bold text-white tracking-tight">
                                            Cổng Giáo Dục THPT
                                        </h2>
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                            GDPT 2018
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Đăng nhập tài khoản cá nhân hoặc kết nối hệ thống trường học
                                    </p>
                                </div>

                                {/* Tabs Đăng nhập / Đăng ký */}
                                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800/80 mb-5">
                                    <button
                                        type="button"
                                        onClick={() => { setAuthMode("login"); setError(""); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                            authMode === "login"
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        Đăng Nhập
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setAuthMode("register"); setError(""); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                            authMode === "register"
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        Tạo Tài Khoản
                                    </button>
                                </div>

                                <form onSubmit={handleAuth} className="space-y-4">
                                    {authMode === "register" && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                                    Họ và Tên đầy đủ
                                                </label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                    placeholder="VD: Thầy Nguyễn Văn Minh hoặc Em Hoàng Mai"
                                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                                    Vai trò trong nhà trường
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRole("student")}
                                                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                            selectedRole === "student"
                                                                ? "bg-blue-500/15 border-blue-500/60 text-blue-300"
                                                                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                                                        }`}
                                                    >
                                                        <GraduationCap className="w-3.5 h-3.5" />
                                                        <span>Học sinh THPT</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRole("teacher")}
                                                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                            selectedRole === "teacher"
                                                                ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-300"
                                                                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                                                        }`}
                                                    >
                                                        <School className="w-3.5 h-3.5" />
                                                        <span>Giáo viên / Tổ CM</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                                    Trường THPT (Tùy chọn)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={school}
                                                    onChange={(e) => setSchool(e.target.value)}
                                                    placeholder="VD: THPT Chuyên Lê Hồng Phong"
                                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Địa chỉ Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="dia_chi_email@thpt.edu.vn"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Mật khẩu
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                placeholder="••••••••"
                                                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                            >
                                                {showPassword ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                    </svg>
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs leading-relaxed">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                                            />
                                            <span>Ghi nhớ phiên đăng nhập</span>
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        <span>{loading ? "Đang xác thực..." : authMode === "login" ? "Đăng Nhập Cổng Giáo Dục" : "Đăng Ký Tài Khoản"}</span>
                                    </button>
                                </form>

                                {/* Nút trải nghiệm nhanh dành cho Giám khảo & Thầy cô đánh giá */}
                                <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                                    <p className="text-[11px] text-slate-400 mb-2 font-medium">
                                        Tài khoản trải nghiệm đánh giá chuyên môn:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickDemoLogin("teacher")}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <School className="w-3 h-3 text-emerald-400" />
                                            <span>Giáo viên Demo</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickDemoLogin("student")}
                                            className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/50 text-blue-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <GraduationCap className="w-3 h-3 text-blue-400" />
                                            <span>Học sinh Demo</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── 3. Hệ Sinh Thái 3 Trụ Cột Khoa Học Tự Nhiên THPT ─── */}
            <section className="py-20 bg-[#080d19] border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60">
                            Khung Thực Nghiệm GDPT 2018
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
                            Hệ Sinh Thái 3 Phân Môn Khoa Học Cốt Lõi
                        </h2>
                        <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
                            Mỗi phân môn được thiết kế tỉ mỉ theo cấu trúc bài giảng chương trình SGK THPT hiện hành (Kết Nối Tri Thức, Cánh Diều, Chân Trời Sáng Tạo).
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        
                        {/* Card 1: Hóa học */}
                        <div className="group bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-sky-500/10">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <FlaskConical className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Hóa Học THPT</h3>
                                <p className="text-xs text-sky-400 font-semibold mb-4">Lớp 10 • Lớp 11 • Lớp 12</p>
                                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                    Mô phỏng 107+ hóa chất chuẩn phòng thí nghiệm: Phản ứng Oxi hóa - Khử, Axit - Bazơ, Muối, Kim loại kiềm, Dẫn xuất Hydrocarbon và Hóa học phức chất.
                                </p>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-sky-400 shrink-0" />
                                        <span>Cân bằng màu sắc pH chỉ thị thực tế</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-sky-400 shrink-0" />
                                        <span>Mô phỏng kết tủa, sinh khí, đổi nhiệt</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-sky-400 shrink-0" />
                                        <span>Gia sư AI nhận diện phản ứng & tính toán</span>
                                    </li>
                                </ul>
                            </div>
                            <Link
                                href="/lab"
                                className="mt-8 py-3 rounded-xl text-xs font-bold text-sky-400 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/40 text-center transition-colors flex items-center justify-center gap-1.5"
                            >
                                <span>Vào Lab Hóa Học</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Card 2: Vật lý */}
                        <div className="group bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Atom className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Vật Lý THPT</h3>
                                <p className="text-xs text-indigo-400 font-semibold mb-4">Cơ học • Điện từ • Quang học</p>
                                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                    Trực quan hóa các khái niệm trừu tượng: Dao động điều hòa con lắc đơn, Lắp ráp mạch điện xoay chiều R-L-C định luật Ôm và Quang hình học thấu kính.
                                </p>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <span>Đồ thị li độ, vận tốc & cơ năng thời gian thực</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <span>Tính toán dòng điện Ampe, Vôn tự động</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <span>Đường truyền tia sáng qua lăng kính & gương</span>
                                    </li>
                                </ul>
                            </div>
                            <Link
                                href="/physics"
                                className="mt-8 py-3 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 text-center transition-colors flex items-center justify-center gap-1.5"
                            >
                                <span>Vào Lab Vật Lý</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Card 3: Sinh học 3D */}
                        <div className="group bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/10">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Dna className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Sinh Học 3D</h3>
                                <p className="text-xs text-emerald-400 font-semibold mb-4">Giải Phẫu Học • Tế Bào Học</p>
                                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                    Quan sát giải phẫu 14 hệ cơ quan cơ thể người 3D độ phân giải cao và mô hình siêu vi bào quan tế bào thực vật (lục lạp, không bào, nhân tế bào).
                                </p>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Xoay 360°, bóc tách từng lớp cơ quan</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Kính hiển vi quang học ảo mô phỏng tế bào</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Hồ sơ giải phẫu & danh pháp Y khoa quốc tế</span>
                                    </li>
                                </ul>
                            </div>
                            <Link
                                href="/biology"
                                className="mt-8 py-3 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-center transition-colors flex items-center justify-center gap-1.5"
                            >
                                <span>Vào Lab Sinh Học 3D</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── 4. Đột Phá Công Nghệ SimLab (Innovation Showcase) ─── */}
            <section className="py-20 bg-[#070b14] border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60">
                            Công Nghệ Độc Quyền SimLab
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
                            Tương Tác Thực Nghiệm Đa Giác Quan Không Cần Thiết Bị Đắt Đỏ
                        </h2>
                        <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
                            Thay vì phải đầu tư kính VR hàng chục triệu đồng, SimLab ứng dụng thị giác máy tính AI và cảm biến di động để số hóa phòng học ngay trên máy tính hiện có.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        
                        {/* Feature 1: AI Hand Tracking */}
                        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5">
                                <Box className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">AI Camera Hand Tracking</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Nhận diện 21 khớp bàn tay theo thời gian thực qua webcam máy tính. Học sinh dùng ngón tay kẹp gắp dụng cụ, nghiêng rót ống nghiệm và chọn hóa chất tự nhiên như ở phòng lab thật.
                            </p>
                            <span className="text-[11px] font-semibold text-cyan-400">MediaPipe Vision AI • Không cần đeo găng hay cảm biến rời</span>
                        </div>

                        {/* Feature 2: Mobile Wand Remote */}
                        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">SimLab Wand Controller</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Quét mã QR 6 chữ số để biến điện thoại thông minh thành lọ hóa chất cảm biến. Dốc nghiêng điện thoại để đổ dung dịch, lắc điện thoại để hòa tan phản ứng với độ trễ cực thấp.
                            </p>
                            <span className="text-[11px] font-semibold text-blue-400">Supabase WebSockets & Con quay hồi chuyển 6-DoF</span>
                        </div>

                        {/* Feature 3: Cô giáo Mai AI */}
                        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
                                <Bot className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Trợ Lý Sư Phạm Cô Giáo Mai AI</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Tích hợp mô hình ngôn ngữ lớn chuyên sâu về SGK Hóa - Lý - Sinh THPT. Hướng dẫn từng bước thao tác an toàn, giải thích hiện tượng và phát hiện cảnh báo rủi ro ngay khi thực hiện.
                            </p>
                            <span className="text-[11px] font-semibold text-emerald-400">Giọng nói tiếng Việt chuẩn • Bám sát chuẩn kiến thức Bộ GD</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── 5. Dành Cho Nhà Trường & Giáo Viên (School Enterprise LMS) ─── */}
            <section className="py-20 bg-[#080d19] border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60">
                                Dành Cho Ban Giám Hiệu & Tổ Chuyên Môn
                            </span>
                            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                                Hệ Thống Quản Lý Thực Hành & Phân Tích Năng Lực Học Sinh
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                SimLab cung cấp bộ công cụ quản trị dành riêng cho thầy cô bộ môn: Giao bài tập theo phân phối chương trình, tự động chấm điểm thực hành và cảnh báo sớm các lỗ hổng kiến thức của lớp học.
                            </p>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Tạo Lớp & Giao Bài Bằng Mã Mời</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Học sinh nhập mã 6 ký tự để vào lớp mà không cần cài đặt phần mềm phức tạp.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">AI Phát Hiện &ldquo;Điểm Mù&rdquo; Kiến Thức Lớp Học</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Tự động tổng hợp các thao tác sai thường gặp để thầy cô điều chỉnh giáo án kịp thời.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Xuất Bảng Điểm CSV Chuẩn Định Dạng Bộ GD&ĐT</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Đồng bộ trực tiếp với sổ điểm điện tử của nhà trường (vnEdu, SMAS).</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Minh họa Giao diện Bảng điều khiển Giáo viên */}
                        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold text-white">Bảng Thống Kê Lớp 10A1 — Thí Nghiệm Oxi Hóa Khử</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">38/40 Học sinh nộp bài</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                                    <p className="text-xs text-slate-400">Điểm trung bình</p>
                                    <p className="text-xl font-bold text-emerald-400 mt-1">8.6 / 10</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                                    <p className="text-xs text-slate-400">Tỷ lệ hoàn thành</p>
                                    <p className="text-xl font-bold text-blue-400 mt-1">95%</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                                    <p className="text-xs text-slate-400">Vi phạm an toàn</p>
                                    <p className="text-xl font-bold text-rose-400 mt-1">0 Lỗi</p>
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300 leading-relaxed">
                                <strong>Nhận định sư phạm AI:</strong> 92% học sinh đã nhận biết chính xác hiện tượng đổi màu chỉ thị quỳ tím trong môi trường kiềm. Điểm cần củng cố: Tốc độ phản ứng khi tăng nhiệt độ.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── 6. Footer Doanh Nghiệp Chuẩn Quốc Tế ─── */}
            <Footer />
        </div>
    );
}
