"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Physics3DRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/lab/3d?subject=physics");
    }, [router]);

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#060a10] text-slate-300">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold">Đang chuyển đến Không Gian Lab 3D Hợp Nhất (Vật Lý)...</p>
        </div>
    );
}
