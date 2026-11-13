"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, getCurrentUser, seedIfNeeded } from "@/lib/storage";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Footer, { LogoMark } from "@/components/Footer";
import EnterpriseLabShowcase from "@/components/EnterpriseLabShowcase";
import {
    FlaskConical,
    Atom,
    Dna,
    Box,
    GraduationCap,
    School,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
    Zap,
    ArrowRight,
    Play,
    Users,
    ChevronRight,
    Smartphone,
    Bot,
    Layers,
    Activity,
    FileText,
} from "lucide-react";

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [activeDemoTab, setActiveDemoTab] = useState<"chemistry" | "physics" | "biology" | "3d">("chemistry");

    useEffect(() => {
        seedIfNeeded();
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }, []);

    // Danh sách 4 phân hệ Lab thí nghiệm chính
    const labShowcases = useMemo(() => [
        {
            id: "chemistry",
            subject: "Hóa Học 3D",
            badge: "GDPT 2018 • Tủ 107 Hóa Chất",
            title: "Mô Phỏng Phản Ứng & Rót Dung Dịch Chuẩn Phòng Thí Nghiệm",
            desc: "Trải nghiệm dốc rót chai hóa chất theo góc nghiêng thực tế, quan sát đổi màu chỉ thị quỳ tím, kết tủa keo, sủi bọt khí và tỏa nhiệt. 100% không khói độc, không nguy cơ bỏng axit.",
            features: [
                "Tủ hóa chất tiêu chuẩn 107 chất: Axit, Bazo, Muối, Kim loại & Chỉ thị màu",
                "Cảm biến gia tốc & Gyroscope: Cầm smartphone dốc rót bình như ngoài đời",
                "Tự động cân bằng phương trình ion thu gọn & giải thích bản chất electron",
            ],
            color: "emerald",
            icon: FlaskConical,
            route: "/lab",
            ctaText: "Vào Phòng Lab Hóa Học",
            previewBg: "from-emerald-950/40 to-slate-900",
            stat: "107+ Hóa chất",
        },
        {
            id: "physics",
            subject: "Vật Lý 3D",
            badge: "Lớp 10, 11 & 12 • Cơ - Điện - Quang",
            title: "Thí Nghiệm Quang Hình Học, Mạch Điện & Dao Động Điều Hòa",
            desc: "Kéo thả lắp ráp mạch điện định luật Ôm, điều chỉnh tiêu cự thấu kính hội tụ/phân kỳ, quan sát vệt tia sáng khúc xạ và đồ thị năng lượng con lắc đơn thời gian thực.",
            features: [
                "Mô phỏng thấu kính và ảnh thật/ảnh ảo với nguồn sáng đa điểm",
                "Lắp ráp vôn kế, ampe kế, điện trở biến thiên và đo dòng điện chính xác",
                "Đồ thị động năng - thế năng bảo toàn cơ năng với chu kỳ dao động",
            ],
            color: "sky",
            icon: Atom,
            route: "/physics",
            ctaText: "Vào Phòng Lab Vật Lý",
            previewBg: "from-sky-950/40 to-slate-900",
            stat: "3 Chuyên đề chính",
        },
        {
            id: "biology",
            subject: "Sinh Học 3D",
            badge: "Giải Phẫu Số • Tế Bào & Cơ Thể",
            title: "Atlas Cơ Thể Người & Cấu Trúc Tế Bào Thực Vật 3D",
            desc: "Bóc tách từng lớp cơ quan (Tim, Phổi, Não, Hệ tuần hoàn) trong không gian 3 chiều. Soi lát cắt tế bào thực vật quang hợp với độ phân giải hiển vi phân tử.",
            features: [
                "Atlas 3D bóc tách 8 hệ cơ quan sinh học người có thể xoay 360 độ",
                "Mô hình tế bào thực vật đa tầng: Lục lạp, ti thể, không bào & vách tế bào",
                "Tương tác cảm biến bàn tay cử chỉ (Hand Tracking) không cần chạm chuột",
            ],
            color: "purple",
            icon: Dna,
            route: "/biology",
            ctaText: "Vào Phòng Lab Sinh Học",
            previewBg: "from-purple-950/40 to-slate-900",
            stat: "8 Hệ cơ quan 3D",
        },
        {
            id: "3d",
            subject: "Lab 3D VR Chuyên Sâu",
            badge: "Độc Quyền • WebGL & Mobile Gyro",
            title: "Không Gian Phòng Lab Ảo Toàn Cảnh 360° Đạt Chuẩn Quốc Tế",
            desc: "Phòng thí nghiệm không gian 3D hoàn chỉnh với bàn đá ceramic chống ăn mòn, tủ hóa chất kính mở trượt, giáo viên AI hướng dẫn cử chỉ và đồng bộ 2 chiều với điện thoại.",
            features: [
                "Biến Smartphone thành con trỏ & bình hóa chất cầm tay qua mã QR tức thì",
                "Trợ lý AI Cô giáo Mai GDPT 2018 hỗ trợ hỏi đáp giọng nói 24/7",
                "Nhận diện bàn tay qua Webcam (MediaPipe Hand Tracking) chọn chất trong không trung",
            ],
            color: "amber",
            icon: Box,
            route: "/lab/3d",
            ctaText: "Mở Phòng Lab 3D VR",
            previewBg: "from-amber-950/40 to-slate-900",
            stat: "Đồng bộ Realtime 60fps",
        },
    ], []);

    const activeShowcase = useMemo(() => {
        return labShowcases.find((item) => item.id === activeDemoTab) || labShowcases[0];
    }, [activeDemoTab, labShowcases]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-slate-100 flex flex-col transition-colors duration-200">
            {/* 1. Header điều hướng thống nhất */}
            <UnifiedNavbar />

            {/* 2. Hero Section Doanh Nghiệp Cấp Quốc Gia với Live Animated Lab Stage */}
            <section className="relative pt-8 pb-14 md:pt-14 md:pb-20 overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-sky-50/50 via-transparent to-transparent dark:from-sky-950/20 dark:via-transparent dark:to-transparent">
                {/* Background decorative glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-indigo-500/10 dark:from-sky-500/15 dark:via-teal-500/15 dark:to-indigo-500/15 blur-3xl pointer-events-none -z-10 rounded-full" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                        {/* Cột trái: Tiêu đề Doanh nghiệp, Giới thiệu & CTA */}
                        <div className="lg:col-span-6 text-left space-y-5">
                            {/* Badge công nhận chương trình chuẩn */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/90 dark:bg-sky-950/90 border border-sky-300/60 dark:border-sky-700/50 text-sky-800 dark:text-sky-300 text-xs font-semibold shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Chương Trình GDPT 2018 Bộ GD&ĐT • Khối 10, 11 & 12</span>
                            </div>

                            {/* Headline Doanh Nghiệp */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-normal text-slate-900 dark:text-white leading-tight">
                                Nền Tảng Thực Hành{" "}
                                <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-600 dark:from-sky-400 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent">
                                    Thí Nghiệm Ảo 3D
                                </span>{" "}
                                Dành Cho THPT
                            </h1>

                            {/* Subtitle */}
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                                Giải pháp số hóa phòng thực hành môn Hóa học, Vật lý và Sinh học trực quan, an toàn tuyệt đối 100%. Tích hợp điều khiển cảm biến con quay hồi chuyển di động (Gyroscope Wand) và hệ thống LMS hỗ trợ kiểm tra, đánh giá kiến thức.
                            </p>

                            {/* CTA Group */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <Link
                                    href="/lab/3d"
                                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/25 border border-sky-400/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                                >
                                    <Box className="w-4 h-4" />
                                    <span>Vào Phòng Lab 3D VR</span>
                                    <ArrowRight className="w-4 h-4 ml-0.5" />
                                </Link>

                                <Link
                                    href="/login"
                                    className="px-5 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-md border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                                >
                                    <School className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                    <span>Cổng Đăng Nhập LMS</span>
                                </Link>

                                <Link
                                    href="/remote"
                                    className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm border border-emerald-300/60 dark:border-emerald-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
                                    title="Quét QR bằng điện thoại để cầm và rót bình thật"
                                >
                                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Cảm Biến Di Động</span>
                                </Link>
                            </div>

                            {/* Metrics row */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-3 max-w-lg">
                                <div>
                                    <div className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400">107+</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hóa chất chuẩn IUPAC</div>
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">An toàn phòng thí nghiệm</div>
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">3 Môn</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hóa • Lý • Sinh</div>
                                </div>
                            </div>
                        </div>

                        {/* Cột phải: Live Interactive Simulation Stage Component */}
                        <div className="lg:col-span-6 w-full">
                            <EnterpriseLabShowcase />
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Phân Hệ Trưng Bày Tương Tác (Interactive Product Window Mockup) */}
            <section className="py-16 md:py-24 bg-white dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Không Gian Thực Hành Đa Môn
                        </h2>
                        <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
                            Trải Nghiệm Trực Quan 4 Phân Hệ Phòng Lab Hiện Đại
                        </h3>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
                            Mỗi phân hệ được thiết kế bám sát bài học trong Sách giáo khoa Hóa học, Vật lý và Sinh học các bộ Kết Nối Tri Thức, Cánh Diều và Chân Trời Sáng Tạo.
                        </p>
                    </div>

                    {/* Tab Navigation Switcher */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
                        {labShowcases.map((tab) => {
                            const isCurrent = tab.id === activeDemoTab;
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveDemoTab(tab.id as any)}
                                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                        isCurrent
                                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md scale-102"
                                            : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                                    }`}
                                >
                                    <IconComponent className="w-4 h-4" />
                                    <span>{tab.subject}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Showcase Window Display Card */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-2xl overflow-hidden">
                        {/* Window Header */}
                        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                                <span className="text-xs text-slate-400 ml-2 font-mono hidden sm:inline">
                                    SimLab v2.5 • Chuẩn GDPT 2018 ({activeShowcase.subject})
                                </span>
                            </div>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-700/50 font-semibold">
                                {activeShowcase.badge}
                            </span>
                        </div>

                        {/* Content Window Grid */}
                        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            {/* Cột trái: Mô tả chi tiết phân hệ */}
                            <div className="lg:col-span-6 space-y-5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{activeShowcase.stat}</span>
                                </div>
                                <h4 className="text-xl sm:text-3xl font-extrabold text-white leading-snug">
                                    {activeShowcase.title}
                                </h4>
                                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                                    {activeShowcase.desc}
                                </p>

                                {/* Danh sách tính năng then chốt */}
                                <div className="space-y-2.5 pt-2">
                                    {activeShowcase.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Nút điều hướng vào Lab */}
                                <div className="pt-4 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={activeShowcase.route}
                                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        <span>{activeShowcase.ctaText}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
                                    >
                                        Xem Hướng Dẫn Giáo Viên
                                    </Link>
                                </div>
                            </div>

                            {/* Cột phải: Preview Mockup tương tác */}
                            <div className="lg:col-span-6">
                                <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-inner space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                                        <span className="font-semibold text-white">Bảng Điều Khiển Tương Tác Số</span>
                                        <span className="text-emerald-400 flex items-center gap-1 font-mono">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                                            Trực Tuyến 60 FPS
                                        </span>
                                    </div>

                                    {/* Thẻ mô phỏng tình huống */}
                                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-300">Thí nghiệm mẫu chọn lọc:</span>
                                            <span className="text-[11px] text-sky-400 font-mono">Bài thực hành số 02</span>
                                        </div>
                                        <p className="text-sm font-bold text-white">
                                            {activeDemoTab === "chemistry" && "Tác dụng của dd CuSO₄ với dd NaOH tạo kết tủa Cu(OH)₂ xanh lam"}
                                            {activeDemoTab === "physics" && "Xác định tiêu cự của thấu kính hội tụ bằng phương pháp dịch chuyển vật và màn ảnh"}
                                            {activeDemoTab === "biology" && "Quan sát cấu trúc phiến lá và lục lạp thực vật dưới kính hiển vi quang học"}
                                            {activeDemoTab === "3d" && "Cầm điện thoại di động dốc rót bình hóa chất vào cốc phản ứng và hỏi AI Cô giáo Mai"}
                                        </p>
                                        <div className="p-2.5 rounded-lg bg-slate-950 text-xs text-slate-300 border border-slate-800/80 font-mono">
                                            {activeDemoTab === "chemistry" && "CuSO4 + 2NaOH → Cu(OH)2↓ (xanh lam) + Na2SO4"}
                                            {activeDemoTab === "physics" && "1/f = 1/d + 1/d' | Độ phóng đại k = -d'/d"}
                                            {activeDemoTab === "biology" && "Cơ quan: Lục lạp (Chloroplast) • Quang hợp tạo ATP và NADPH"}
                                            {activeDemoTab === "3d" && "WebRTC Gyroscope Synced: Pitch, Roll, Acceleration 60Hz"}
                                        </div>
                                    </div>

                                    {/* Action link */}
                                    <div className="pt-2 text-center">
                                        <Link
                                            href={activeShowcase.route}
                                            className="text-xs text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1"
                                        >
                                            Nhấn vào đây để chạy thử nghiệm trực tiếp ngay trên trình duyệt →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Sáu Trụ Cột Giá Trị Cốt Lõi Cho Trường Học (Enterprise Value Matrix) */}
            <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        Giải Pháp Toàn Diện Cho Nhà Trường
                    </h2>
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
                        Nền Tảng Thực Hành Toàn Diện Dành Cho Giáo Viên & Học Sinh THPT
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
                        Giải quyết các rào cản về cơ sở vật chất phòng máy và thiết bị thí nghiệm, đảm bảo học sinh được quan sát, tương tác và hiểu sâu bản chất khoa học.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            An Toàn Tuyệt Đối 100%
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            Triệt tiêu hoàn toàn nguy cơ cháy nổ, ngộ độc khí Clo, SO₂, bỏng axit đặc sulfuric hay vỡ thủy tinh. Học sinh tự do khám phá các phản ứng nguy hiểm mà không gặp bất kỳ rủi ro nào.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            Điều Khiển Cảm Biến Gyro Độc Quyền
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            Biến chính chiếc điện thoại học sinh thành lọ hóa chất hoặc đũa phép. Nghiêng điện thoại để rót hóa chất vào cốc, lắc điện thoại để hòa tan kết tủa, tương tác chân thực như cầm bình ngoài đời.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                            <Bot className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            AI Cô Giáo Mai Chuẩn GDPT 2018
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            Trợ lý ảo thông minh đồng hành xuyên suốt quá trình thực hành. Giải đáp bản chất phản ứng, nhắc nhở an toàn, phân tích hiện tượng và hướng dẫn từng bước theo chuẩn sách giáo khoa mới.
                        </p>
                    </div>

                    {/* Card 4 */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            Hệ Thống LMS Quản Lý Lớp Học
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            Giáo viên dễ dàng giao bài tập thí nghiệm, bài trắc nghiệm củng cố và xem báo cáo kết quả thực hành của từng học sinh. Chấm điểm tự động và xuất báo cáo xếp hạng minh bạch.
                        </p>
                    </div>

                    {/* Card 5 */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            Tiết Kiệm 90% Chi Phí Vật Tư Tiêu Hao
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            Không còn nỗi lo hóa chất hết hạn sử dụng, chi phí mua sắm ống nghiệm, đèn cồn hay chi phí xử lý chất thải độc hại ra môi trường sau mỗi tiết thực hành tại phòng máy.
                        </p>
                    </div>

                    {/* Card 6 */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            Hoạt Động Mượt Trên Mọi Thiết Bị
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            Công nghệ WebGL và Three.js tối ưu hóa phần cứng, chạy mượt mà ngay trên máy tính phòng tin học của trường, Chromebook, iPad hay laptop cá nhân mà không cần cài đặt phần mềm phức tạp.
                        </p>
                    </div>
                </div>
            </section>

            {/* 5. Khung Khảo Sát Chương Trình GDPT 2018 (Curriculum Matrix) */}
            <section className="py-16 bg-slate-100/70 dark:bg-slate-950/40 border-y border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Chuẩn Chương Trình Bộ Giáo Dục
                        </h2>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            Bám Sát Khung Kiến Thức Các Khối Lớp 10, 11 và 12
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Lớp 10 */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                    Khối Lớp 10
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">GDPT 2018</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cơ Bản & Nền Tảng Khoa Học</h4>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                <li className="flex items-center gap-1.5">• Cấu tạo nguyên tử & Bảng tuần hoàn Men-đê-lê-ép</li>
                                <li className="flex items-center gap-1.5">• Phản ứng oxi hóa khử & Cân bằng electron</li>
                                <li className="flex items-center gap-1.5">• Động học chất điểm & Định luật bảo toàn cơ năng</li>
                                <li className="flex items-center gap-1.5">• Cấu tạo tế bào & Năng lượng sinh học</li>
                            </ul>
                        </div>

                        {/* Lớp 11 */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                                    Khối Lớp 11
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">GDPT 2018</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cân Bằng, Điện & Cơ Thể</h4>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                <li className="flex items-center gap-1.5">• Cân bằng hóa học & Dung dịch chất điện li (pH)</li>
                                <li className="flex items-center gap-1.5">• Hợp chất hữu cơ: Hydrocacbon & Dẫn xuất halogen</li>
                                <li className="flex items-center gap-1.5">• Dao động điều hòa, sóng cơ & quang hình học thấu kính</li>
                                <li className="flex items-center gap-1.5">• Giải phẫu tuần hoàn, hô hấp & hệ thần kinh người</li>
                            </ul>
                        </div>

                        {/* Lớp 12 */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                    Khối Lớp 12
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">GDPT 2018</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Nâng Cao & Ứng Dụng Thực Tiễn</h4>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                <li className="flex items-center gap-1.5">• Este - Lipit, Cacbohidrat & Polyme tổng hợp</li>
                                <li className="flex items-center gap-1.5">• Điện phân dung dịch & Ăn mòn kim loại</li>
                                <li className="flex items-center gap-1.5">• Dòng điện xoay chiều & Sóng ánh sáng giao thoa</li>
                                <li className="flex items-center gap-1.5">• Di truyền học phân tử, ADN & Công nghệ sinh học gen</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Banner Kêu Gọi Hành Động Dành Cho Trường Học (Institutional Call to Action) */}
            <section className="py-16 md:py-20 bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white border-t border-sky-800/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 border border-white/20 text-xs font-semibold">
                        <School className="w-3.5 h-3.5" />
                        <span>Dành Cho Ban Giám Hiệu & Tổ Chuyên Môn KHTN</span>
                    </div>

                    <h3 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                        Sẵn Sàng Nâng Tầm Chất Lượng Giảng Dạy Khoa Học Cho Trường Của Bạn?
                    </h3>

                    <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Đăng ký tài khoản trường học để nhận quyền quản trị phân công giáo viên, tạo lớp học trực tuyến và cấp mã tham gia cho toàn bộ học sinh các khối lớp.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                            href="/login?mode=register"
                            className="px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm sm:text-base shadow-lg transition-all"
                        >
                            Đăng Ký Tài Khoản Trường Học
                        </Link>
                        <Link
                            href="/login"
                            className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition-colors"
                        >
                            Đăng Nhập Trải Nghiệm Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* 7. Footer Thống Nhất */}
            <Footer />
        </div>
    );
}
