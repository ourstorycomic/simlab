"use client";

import React from "react";
import { experiments, Experiment } from "@/lib/experiments";
import { getChemicalById } from "@/lib/chemicals";

interface ExperimentPanelProps {
    open: boolean;
    onClose: () => void;
    onRun: (exp: Experiment) => void;
}

const BADGE_STYLES: Record<Experiment["badge"], { label: string; classes: string }> = {
    gas: { label: "Sinh khí", classes: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700" },
    precipitate: { label: "Kết tủa", classes: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700" },
    flame: { label: "Cháy", classes: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700" },
    color: { label: "Đổi màu", classes: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-700" },
    heat: { label: "Nhiệt phân", classes: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700" },
};

export default function ExperimentPanel({ open, onClose, onRun }: ExperimentPanelProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Thí nghiệm mẫu">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-[26rem] max-w-full h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-sm overflow-y-auto animate-[slide-in-right_0.3s_ease-out] transition-colors duration-200">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-700">
                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Thí nghiệm mẫu</h2>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Chọn một thí nghiệm để thực hiện nhanh</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Đóng"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Experiment list */}
                <div className="p-4 space-y-3">
                    {experiments.map((exp) => {
                        const style = BADGE_STYLES[exp.badge];
                        return (
                            <div
                                key={exp.id}
                                className="bg-white dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-150"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-1.687C2.448 19.02 1.865 16.934 3.097 15.703L5 14.5" />
                                        </svg>
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">{exp.name}</h3>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-semibold border flex-shrink-0 ${style.classes}`}>
                                                {style.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">{exp.description}</p>
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="flex flex-wrap items-center gap-1 mt-2.5">
                                    {exp.stepLabels.map((label, i) => {
                                        const chem = getChemicalById(exp.chemicalIds[i]);
                                        return (
                                            <React.Fragment key={i}>
                                                {i > 0 && <span className="text-gray-300 dark:text-gray-600 text-[10px]">+</span>}
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: chem?.liquidColor || chem?.solidColor || chem?.color || "#3b82f6" }}
                                                    />
                                                    {label}
                                                </span>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                {/* Expected */}
                                <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed mt-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-2 border border-gray-100 dark:border-gray-700">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">Hiện tượng: </span>
                                    {exp.expected}
                                </p>

                                {exp.note && (
                                    <p className="text-[9px] text-amber-600 dark:text-amber-400 flex items-start gap-1 mt-2">
                                        <svg className="w-3 h-3 mt-px flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM12 3l9 18H3l9-18Z" />
                                        </svg>
                                        {exp.note}
                                    </p>
                                )}

                                {/* Run button */}
                                <button
                                    onClick={() => onRun(exp)}
                                    className="mt-3 w-full lab-btn-primary px-3 py-1.5 text-[11px] flex items-center justify-center gap-1.5"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                    </svg>
                                    Thực hiện thí nghiệm
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
