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
        { target: "#tour-bio-sidebar, #tour-bio-sidebar-mobile", title: "Danh sách Mô hình", description: "Tại đây bạn có thể chọn các cơ quan sinh lý khác nhau để bắt đầu quan sát." },
        { target: "#tour-bio-viewer", title: "Khu vực Tương tác 3D", description: "Bạn có thể xoay, phóng to, thu nhỏ mô hình 3D tự do bằng chuột hoặc ngón tay. Hãy thử chạm/bấm vào các chấm xanh (hotspots) trên mô hình để xem các bộ phận chi tiết." },
        { target: "#tour-bio-info", title: "Bảng Thông tin chi tiết", description: "Các kiến thức chuyên sâu về cấu tạo và chức năng sinh học sẽ được hiển thị ở khu vực này, giúp bạn hiểu rõ hơn về đối tượng đang quan sát." }
    ];

    useEffect(() => {
        const hasSeen = localStorage.getItem("simlab-biology-tour");
        if (!hasSeen) {
            setTimeout(() => setTourOpen(true), 500);
            localStorage.setItem("simlab-biology-tour", "1");
        }
    }, []);

    return (
        <Suspense fallback={<LabFallback />}>
            <div className="relative w-full h-screen flex flex-col bg-white dark:bg-[#0a0e17] overflow-hidden">
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
