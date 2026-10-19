import React from "react";
import Link from "next/link";
import Image from "next/image";

export function LogoMark({
    className = "w-7 h-7",
    useWhiteBg = false,
}: {
    className?: string;
    useWhiteBg?: boolean;
}) {
    return (
        <Image
            src={useWhiteBg ? "/logo/logo.png" : "/logo/logo_catnen.png"}
            alt="Simlab Edu"
            width={36}
            height={36}
            className={`${className} object-contain shrink-0`}
            priority
        />
    );
}

export default function Footer({ className = "" }: { className?: string }) {
    return (
        <footer className={`relative z-10 bg-white dark:bg-slate-900/90 border-t border-gray-200 dark:border-slate-800 pt-16 pb-8 transition-colors ${className}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity">
                            <LogoMark className="w-8 h-8" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Simlab Edu</span>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-xs">
                            Nền tảng thực hành khoa học kỹ thuật số toàn diện dành cho các trường trung học phổ thông. Giải pháp EdTech đạt chuẩn GDPT 2018.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                                <span className="sr-only">Facebook</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                                <span className="sr-only">LinkedIn</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sản phẩm Lab</h3>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><Link href="/lab" className="hover:text-blue-500 transition-colors">Lab Hóa học (MVP)</Link></li>
                            <li><Link href="/physics" className="hover:text-blue-500 transition-colors">Lab Vật lý (Beta)</Link></li>
                            <li><Link href="/biology" className="hover:text-blue-500 transition-colors">Lab Sinh học 3D</Link></li>
                            <li><Link href="/dashboard/teacher" className="hover:text-blue-500 transition-colors">Bảng điều khiển Giáo viên</Link></li>
                            <li><Link href="/dashboard/student" className="hover:text-blue-500 transition-colors">Góc học tập Học sinh</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tài nguyên</h3>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Tài liệu HDSD</span></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Giáo án GDPT 2018</span></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Thư viện Video</span></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Blog Giáo dục</span></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Cộng đồng Giáo viên</span></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Về Simlab</h3>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><Link href="/" className="hover:text-blue-500 transition-colors">Trang chủ</Link></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Về chúng tôi</span></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Tuyển dụng</span></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Điều khoản Dịch vụ</span></li>
                            <li><span className="text-gray-400 dark:text-gray-500 cursor-default">Chính sách Bảo mật</span></li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        © 2026 Simlab Enterprise. Đã đăng ký bản quyền. Được phát triển tại Việt Nam.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Bảo mật dữ liệu chuẩn ISO 27001</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span>Tuân thủ chuẩn GDPT 2018</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
