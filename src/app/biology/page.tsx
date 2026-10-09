"use client";
import { Suspense } from "react";
import BiologyBench from "@/components/BiologyBench";
import { Tour, TourStep } from "@/components/Tour";
import { useState, useEffect } from "react";

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
        { target: "#tour-biology-bench", title: "Mô hình sinh học", description: "Xoay, thu phóng và tương tác với các cơ quan 3D để xem chi tiết giải phẫu." }
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
            {/* Header for Biology Lab */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-6 justify-between">
                <div className="flex items-center gap-3">
                    <a href="/" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </a>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-800"></div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                        Sinh Học
                    </div>
                </div>
            </div>
            
            <div id="tour-biology-bench" className="flex-1"><BiologyBench /></div>
            <Tour steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} />
        </Suspense>
    );
}
