"use client";

import { Suspense, useState, useEffect } from "react";
import BiologyBench from "@/components/BiologyBench";
import { Tour, TourStep } from "@/components/Tour";
import LabHeader from "@/components/LabHeader";

function LabFallback() {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-[#0a0e17]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Đang tải mô hình 3D Sinh học…</p>
            </div>
        </div>
    );
}

export default function BiologyPage() {
    const [tourOpen, setTourOpen] = useState(false);
    const tourSteps: TourStep[] = [
        { target: "#tour-bio-tabs", title: "3 Không gian Khám phá Sinh học 3D", description: "Dễ dàng chuyển đổi giữa Tế bào Thực vật siêu vi 3D, Giải phẫu Toàn thân người 14 hệ cơ quan, và 9 Mô hình Nội tạng chuyên sâu." },
        { target: "#tour-bio-workspace", title: "Tương tác 3D Trực quan", description: "Tự do xoay 360°, phóng to thu nhỏ, nhấp chọn bào quan để kích hoạt hiệu ứng phát sáng sinh học (shader pulse) hoặc bóc tách từng lớp hệ cơ quan (Solo Isolate)." },
        { target: "#tour-bio-inspector", title: "Hồ sơ Giải phẫu & Giao bài tập", description: "Tra cứu danh pháp Y khoa chuẩn, chức năng sinh hóa, thông tin kỳ thú và hoàn thành các bài tập thực hành môn Sinh học được giao." }
    ];

    useEffect(() => {
        // Phòng Lab 3D Sinh học chuyên dụng luôn tối ưu ở chế độ Dark Studio
        document.documentElement.classList.add("dark");
        const hasSeen = localStorage.getItem("simlab-biology-tour");
        if (!hasSeen) {
            setTimeout(() => setTourOpen(true), 500);
            localStorage.setItem("simlab-biology-tour", "1");
        }
    }, []);

    return (
        <Suspense fallback={<LabFallback />}>
            <div className="relative w-full h-screen flex flex-col bg-[#0a0e17] text-slate-100 overflow-hidden dark">
                <LabHeader
                    currentSubject="biology"
                    onTourOpen={() => setTourOpen(true)}
                />

                <div id="tour-biology-bench" className="flex-1 min-h-0 overflow-hidden">
                    <BiologyBench />
                </div>

                <Tour steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} />
            </div>
        </Suspense>
    );
}
