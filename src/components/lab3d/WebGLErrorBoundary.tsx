"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class WebGLErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.warn("WebGLErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        // Cố gắng giải phóng WebGL contexts cũ trước khi tải lại trang
        try {
            const canvases = document.querySelectorAll("canvas");
            canvases.forEach((c) => {
                const gl = c.getContext("webgl2") || c.getContext("webgl");
                if (gl) {
                    const ext = gl.getExtension("WEBGL_lose_context");
                    if (ext) ext.loseContext();
                }
            });
        } catch {
            // Ignore
        }
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const isWebGLError =
                this.state.error?.message?.includes("WebGL") ||
                this.state.error?.message?.includes("context");

            return (
                this.props.fallback || (
                    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#060a10] text-white p-6 select-none">
                        <div className="bg-slate-900/90 border border-sky-500/40 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center">
                                <FlaskConical className="w-8 h-8 text-sky-400" />
                            </div>
                            <h2 className="text-lg font-bold text-sky-400 mb-2">
                                {isWebGLError ? "Khởi Động Lại Bộ Nhớ Đồ Họa 3D" : "Phòng Thí Nghiệm Đang Khởi Động Lại"}
                            </h2>
                            <p className="text-xs text-slate-300 leading-relaxed mb-6">
                                {isWebGLError
                                    ? "Trình duyệt đã dùng hết số lượng ngữ cảnh WebGL tối đa do mở nhiều tab hoặc tải lại trang liên tục. Hãy bấm nút bên dưới để giải phóng bộ nhớ đồ họa."
                                    : "Đã xảy ra sự cố hiển thị tạm thời. Vui lòng bấm tải lại để tiếp tục thí nghiệm."}
                            </p>
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Tải Lại Phòng Thí Nghiệm</span>
                            </button>
                            <div className="mt-4">
                                <a
                                    href="/lab"
                                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    ← Trở về phòng thí nghiệm 2D
                                </a>
                            </div>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
