"use client";

import React, { useState } from "react";
import { Assignment, Submission, getSubmission, getCurrentUser } from "@/lib/storage";
import { Experiment } from "@/lib/experiments";
import BioQuizModal from "./BioQuizModal";

interface BioAssignmentHudProps {
  assignment: Assignment;
  experiment: Experiment;
  completedSteps: number[];
  onToggleStep: (idx: number) => void;
  onRefreshSubmission?: () => void;
}

export default function BioAssignmentHud({
  assignment,
  experiment,
  completedSteps,
  onToggleStep,
  onRefreshSubmission,
}: BioAssignmentHudProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  const user = getCurrentUser();
  const submission: Submission | null = user ? getSubmission(assignment.id, user.id) : null;

  const quizQuestions = assignment.customQuiz || experiment.quiz || [];
  const totalSteps = experiment.steps.length;
  const finishedStepsCount = completedSteps.length;
  const progressPercent = Math.round((finishedStepsCount / Math.max(1, totalSteps)) * 100);

  return (
    <>
      <div className="z-30 bg-slate-900/95 backdrop-blur-xl border-b border-emerald-500/40 shadow-xl px-3 py-2.5 sm:px-5 sm:py-3 text-slate-100 transition-all flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Assignment Header Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                  Bài tập Sinh học 3D
                </span>

                {submission ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1">
                    ✓ Đã hoàn thành · {submission.correctCount}/{submission.totalQuestions} câu đúng
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Chưa nộp bài
                  </span>
                )}

                {assignment.dueDate && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>

              <h2 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-md sm:max-w-xl">
                {assignment.title}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Steps Progress Mini-Pill */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all"
            >
              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span>
                {finishedStepsCount}/{totalSteps} bước
              </span>
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Take / Re-take Quiz Button */}
            <button
              onClick={() => setShowQuizModal(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg active:scale-95 ${
                submission
                  ? "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30"
              }`}
            >
              <span>{submission ? "Xem kết quả / Làm lại" : "Làm bài kiểm tra & Nộp"}</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Collapsible Steps Checklist */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Hướng dẫn tiến trình thực hành SGK ({experiment.lesson}):
              </span>
              {assignment.targetCondition && (
                <span className="text-[11px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                  Lưu ý của giáo viên: {assignment.targetCondition}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {experiment.steps.map((st, idx) => {
                const isChecked = completedSteps.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => onToggleStep(idx)}
                    className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                      isChecked
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                        : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleStep(idx)}
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="flex-1 leading-snug line-clamp-2">
                      <strong className="text-white mr-1">Bước {idx + 1}:</strong>
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuizModal && (
        <BioQuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          assignment={assignment}
          quizQuestions={quizQuestions}
          onSubmittedSuccess={() => {
            if (onRefreshSubmission) onRefreshSubmission();
          }}
        />
      )}
    </>
  );
}
