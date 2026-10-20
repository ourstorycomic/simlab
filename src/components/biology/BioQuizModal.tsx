"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { QuizQuestion } from "@/lib/experiments";
import { Assignment, submitAssignment, recordSubmission, getCurrentUser } from "@/lib/storage";

interface BioQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  quizQuestions: QuizQuestion[];
  onSubmittedSuccess?: (score: number) => void;
}

export default function BioQuizModal({
  isOpen,
  onClose,
  assignment,
  quizQuestions,
  onSubmittedSuccess,
}: BioQuizModalProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  if (!isOpen) return null;

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = quizQuestions.length;
  const isAllAnswered = answeredCount === totalCount;

  const handleSubmit = () => {
    if (isSubmitted) return;

    let correct = 0;
    const answersArray: number[] = [];

    quizQuestions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx] ?? -1;
      answersArray.push(userAns);
      if (userAns === q.correctIndex) {
        correct++;
      }
    });

    const calculatedScore = Math.round((correct / Math.max(1, totalCount)) * 10);
    setCorrectCount(correct);
    setScore(calculatedScore);
    setIsSubmitted(true);

    // Confetti on good score
    if (calculatedScore >= 7) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Submit to storage
    const user = getCurrentUser();
    if (user) {
      submitAssignment({
        assignmentId: assignment.id,
        studentId: user.id,
        correctCount: correct,
        totalQuestions: totalCount,
        answers: answersArray,
        processScore: 10,
        safetyErrors: [],
        actionsLog: [`Hoàn thành bài tập Sinh học: ${assignment.title} với điểm số: ${calculatedScore}/10`],
      });
      recordSubmission(user.id, calculatedScore);
    }

    if (onSubmittedSuccess) {
      onSubmittedSuccess(calculatedScore);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Phiếu Đánh Giá Thực Hành Sinh Học
              </span>
              <span className="text-xs text-slate-400">
                {answeredCount}/{totalCount} câu đã chọn
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">{assignment.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quiz Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Result Banner after submission */}
          {isSubmitted && (
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                score >= 8
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                  : score >= 5
                  ? "bg-sky-950/50 border-sky-500/40 text-sky-200"
                  : "bg-amber-950/50 border-amber-500/40 text-amber-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {score >= 8
                      ? "Kết quả xuất sắc: Nắm vững kiến thức"
                      : score >= 5
                      ? "Hoàn thành: Đạt yêu cầu thực hành"
                      : "Cần rà soát và ôn tập thêm"}
                  </h3>
                </div>
                <p className="text-xs mt-1 text-slate-300">
                  Đúng {correctCount}/{totalCount} câu hỏi · Kết quả đã được lưu tự động vào hệ thống giáo viên.
                </p>
              </div>

              <div className="text-center sm:text-right flex-shrink-0">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {score}
                </span>
                <span className="text-xs text-slate-400 block font-semibold">/10 Điểm</span>
              </div>
            </div>
          )}

          {/* Question List */}
          {quizQuestions.map((q, qIdx) => {
            const userChoice = selectedAnswers[qIdx];
            const isCorrect = userChoice === q.correctIndex;

            return (
              <div
                key={qIdx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="flex items-start gap-2.5 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                    {qIdx + 1}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {q.question}
                  </h4>
                </div>

                {/* Options */}
                <div className="space-y-2 pl-8">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userChoice === optIdx;
                    let optionStyle =
                      "bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white";

                    if (isSubmitted) {
                      if (optIdx === q.correctIndex) {
                        optionStyle =
                          "bg-emerald-950/80 border-emerald-500/80 text-emerald-200 font-bold shadow-md shadow-emerald-900/20";
                      } else if (isSelected) {
                        optionStyle =
                          "bg-red-950/80 border-red-500/80 text-red-200 line-through";
                      } else {
                        optionStyle = "bg-slate-900/40 border-slate-800/40 text-slate-500";
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "bg-emerald-500/20 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/30";
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {isSubmitted && optIdx === q.correctIndex && (
                          <span className="text-emerald-400 text-xs font-bold flex-shrink-0">
                            ✓ Đúng
                          </span>
                        )}
                        {isSubmitted && isSelected && !isCorrect && (
                          <span className="text-red-400 text-xs font-bold flex-shrink-0">
                            ✗ Sai
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {isSubmitted && q.explanation && (
                  <div className="mt-3.5 ml-8 p-3 bg-slate-900/80 rounded-xl border border-slate-700/50 text-xs text-slate-300 leading-relaxed">
                    <span className="text-[11px] font-bold text-emerald-400 block mb-0.5">
                      💡 Giải thích khoa học:
                    </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isSubmitted ? "Đóng bài kiểm tra" : "Quay lại mô hình 3D"}
          </button>

          {!isSubmitted ? (
            <button
              disabled={!isAllAnswered}
              onClick={handleSubmit}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                isAllAnswered
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 active:scale-95 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>Nộp bài & Chấm điểm</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all"
            >
              Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
