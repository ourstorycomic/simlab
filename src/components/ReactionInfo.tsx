"use client";

import React, { useState, useRef, useEffect } from "react";
import { ReactionResult, REACTION_TYPE_LABELS, REACTION_TYPE_BORDER } from "@/lib/reactions";
import RealReactionVideoModal from "./RealReactionVideoModal";
import { FlaskConical, ShieldAlert } from "lucide-react";

interface ReactionInfoProps {
    reaction: ReactionResult;
    onReset?: () => void;
    onReplay?: () => void;
    onOpenExperiments?: () => void;
}

export default function ReactionInfo({
    reaction,
    onReset,
    onReplay,
    onOpenExperiments,
}: ReactionInfoProps) {
    // Modal mở rộng toàn màn hình khi người dùng muốn xem to hơn
    const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
    const inlineVideoRef = useRef<HTMLVideoElement>(null);
    const [inlineMuted, setInlineMuted] = useState<boolean>(true);

    const hasVideo = Boolean(reaction.realVideo);

    // Khi modal mở thì tạm dừng inline video để tránh phát trùng 2 luồng âm thanh
    useEffect(() => {
        if (showVideoModal) {
            inlineVideoRef.current?.pause();
        } else {
            inlineVideoRef.current?.play().catch(() => {});
        }
    }, [showVideoModal]);

    const toggleInlineMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inlineVideoRef.current) {
            inlineVideoRef.current.muted = !inlineVideoRef.current.muted;
            setInlineMuted(inlineVideoRef.current.muted);
        }
    };

    const heatText =
        reaction.heatChange === "exothermic"
            ? "Tỏa nhiệt"
            : reaction.heatChange === "endothermic"
                ? "Thu nhiệt"
                : "Không đáng kể";

    const heatColor =
        reaction.heatChange === "exothermic"
            ? "text-orange-600 dark:text-orange-400"
            : reaction.heatChange === "endothermic"
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-gray-500 dark:text-gray-400";

    return (
        <div id="reaction-details-area" className={`w-full ${hasVideo ? "max-w-5xl" : "max-w-lg"} mx-auto animate-slide-up transition-all duration-300`}>
            <div
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${REACTION_TYPE_BORDER[reaction.type] || "border-l-blue-400 dark:border-l-blue-500"} rounded-2xl overflow-hidden transition-colors duration-200 shadow-xl`}
            >
                {hasVideo && reaction.realVideo ? (
                    /* ══════════════════════════════════════════════════════════════════════
                       LAYOUT TRỰC QUAN: KẾT QUẢ PHẢN ỨNG Ở TRÊN - VIDEO THỰC NGHIỆM Ở DƯỚI (IPAD/TABLET) / 2 CỘT (DESKTOP XL)
                       ══════════════════════════════════════════════════════════════════════ */
                    <div className="flex flex-col xl:grid xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-gray-100 dark:divide-gray-700/80">
                        {/* CỘT TRÁI: KẾT QUẢ PHẢN ỨNG */}
                        <div className="flex flex-col justify-between">
                            <div>
                                {/* Header */}
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-700 flex-shrink-0">
                                            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                Kết quả phản ứng
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 flex-shrink-0">
                                                    {REACTION_TYPE_LABELS[reaction.type] || "Phản ứng"}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed truncate">{reaction.description}</p>
                                        </div>
                                    </div>

                                    {onReset && (
                                        <button
                                            onClick={onReset}
                                            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                                            title="Dọn sạch bàn thí nghiệm để bắt đầu làm thí nghiệm khác (Phím tắt: L)"
                                        >
                                            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                                            <span>Làm thí nghiệm khác</span>
                                        </button>
                                    )}
                                </div>

                                {/* Equation */}
                                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <span className="w-3 h-px rounded-full bg-gray-300 dark:bg-gray-600" />
                                        Phương trình phản ứng
                                    </p>
                                    <div
                                        className="bg-gray-50 dark:bg-gray-900/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-center leading-relaxed border border-gray-100 dark:border-gray-700/80 text-gray-800 dark:text-gray-100 font-medium"
                                        dangerouslySetInnerHTML={{ __html: reaction.equationHtml }}
                                    />
                                </div>

                                {/* Observations */}
                                <div className="px-5 py-3.5">
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
                                        <span className="w-3 h-px rounded-full bg-gray-300 dark:bg-gray-600" />
                                        Hiện tượng quan sát được
                                    </p>
                                    <ul className="space-y-1.5">
                                        {reaction.observations.map((obs, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                                                <span className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[8px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200 dark:border-blue-800">
                                                    {i + 1}
                                                </span>
                                                <span className="leading-relaxed">{obs}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Details Footer */}
                            <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <span className={heatColor}>{heatText}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                                    <span>Mức độ:</span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3].map((level) => (
                                            <span
                                                key={level}
                                                className={`w-1.5 h-1.5 rounded-full ${reaction.effects.some((e) => {
                                                    const vals = { low: 1, medium: 2, high: 3 };
                                                    return vals[e.intensity] >= level;
                                                })
                                                    ? "bg-blue-500"
                                                    : "bg-gray-300 dark:bg-gray-600"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CỘT PHẢI: VIDEO PHẢN ỨNG THỰC TẾ NGOÀI ĐỜI THẬT */}
                        <div className="flex flex-col justify-between bg-gray-900 text-white p-5">
                            <div>
                                {/* Header video */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-800/80">
                                            Video Thực Nghiệm Ngoài Đời Thật
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setShowVideoModal(true)}
                                        className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors border border-gray-700"
                                        title="Phóng to rạp chiếu"
                                    >
                                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        <span>Phóng to</span>
                                    </button>
                                </div>

                                {/* Video Player lớn, sắc nét */}
                                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-gray-800 shadow-2xl group">
                                    <video
                                        ref={inlineVideoRef}
                                        src={reaction.realVideo.url}
                                        autoPlay
                                        muted={inlineMuted}
                                        loop
                                        playsInline
                                        controls
                                        className="w-full h-full object-contain"
                                    />

                                    {/* Nút bật / tắt tiếng nổi */}
                                    <button
                                        onClick={toggleInlineMute}
                                        className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-black/75 hover:bg-black/95 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1.5 border border-white/10 shadow transition-all"
                                    >
                                        {inlineMuted ? (
                                            <>
                                                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                </svg>
                                                <span>Bật tiếng</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                </svg>
                                                <span>Đang bật tiếng</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Chú thích video */}
                                <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-200 line-clamp-1">
                                        {reaction.realVideo.title}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                                        {reaction.realVideo.description}
                                    </p>
                                </div>
                            </div>

                            {/* Footer bên video */}
                            <div className="mt-3 pt-2.5 border-t border-gray-800 flex items-center justify-between text-[11px]">
                                <span className="text-amber-400/90 flex items-center gap-1.5 text-[10px]">
                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                    <span>Thí nghiệm cần thực hiện trong tủ hút độc</span>
                                </span>
                                <button
                                    onClick={() => setShowVideoModal(true)}
                                    className="text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    Phóng to rạp chiếu →
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ══════════════════════════════════════════════════════════════════════
                       LAYOUT ĐƠN GỌN GÀNG KHI PHẢN ỨNG CHƯA CÓ VIDEO THỰC TẾ
                       ══════════════════════════════════════════════════════════════════════ */
                    <div>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        Kết quả phản ứng
                                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 flex-shrink-0">
                                            {REACTION_TYPE_LABELS[reaction.type] || "Phản ứng"}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{reaction.description}</p>
                                </div>
                            </div>

                            {onReset && (
                                <button
                                    onClick={onReset}
                                    className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                                    title="Dọn sạch bàn thí nghiệm để bắt đầu làm thí nghiệm khác (Phím tắt: L)"
                                >
                                    <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                                    <span>Làm thí nghiệm khác</span>
                                </button>
                            )}
                        </div>

                        {/* Equation */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <span className="w-3 h-px rounded-full bg-gray-300 dark:bg-gray-600" />
                                Phương trình phản ứng
                            </p>
                            <div
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 text-xs text-center leading-relaxed border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                                dangerouslySetInnerHTML={{ __html: reaction.equationHtml }}
                            />
                        </div>

                        {/* Observations */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
                                <span className="w-3 h-px rounded-full bg-gray-300 dark:bg-gray-600" />
                                Hiện tượng quan sát được
                            </p>
                            <ul className="space-y-1.5">
                                {reaction.observations.map((obs, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[7px] font-bold bg-blue-50 text-blue-600">
                                            {i + 1}
                                        </span>
                                        <span className="leading-relaxed">{obs}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Details */}
                        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/80">
                            <div className="flex items-center gap-4 text-xs flex-wrap">
                                <span className={`font-medium ${heatColor}`}>{heatText}</span>
                                <span className="text-gray-500 dark:text-gray-400 capitalize">{reaction.type.replace("_", " ")}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                   THANH ĐIỀU HƯỚNG & NÚT LÀM THÍ NGHIỆM KHÁC (ACTION TOOLBAR)
                   ══════════════════════════════════════════════════════════════ */}
                <div className="px-5 py-3.5 bg-gray-50/95 dark:bg-gray-800/95 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {onReset && (
                            <button
                                onClick={onReset}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                                </svg>
                                <span>Làm thí nghiệm khác (Dọn bàn)</span>
                            </button>
                        )}

                        {onReplay && (
                            <button
                                onClick={onReplay}
                                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 border border-gray-200 dark:border-gray-600 shadow-sm"
                                title="Chạy lại phản ứng hiện tại"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                <span>Làm lại</span>
                            </button>
                        )}
                    </div>

                    {onOpenExperiments && (
                        <button
                            onClick={onOpenExperiments}
                            className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all border border-purple-200 dark:border-purple-800/60 shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                            </svg>
                            <span>Chọn bài thí nghiệm khác</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Modal phóng to rạp chiếu khi click */}
            {reaction.realVideo && (
                <RealReactionVideoModal
                    isOpen={showVideoModal}
                    onClose={() => setShowVideoModal(false)}
                    video={reaction.realVideo}
                    reaction={reaction}
                />
            )}
        </div>
    );
}
