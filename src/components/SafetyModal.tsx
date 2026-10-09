"use client";

import React, { useEffect } from "react";

interface SafetyModalProps {
    open: boolean;
    chemicalName: string;
    warnings: string[];
    onClose: () => void;
    onAccept: () => void;
}

const WARNING_STYLES: Record<string, { label: string; classes: string; icon: string }> = {
    corrosive: {
        label: "Ăn mòn",
        classes: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700",
        icon: "M12 9v4m0 4h.01M12 3l9 18H3l9-18Z",
    },
    toxic: {
        label: "Độc hại",
        classes: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700",
        icon: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
    },
    flammable: {
        label: "Dễ cháy",
        classes: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700",
        icon: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z",
    },
    hazardous: {
        label: "Nguy hiểm",
        classes: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700",
        icon: "M12 9v3.75m0 3.75h.008v.008H12v-.008ZM12 3l9 18H3l9-18Z",
    },
};

export default function SafetyModal({ open, chemicalName, warnings, onClose, onAccept }: SafetyModalProps) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Cảnh báo an toàn">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm w-full max-w-md animate-scale-in overflow-hidden transition-colors duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50/60 dark:bg-amber-900/20">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-700">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM12 3l9 18H3l9-18Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Lưu ý an toàn</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="font-medium text-amber-600 dark:text-amber-400">{chemicalName}</span> cần thao tác cẩn thận
                        </p>
                    </div>
                </div>

                {/* Warnings */}
                <div className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                        {warnings.map((w) => {
                            const style = WARNING_STYLES[w] || WARNING_STYLES.hazardous;
                            return (
                                <span
                                    key={w}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${style.classes}`}
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                                    </svg>
                                    {style.label}
                                </span>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                        Hóa chất này có thể gây nguy hiểm nếu tiếp xúc trực tiếp với da, mắt hoặc hít phải. Hãy đeo găng tay, kính bảo hộ và thao tác trong khu vực thông gió tốt.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                    <button onClick={onClose} className="lab-btn text-xs px-3 py-1.5">
                        Hủy
                    </button>
                    <button onClick={onAccept} className="lab-btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Tôi đã hiểu, tiếp tục
                    </button>
                </div>
            </div>
        </div>
    );
}
