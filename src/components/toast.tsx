"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/** Hook dùng chung: const { showToast } = useToast(); */
export function useToast(): ToastContextValue {
    const ctx = React.useContext(ToastContext);
    if (!ctx) {
        // Cho phép dùng ngoài provider (không hiển thị) để tránh crash
        return { showToast: () => { } };
    }
    return ctx;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
    success: (
        <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
    error: (
        <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM12 3l9 18H3l9-18Z" />
        </svg>
    ),
    info: (
        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
    ),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType = "success") => {
            counter.current += 1;
            const id = counter.current;
            setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
            // Tự ẩn sau 3.5s (theo chuẩn edtech: 3–5s)
            setTimeout(() => dismiss(id), 3500);
        },
        [dismiss]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast stack */}
            <div
                aria-live="polite"
                className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,22rem)] pointer-events-none"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`lab-toast pointer-events-auto ${t.type === "success"
                            ? "lab-toast-success"
                            : t.type === "error"
                                ? "lab-toast-error"
                                : "lab-toast-info"
                            }`}
                    >
                        {TOAST_ICONS[t.type]}
                        <span className="flex-1 text-sm leading-snug">{t.message}</span>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="p-0.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Đóng thông báo"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
