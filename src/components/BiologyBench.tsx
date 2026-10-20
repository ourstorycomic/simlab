"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getAssignmentById, Assignment } from "@/lib/storage";
import { experiments, Experiment } from "@/lib/experiments";
import BioAssignmentHud from "./biology/BioAssignmentHud";
import { OrganelleItem } from "./biology/data/organellesData";

import PlantCellViewer from "./biology/PlantCellViewer";
import HumanBodyAtlasViewer from "./biology/HumanBodyAtlasViewer";
import BioOrganViewer from "./biology/BioOrganViewer";

export type BioTabMode = "cell" | "human" | "organs";

export default function BiologyBench() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignment");

  // Assignment & Experiment State
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Tab Mode
  const [tabMode, setTabMode] = useState<BioTabMode>("cell");
  const [selectedOrganId, setSelectedOrganId] = useState<string>("heart");

  // Load assignment on mount or param change
  useEffect(() => {
    if (!assignmentId) {
      setAssignment(null);
      setActiveExperiment(null);
      return;
    }

    const a = getAssignmentById(assignmentId);
    if (a) {
      setAssignment(a);
      const exp = experiments.find((e) => e.id === a.experimentId);
      if (exp) {
        setActiveExperiment(exp);
        // Automatically switch to best tab
        if (exp.id.includes("cell")) {
          setTabMode("cell");
        } else if (exp.id.includes("human")) {
          setTabMode("human");
        } else {
          setTabMode("organs");
        }
      }
    }
  }, [assignmentId]);

  // Mark step complete
  const markStepComplete = useCallback((stepIdx: number) => {
    setCompletedSteps((prev) => (prev.includes(stepIdx) ? prev : [...prev, stepIdx]));
  }, []);

  const toggleStep = useCallback((stepIdx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIdx) ? prev.filter((i) => i !== stepIdx) : [...prev, stepIdx]
    );
  }, []);

  // Track exploration interactions
  const handleOrganelleSelect = useCallback(
    (org: OrganelleItem | null) => {
      if (org && activeExperiment?.id.includes("cell")) {
        markStepComplete(0);
        if (org.id === "cell-wall") markStepComplete(1);
        if (org.id === "chloroplast") markStepComplete(2);
        if (org.id === "vacuole") markStepComplete(3);
        if (org.id === "nucleus" || org.id === "mitochondrion") markStepComplete(4);
      }
    },
    [activeExperiment, markStepComplete]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-300">Đang khởi tạo môi trường 3D...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Assignment HUD (if in assignment mode) */}
      {assignment && activeExperiment && (
        <BioAssignmentHud
          assignment={assignment}
          experiment={activeExperiment}
          completedSteps={completedSteps}
          onToggleStep={toggleStep}
          onRefreshSubmission={() => {
            if (assignmentId) {
              const fresh = getAssignmentById(assignmentId);
              if (fresh) setAssignment(fresh);
            }
          }}
        />
      )}

      {/* Main Mode Navigation Bar */}
      <div id="tour-bio-tabs" className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 sm:px-5 sm:py-2 z-20 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
              Mô phỏng Sinh học 3D
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Chương trình GDPT 2018</p>
          </div>
        </div>

        {/* 3 Main Mode Switcher Pills */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTabMode("cell")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              tabMode === "cell"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
              <circle cx="12" cy="12" r="4" strokeWidth={2} />
            </svg>
            <span>Thế giới Tế bào 3D</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">8 loại</span>
          </button>

          <button
            onClick={() => setTabMode("human")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              tabMode === "human"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Giải phẫu toàn thân</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">14 hệ</span>
          </button>

          <button
            onClick={() => setTabMode("organs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              tabMode === "organs"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Nội tạng chuyên biệt</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">9</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Mô hình 3D tương tác</span>
        </div>
      </div>

      {/* Main 3D Workspace Area */}
      <div id="tour-bio-workspace" className="flex-1 w-full h-full relative overflow-hidden min-h-0">
        {tabMode === "cell" && (
          <PlantCellViewer onOrganelleSelect={handleOrganelleSelect} />
        )}

        {tabMode === "human" && (
          <HumanBodyAtlasViewer
            onStructureSelect={() => {
              if (activeExperiment?.id.includes("human")) {
                markStepComplete(0);
                markStepComplete(1);
                markStepComplete(4);
              }
            }}
            onNavigateToOrgan={(organId) => {
              setSelectedOrganId(organId);
              setTabMode("organs");
            }}
          />
        )}

        {tabMode === "organs" && (
          <BioOrganViewer
            selectedId={selectedOrganId}
            onBackToBody={() => setTabMode("human")}
            onOrganSelect={(org) => setSelectedOrganId(org.id)}
          />
        )}
      </div>
    </div>
  );
}
