"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, getCurrentUser, seedIfNeeded } from "@/lib/storage";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Footer from "@/components/Footer";
import EnterpriseLabShowcase from "@/components/EnterpriseLabShowcase";
import {
    Box,
    GraduationCap,
    School,
    ShieldCheck,
    Sparkles,
    ArrowRight,
    Smartphone,
    Bot,
    Layers,
    Activity,
} from "lucide-react";

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        seedIfNeeded();
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-slate-100 flex flex-col transition-colors duration-200">
            {/* 1. Header điều hướng thống nhất */}
            <UnifiedNavbar />

            {/* 2. Hero Section Doanh Nghiệp Cấp Quốc Gia */}
            <section className="relative pt-12 pb-16 md:pt-18 md:pb-24 overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-sky-50/50 via-transparent to-transparent dark:from-sky-950/20 dark:via-transparent dark:to-transparent text-center">
                {/* Background decorative glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[360px] bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-indigo-500/10 dark:from-sky-500/15 dark:via-teal-500/15 dark:to-indigo-500/15 blur-3xl pointer-events-none -z-10 rounded-full" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Badge công nhận chương trình chuẩn */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/90 dark:bg-sky-950/90 border border-sky-300/60 dark:border-sky-700/50 text-sky-800 dark:text-sky-300 text-xs font-semibold shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>Chương Trình GDPT 2018 Bộ GD&ĐT • Khối 10, 11 & 12</span>
                    </div>

                    {/* Headline Doanh Nghiệp */}
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-normal text-slate-900 dark:text-white leading-tight max-w-4xl mx-auto">
                        Nền Tảng Thực Hành{" "}
                        <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-600 dark:from-sky-400 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent">
                            Thí Nghiệm Ảo 3D
                        </span>{" "}
                        Dành Cho THPT
                    </h1>

                    {/* Subtitle */}
                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                        Giải pháp số hóa phòng thực hành môn Hóa học, Vật lý và Sinh học trực quan, an toàn tuyệt đối 100%. Tích hợp điều khiển cảm biến con quay hồi chuyển di động (Gyroscope Wand) và hệ thống LMS hỗ trợ kiểm tra, đánh giá kiến thức.
                    </p>

                    {/* CTA Group */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                            href="/lab/3d"
                            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 border border-sky-400/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            <Box className="w-4 h-4" />
                            <span>Vào Phòng Lab 3D VR</span>
                            <ArrowRight className="w-4 h-4 ml-0.5" />
                        </Link>

                        <Link
                            href="/login"
                            className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-md border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <School className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                            <span>Cổng Đăng Nhập LMS</span>
                        </Link>

                        <Link
                            href="/remote"
                            className="px-5 py-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold text-sm border border-emerald-300/60 dark:border-emerald-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Quét QR bằng điện thoại để cầm và rót bình thật"
                        >
                            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Cảm Biến Di Động</span>
                        </Link>
                    </div>

                    {/* Metrics row */}
                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-4 max-w-xl mx-auto">
                        <div className="p-2">
                            <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">107+</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Hóa chất chuẩn IUPAC</div>
                        </div>
                        <div className="p-2">
                            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">An toàn phòng thực hành</div>
                        </div>
                        <div className="p-2">
                            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">3 Môn</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Hóa • Lý • Sinh</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Phân Hệ Trưng Bày Tương Tác Số (Interactive Product Suite) */}
            <section className="py-16 md:py-24 bg-white dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Mô Phỏng Trực Quan Thời Gian Thực</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                            Không Gian Thực Hành Thí Nghiệm Đa Môn
                        </h2>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
                            Tương tác trực tiếp với các mô hình thí nghiệm chuẩn theo chương trình GDPT 2018. Chọn phân hệ bên dưới để bắt đầu thử nghiệm.
                        </p>
                    </div>

                    {/* Sân Khấu Mô Phỏng Tương Tác Thật Đầy Đủ 4 Phân Hệ */}
                    <div className="max-w-5xl mx-auto">
                        <EnterpriseLabShowcase />
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
