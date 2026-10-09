"use client";

import React, { useState } from "react";
import Link from "next/link";
import Pendulum from "./components/Pendulum";
import Circuit from "./components/Circuit";
import Optics from "./components/Optics";
import { Tour, TourStep } from "@/components/Tour";
import { useEffect } from "react";

export default function PhysicsLab() {
    const [activeTab, setActiveTab] = useState<"pendulum" | "circuit" | "optics">("circuit");
    const [tourOpen, setTourOpen] = useState(false);
    const tourSteps: TourStep[] = [
        { target: "#tour-physics-tabs", title: "Khám phá Vật Lý", description: "Chào mừng đến với Lab Vật Lý. Ở đây được chia làm 3 phân môn chính, bạn có thể dễ dàng chuyển đổi bằng thanh công cụ này." },
        { target: "#tour-physics-main", title: "Thí nghiệm Động Lực Học", description: "Phân môn đầu tiên là Động lực học. Tại đây bạn có thể mô phỏng con lắc lò xo, thay đổi khối lượng và độ cứng để xem đồ thị dao động.", tabId: "tab-pendulum" },
        { target: "#tour-physics-main", title: "Thí nghiệm Điện Học", description: "Bấm sang tab Điện học, bạn sẽ được tự tay lắp ráp mạch điện với pin, bóng đèn, điện trở. Hệ thống sẽ tự động tính toán ampe và volt.", tabId: "tab-circuit" },
        { target: "#tour-physics-main", title: "Thí nghiệm Quang Học", description: "Phân môn Quang học cho phép bạn quan sát đường truyền ánh sáng qua thấu kính phân kỳ và hội tụ. Hãy thử kéo thả vật sáng để thấy sự thay đổi của ảnh.", tabId: "tab-optics" },
        { target: "header a", title: "Hoàn tất", description: "Sau khi thực hành xong, bạn có thể nhấn nút này để trở về trang chủ. Chúc bạn học tốt!" }
    ];

    useEffect(() => {
        const hasSeen = localStorage.getItem("simlab-physics-tour");
        if (!hasSeen) {
            setTimeout(() => setTourOpen(true), 500);
            localStorage.setItem("simlab-physics-tour", "1");
        }
    }, []);

    return (
        <div className="relative w-full h-screen flex flex-col bg-slate-900 text-slate-100 font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 px-6 py-4 flex items-center justify-between z-20 sticky top-0 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                        <svg viewBox="0 0 28 28" className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="14" cy="14" r="10" strokeLinecap="round" />
                            <path d="M14 4v20M4 14h20" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Simlab Vật Lý Khám Phá</h1>
                        <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Phòng thí nghiệm ảo chuẩn CTGDPT 2018</p>
                    </div>
                </div>

                {/* Tabs */}
                <div id="tour-physics-tabs" className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                    <button
                        id="tab-pendulum"
                        onClick={() => setActiveTab("pendulum")}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                            activeTab === "pendulum" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Động Lực Học
                    </button>
                    <button
                        id="tab-circuit"
                        onClick={() => setActiveTab("circuit")}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                            activeTab === "circuit" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Điện Học
                    </button>
                    <button
                        id="tab-optics"
                        onClick={() => setActiveTab("optics")}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                            activeTab === "optics" ? "bg-sky-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Quang Học
                    </button>
                </div>

                <Link href="/" className="px-5 py-2 text-sm font-bold rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all shadow-lg hover:shadow-xl border border-slate-600">
                    Trở về Trang chủ
                </Link>
            </header>
            <Tour steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} />

            <main id="tour-physics-main" className="flex-1 flex overflow-hidden">
                {activeTab === "pendulum" && <Pendulum />}
                {activeTab === "circuit" && <Circuit />}
                {activeTab === "optics" && <Optics />}
            </main>
        </div>
    );
}
