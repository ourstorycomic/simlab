"use client";

import React, { useMemo, useState } from "react";
import { Experiment } from "@/lib/experiments";

interface AssignmentQuizProps {
    experiment: Experiment;
    assignmentTitle: string;
    /** ID học sinh hiện tại (null nếu chưa đăng nhập — không lưu kết quả) */
    studentId: string | null;
    customQuiz?: any[];
    onSubmit: (correctCount: number, totalQuestions: number, answers: number[]) => void;
    onClose: () => void;
}

export default function AssignmentQuiz({
    experiment,
    assignmentTitle,
    studentId,
    customQuiz,
    onSubmit,
    onClose,
}: AssignmentQuizProps) {
    const [answers, setAnswers] = useState<number[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

    const quizList = customQuiz || experiment.quiz || [];
    const total = quizList.length;
    const allAnswered = answers.filter(a => a !== undefined).length === total;

    const correctCount = useMemo(() => {
        return quizList.reduce(
            (sum, q, i) => (answers[i] === q.correctIndex ? sum + 1 : sum),
            0
        );
    }, [quizList, answers]);

    const handleSelect = (qIndex: number, optIndex: number) => {
        if (submitted) return;
        setAnswers((prev) => {
            const next = [...prev];
            next[qIndex] = optIndex;
            return next;
        });
    };

    const handleSubmit = () => {
        if (!allAnswered || submitted) return;
        setResult({ correct: correctCount, total });
        setSubmitted(true);
        if (studentId) {
            onSubmit(correctCount, total, answers);
        }
    };

    const score = result ? Math.round((result.correct / result.total) * 100) / 10 : 0;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm animate-scale-in">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800/95 border-b border-gray-100 dark:border-gray-700 px-5 py-4 flex items-start justify-between gap-3 rounded-t-xl">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                            Bài tập thí nghiệm
                        </p>
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                            {assignmentTitle}
                        </h2>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {experiment.name} · {total} câu hỏi
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"
                        title="Đóng"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Questions */}
                    {quizList.map((q, qi) => (
                        <div key={qi} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2.5">
                                <span className="text-blue-600 dark:text-blue-400 font-bold mr-1.5">
                                    Câu {qi + 1}.
                                </span>
                                {q.question}
                            </p>
                            <div className="space-y-1.5">
                                {q.options.map((opt: string, oi: number) => {
                                    const isSelected = answers[qi] === oi;
                                    const isCorrect = submitted && oi === q.correctIndex;
                                    const isWrongSelected = submitted && isSelected && oi !== q.correctIndex;
                                    return (
                                        <button
                                            key={oi}
                                            onClick={() => handleSelect(qi, oi)}
                                            disabled={submitted}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${isCorrect
                                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium"
                                                : isWrongSelected
                                                    ? "border-red-400 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                                                    : isSelected
                                                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                                                        : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600"
                                                }`}
                                        >
                                            <span className="mr-2 text-xs font-bold">
                                                {String.fromCharCode(65 + oi)}
                                            </span>
                                            {opt}
                                            {isCorrect && (
                                                <svg className="w-3.5 h-3.5 ml-2 inline-block text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            )}
                                            {isWrongSelected && (
                                                <svg className="w-3.5 h-3.5 ml-2 inline-block text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {submitted && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-lg px-3 py-2 inline-flex items-start gap-1.5">
                                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                    </svg>
                                    {q.explanation}
                                </p>
                            )}
                        </div>
                    ))}

                    {/* Result */}
                    {submitted && result && (
                        <div
                            className={`rounded-xl p-4 text-center border ${score >= 8
                                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
                                : score >= 5
                                    ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                                    : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                                }`}
                        >
                            <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
                                {score}/10
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Đúng {result.correct}/{result.total} câu
                            </p>
                            {studentId ? (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium inline-flex items-center gap-1 justify-center">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    Bài đã được nộp — giáo viên có thể xem kết quả của bạn.
                                </p>
                            ) : (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                                    Bạn chưa đăng nhập nên kết quả không được lưu. Hãy đăng nhập rồi làm lại.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        {!submitted ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="lab-btn px-4 py-2 text-sm rounded-xl flex-1"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!allAnswered}
                                    className="lab-btn-primary px-4 py-2 text-sm rounded-xl flex-1 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
                                >
                                    {allAnswered ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                            </svg>
                                            Nộp bài
                                        </>
                                    ) : `Trả lời ${answers.length}/${total}`}
                                </button>
                            </>
                        ) : (
                            <button onClick={onClose} className="lab-btn-primary px-4 py-2 text-sm rounded-xl flex-1">
                                Hoàn tất
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
