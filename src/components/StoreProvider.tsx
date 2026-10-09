"use client";

import { useEffect, useState } from "react";
import { initStore } from "@/lib/storage";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        initStore()
            .then(() => setReady(true))
            .catch((err) => {
                console.error("Failed to initialize store:", err);
                setReady(true); // Proceed anyway to show UI or error boundary
            });
    }, []);

    if (!ready) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Đang khởi động Simlab Edu...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
