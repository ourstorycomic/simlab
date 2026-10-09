"use client";

import React from "react";
import { ReactionResult, REACTION_TYPE_LABELS, REACTION_TYPE_BORDER } from "@/lib/reactions";

interface ReactionInfoProps {
    reaction: ReactionResult;
}

export default function ReactionInfo({ reaction }: ReactionInfoProps) {
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
        <div className="w-full max-w-lg mx-auto animate-slide-up">
            <div
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 ${REACTION_TYPE_BORDER[reaction.type] || "border-l-blue-400 dark:border-l-blue-500"} rounded-xl overflow-hidden transition-colors duration-200`}
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0">
                            {/* Reaction type icon based on reaction */}
                            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                {reaction.type === "acid_base" && (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75v4.5m0 4.5v4.5m0-13.5h4.5m-4.5 0H5.25m4.5 13.5h4.5m-4.5 0H5.25" />
                                )}
                                {reaction.type === "precipitation" && (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 21v-2.25M3 12h2.25M21 12h-2.25M5.636 5.636l1.591 1.591M16.773 16.773l1.591 1.591M5.636 18.364l1.591-1.591M16.773 7.227l1.591-1.591" />
                                )}
                                {reaction.type === "color_change" && (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072" />
                                )}
                                {reaction.type === "redox" && (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                                )}
                                {reaction.type === "gas_evolution" && (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18L8.25 8.5M12 3l3.75 5.5" />
                                )}
                                {reaction.type === "combustion" && (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                )}
                                {(reaction.type === "metal_acid" || reaction.type === "none" || (!["acid_base", "precipitation", "color_change", "redox", "gas_evolution", "combustion"].includes(reaction.type))) && (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                )}
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                Kết quả phản ứng
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                                    {REACTION_TYPE_LABELS[reaction.type] || "Phản ứng"}
                                </span>
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{reaction.description}</p>
                        </div>
                    </div>
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
                                <span
                                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[7px] font-bold"
                                    style={{
                                        backgroundColor: "#eff6ff",
                                        color: "#2563eb",
                                    }}
                                >
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
                        <div className="flex items-center gap-1.5">
                            {reaction.heatChange === "exothermic" ? (
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                </svg>
                            ) : reaction.heatChange === "endothermic" ? (
                                <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 21v-2.25M3 12h2.25M21 12h-2.25M5.636 5.636l1.591 1.591M16.773 16.773l1.591 1.591M5.636 18.364l1.591-1.591M16.773 7.227l1.591-1.591" />
                                </svg>
                            )}
                            <span className={`font-medium ${heatColor}`}>{heatText}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                            </svg>
                            <span className="text-gray-500 dark:text-gray-400 capitalize">{reaction.type.replace("_", " ")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Mức độ:</span>
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
            </div>
        </div>
    );
}
