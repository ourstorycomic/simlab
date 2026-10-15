"use client";

import React, { useState, useEffect } from "react";
import Pendulum from "./components/Pendulum";
import Circuit from "./components/Circuit";
import Optics from "./components/Optics";
import { Tour, TourStep } from "@/components/Tour";
import LabHeader from "@/components/LabHeader";

export default function PhysicsLab() {
    const [activeTab, setActiveTab] = useState<"pendulum" | "circuit" | "optics">("circuit");
    const [tourOpen, setTourOpen] = useState(false);
    const tourSteps: TourStep[] = [
        { target: "#tour-physics-tabs", title: "Khám phá Vật Lý", description: "Chào mừng đến với Lab Vật Lý. Ở đây được chia làm 3 phân môn chính, bạn có thể dễ dàng chuyển đổi bằng thanh công cụ này." },
        { target: "#tour-physics-main", title: "Thí nghiệm Động Lực Học", description: "Phân môn đầu tiên là Động lực học. Tại đây bạn có thể mô phỏng con lắc lò xo, thay đổi khối lượng và độ cứng để xem đồ thị dao động.", tabId: "tab-pendulum" },
        { target: "#tour-physics-main", title: "Thí nghiệm Điện Học", description: "Bấm sang tab Điện học, bạn sẽ được tự tay lắp ráp mạch điện với pin, bóng đèn, điện trở. Hệ thống sẽ tự động tính toán ampe và volt.", tabId: "tab-circuit" },
        { target: "#tour-physics-main", title: "Thí nghiệm Quang Học", description: "Phân môn Quang học cho phép bạn quan sát đường truyền ánh sáng qua thấu kính phân kỳ và hội tụ. Hãy thử kéo thả vật sáng để thấy sự thay đổi của ảnh.", tabId: "tab-optics" },
        { target: "#tour-physics-tabs", title: "Hoàn tất", description: "Sau khi thực hành xong, bạn có thể chuyển đổi nhanh giữa các môn hoặc sang các phòng lab khác qua thanh điều hướng phía trên." }
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
            <LabHeader
                currentSubject="physics"
                onTourOpen={() => setTourOpen(true)}
                centerContent={
                    <div id="tour-physics-tabs" className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
                        <button
                            id="tab-pendulum"
                            onClick={() => setActiveTab("pendulum")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activeTab === "pendulum"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                            }`}
                        >
                            Động Lực Học
                        </button>
                        <button
                            id="tab-circuit"
                            onClick={() => setActiveTab("circuit")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activeTab === "circuit"
                                    ? "bg-amber-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                            }`}
                        >
                            Điện Học
                        </button>
                        <button
                            id="tab-optics"
                            onClick={() => setActiveTab("optics")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                activeTab === "optics"
                                    ? "bg-sky-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                            }`}
                        >
                            Quang Học
                        </button>
                    </div>
                }
            />

            <Tour steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} />

            {/* Interactive Physics Simulator */}
            <main id="tour-physics-main" className="flex-1 flex overflow-hidden">
                {activeTab === "pendulum" && <Pendulum />}
                {activeTab === "circuit" && <Circuit />}
                {activeTab === "optics" && <Optics />}
            </main>
        </div>
    );
}
