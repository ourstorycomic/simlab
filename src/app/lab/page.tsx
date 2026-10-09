import { Suspense } from "react";
import LabBench from "@/components/LabBench";

export const metadata = {
    title: "Phòng thí nghiệm",
    description: "Phòng thí nghiệm hóa học ảo Simlab — thực hành thí nghiệm an toàn, trực quan, bám sát chương trình GDPT 2018.",
};

function LabFallback() {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-[#0a0e17]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Đang khởi động phòng thí nghiệm…</p>
            </div>
        </div>
    );
}

export default function LabPage() {
    return (
        <Suspense fallback={<LabFallback />}>
            <LabBench />
        </Suspense>
    );
}
