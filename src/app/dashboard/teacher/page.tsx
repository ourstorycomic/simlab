"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Assignment,
    ClassRoom,
    User,
    createAssignment,
    createClass,
    getAssignmentsForClass,
    getClassById,
    getClasses,
    getCurrentUser,
    getStudentsForClass,
    getSubmissionsForAssignment,
    getUsers,
    logout,
    seedIfNeeded,
    setSession,
    deleteClass,
} from "@/lib/storage";
import { experiments, Experiment } from "@/lib/experiments";
import { curriculum } from "@/lib/curriculum";
import { useToast } from "@/components/toast";
import { Avatar, ProfileModal, ProgressBar } from "@/components/Avatar";
import { Tour, TourStep } from "@/components/Tour";
type Tab = "classes" | "assignments" | "results";

function getExperiment(id: string): Experiment | undefined {
    return experiments.find((e) => e.id === id);
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
    const csv = rows
        .map((r) =>
            r
                .map((cell) => {
                    const s = String(cell ?? "");
                    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
                })
                .join(",")
        )
        .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
        id: "classes",
        label: "Lớp học",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    },
    {
        id: "assignments",
        label: "Giao bài",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    },
    {
        id: "results",
        label: "Kết quả",
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
];

export default function TeacherDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [tab, setTab] = useState<Tab>("classes");

    // Class form
    const [className, setClassName] = useState("");
    const [grade, setGrade] = useState(9);
    const [subject, setSubject] = useState<"chemistry" | "physics" | "biology">("chemistry");
    const [classDesc, setClassDesc] = useState("");
    const [classError, setClassError] = useState("");
    const [classes, setClasses] = useState<ClassRoom[]>([]);

    // Assignment form
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedExpId, setSelectedExpId] = useState("");
    const [assignmentTitle, setAssignmentTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [targetCondition, setTargetCondition] = useState("");
    const [safetyRubric, setSafetyRubric] = useState("");
    const [assignError, setAssignError] = useState("");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [enableCustomQuiz, setEnableCustomQuiz] = useState(false);
    const [customQuiz, setCustomQuiz] = useState<any[]>([]);

    // Results
    const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
    const [selectedClassName, setSelectedClassName] = useState("");

    // Search/filter + hồ sơ
    const [profileOpen, setProfileOpen] = useState(false);
    const [classSearch, setClassSearch] = useState("");
    const [classGradeFilter, setClassGradeFilter] = useState(0);
    const [assignSearch, setAssignSearch] = useState("");

    // Modal state for delete confirmation
    const [classToDelete, setClassToDelete] = useState<{ id: string, name: string } | null>(null);

    // Tour state
    const [tourOpen, setTourOpen] = useState(false);
    const tourSteps: TourStep[] = [
        {
            target: "#tour-tab-classes",
            title: "1. Quản lý lớp học",
            description: "Đây là tab nơi bạn tạo lớp và quản lý danh sách học sinh.",
            tabId: "tour-tab-classes"
        },
        {
            target: "#class-name",
            title: "2. Đặt tên lớp học",
            description: "Nhập tên lớp học vào ô này (ví dụ: Hóa 10A1, Lý 11B).",
            tabId: "tour-tab-classes"
        },
        {
            target: "#btn-create-class",
            title: "3. Tạo lớp",
            description: "Bấm nút này để khởi tạo. Hệ thống sẽ cấp một mã 6 chữ số để gửi cho học sinh.",
            tabId: "tour-tab-classes"
        },
        {
            target: "#tour-tab-assignments",
            title: "4. Giao bài tập",
            description: "Bấm sang tab này để tiến hành giao bài thực hành.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#assign-class",
            title: "5. Chọn lớp",
            description: "Chọn lớp học mà bạn vừa tạo từ danh sách.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#assign-exp",
            title: "6. Chọn thí nghiệm",
            description: "Chọn một bài thực hành mô phỏng theo chuẩn chương trình GDPT 2018.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#btn-create-assignment",
            title: "7. Giao bài",
            description: "Hoàn tất việc giao bài cho học sinh bằng nút này.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#tour-tab-results",
            title: "8. Xem kết quả",
            description: "Cuối cùng, theo dõi điểm số, số câu đúng và các lỗi an toàn của học sinh tại tab Kết quả.",
            tabId: "tour-tab-results"
        }
    ];

    useEffect(() => {
        const hasSeenTour = localStorage.getItem("simlab-teacher-tour");
        if (!hasSeenTour) {
            setTimeout(() => setTourOpen(true), 500);
            localStorage.setItem("simlab-teacher-tour", "1");
        }
    }, []);

    const load = useCallback(() => {
        seedIfNeeded();
        setUser(getCurrentUser());
        setClasses(getClasses());
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // ─── Auth guard ───
    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            router.replace("/");
        } else if (u.role !== "teacher") {
            router.replace("/dashboard/student");
        } else {
            setUser(u);
        }
    }, [router]);

    // ─── Handlers ───
    const handleCreateClass = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setClassError("");
            if (!className.trim()) {
                setClassError("Vui lòng nhập tên lớp");
                return;
            }
            const u = getCurrentUser();
            if (!u) return;
            const created = createClass({
                name: className.trim(),
                teacherId: u.id,
                grade,
                subject,
                description: classDesc.trim() || undefined,
            });
            setClasses(getClasses());
            setClassName("");
            setClassDesc("");
            setSelectedClassId(created.id);
            setTab("assignments");
            showToast(`Đã tạo lớp "${created.name}" — mã mời: ${created.code}`);
        },
        [className, grade, subject, classDesc, showToast]
    );

    const handleDeleteClass = useCallback((id: string, name: string) => {
        setClassToDelete({ id, name });
    }, []);

    const confirmDeleteClass = useCallback(() => {
        if (classToDelete) {
            deleteClass(classToDelete.id);
            setClasses(getClasses());
            showToast(`Đã xóa lớp "${classToDelete.name}"`, "info");
            setClassToDelete(null);
        }
    }, [classToDelete, showToast]);

    const handleCreateAssignment = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setAssignError("");
            const u = getCurrentUser();
            if (!u) return;
            if (!selectedClassId) {
                setAssignError("Chọn lớp để giao bài");
                return;
            }
            if (!selectedExpId) {
                setAssignError("Chọn thí nghiệm để giao");
                return;
            }
            const exp = getExperiment(selectedExpId);
            const created = createAssignment({
                classId: selectedClassId,
                teacherId: u.id,
                experimentId: selectedExpId,
                title: assignmentTitle.trim() || `Thí nghiệm: ${exp?.name ?? ""}`,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                targetCondition: targetCondition.trim() || undefined,
                safetyRubric: safetyRubric.trim() ? safetyRubric.split("\n").map(s => s.trim()).filter(Boolean) : undefined,
                customQuiz: enableCustomQuiz && customQuiz.length > 0 ? customQuiz : undefined,
            });
            setAssignments(getAssignmentsForClass(selectedClassId));
            setSelectedExpId("");
            setAssignmentTitle("");
            setDueDate("");
            setTargetCondition("");
            setSafetyRubric("");
            setEnableCustomQuiz(false);
            setCustomQuiz([]);
            showToast(`Đã giao bài "${created.title}" cho lớp`);
        },
        [selectedClassId, selectedExpId, assignmentTitle, dueDate, targetCondition, safetyRubric, enableCustomQuiz, customQuiz, user, showToast]
    );

    const handleSelectClassForAssignments = useCallback((classId: string) => {
        setSelectedClassId(classId);
        setAssignments(getAssignmentsForClass(classId));
    }, []);

    // ─── Derived data ───
    const teacherClasses = useMemo(
        () => classes.filter((c) => c.teacherId === user?.id),
        [classes, user]
    );

    const selectedClassForResults = useMemo(
        () => (selectedClassName ? getClassById(selectedClassName) : null),
        [selectedClassName]
    );

    const resultsAssignments = useMemo(
        () => (selectedClassForResults ? getAssignmentsForClass(selectedClassForResults.id) : []),
        [selectedClassForResults]
    );

    const selectedAssignment = useMemo(
        () => resultsAssignments.find((a) => a.id === selectedAssignmentId) ?? null,
        [resultsAssignments, selectedAssignmentId]
    );

    const resultsSubmissions = useMemo(
        () => (selectedAssignmentId ? getSubmissionsForAssignment(selectedAssignmentId) : []),
        [selectedAssignmentId]
    );

    const selectedExp = useMemo(
        () => (selectedAssignment ? getExperiment(selectedAssignment.experimentId) : undefined),
        [selectedAssignment]
    );

    const gradeOptions = [8, 9, 10, 11, 12];
    const subjectOptions: { id: "chemistry" | "physics" | "biology", label: string }[] = [
        { id: "chemistry", label: "Hóa học" },
        { id: "biology", label: "Sinh học" },
        { id: "physics", label: "Vật lý" }
    ];

    const filteredTeacherClasses = useMemo(() => {
        const q = classSearch.trim().toLowerCase();
        return teacherClasses.filter((c) => {
            if (classGradeFilter && c.grade !== classGradeFilter) return false;
            if (q && !`${c.name} ${c.code} ${c.description ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [teacherClasses, classSearch, classGradeFilter]);

    const filteredAssignments = useMemo(() => {
        const q = assignSearch.trim().toLowerCase();
        if (!q) return assignments;
        return assignments.filter((a) => {
            const exp = getExperiment(a.experimentId);
            return `${a.title} ${exp?.name ?? ""}`.toLowerCase().includes(q);
        });
    }, [assignments, assignSearch]);

    // Báo cáo: điểm TB, phân bố điểm, tỷ lệ nộp
    const report = useMemo(() => {
        if (!selectedAssignment) return null;
        const subs = getSubmissionsForAssignment(selectedAssignment.id);
        const students = selectedClassForResults ? getStudentsForClass(selectedClassForResults.id) : [];
        const scores = subs.map((s) =>
            s.totalQuestions > 0 ? Math.round((s.correctCount / s.totalQuestions) * 100) / 10 : 0
        );
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const distribution = {
            low: scores.filter((s) => s < 5).length,
            mid: scores.filter((s) => s >= 5 && s < 8).length,
            high: scores.filter((s) => s >= 8).length,
        };
        const maxBar = Math.max(distribution.low, distribution.mid, distribution.high, 1);
        const submissionRate = students.length ? Math.round((subs.length / students.length) * 100) : 0;
        return { avg, distribution, maxBar, submissionRate, total: students.length, submitted: subs.length };
    }, [selectedAssignment, selectedClassForResults]);

    const handleExportCSV = useCallback(() => {
        const assignment = resultsAssignments.find((a) => a.id === selectedAssignmentId);
        if (!assignment) return;
        const exp = getExperiment(assignment.experimentId);
        const submissions = getSubmissionsForAssignment(assignment.id);
        const users = getUsers();
        const rows: (string | number)[][] = [
            ["STT", "Học sinh", "Email", "Điểm Tổng", "Điểm Lý Thuyết", "Điểm Thao Tác", "Lỗi Vi Phạm", "Thời gian nộp"],
            ...submissions.map((s, i) => {
                const student = users.find((u) => u.id === s.studentId);
                const theoryScore = s.totalQuestions > 0 ? Math.round((s.correctCount / s.totalQuestions) * 100) / 10 : 0;
                const score = Math.round(((theoryScore + (s.processScore ?? 0)) / 2) * 10) / 10;
                return [
                    i + 1,
                    student?.name ?? "Không rõ",
                    student?.email ?? "",
                    score,
                    `${s.correctCount}/${s.totalQuestions} (${theoryScore}/10)`,
                    s.processScore ?? 0,
                    (s.safetyErrors || []).join("; "),
                    new Date(s.submittedAt).toLocaleString("vi-VN"),
                ];
            }),
        ];
        downloadCSV(`simlab-${exp?.name ?? "assignment"}-ket-qua.csv`, rows);
        showToast("Đã xuất file CSV kết quả", "info");
    }, [resultsAssignments, selectedAssignmentId, showToast]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // ─── Not logged in ───
    if (!user) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="lab-skeleton w-40 h-4" />
                    <div className="lab-skeleton w-56 h-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300">
            <Tour steps={tourSteps} isOpen={tourOpen} onClose={() => setTourOpen(false)} />

            {/* Header */}
            <header className="no-print relative bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
                {/* Accent strip */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-600" aria-hidden="true" />
                <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar user={user} size="md" />
                        <div>
                            <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Bảng điều khiển giáo viên</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{user.name} · {user.school || "Chưa có trường"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setProfileOpen(true)} className="lab-btn px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-1.5">
                            
                            Hồ sơ
                        </button>
                        <button
                            onClick={() => setTourOpen(true)}
                            className="px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                            Hướng dẫn
                        </button>
                        <div id="tour-lab-buttons" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <span className="text-[10px] font-semibold text-gray-500 px-2 hidden sm:inline">Vào lab:</span>
                            <button onClick={() => router.push("/lab")} className="px-2 py-1 text-xs rounded hover:bg-white dark:hover:bg-gray-600 shadow-sm text-emerald-600 dark:text-emerald-400 font-medium">Lab Hóa học</button>
                            <button onClick={() => router.push("/physics")} className="px-2 py-1 text-xs rounded hover:bg-white dark:hover:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400 font-medium">Lab Vật lý</button>
                            <button onClick={() => router.push("/biology")} className="px-2 py-1 text-xs rounded hover:bg-white dark:hover:bg-gray-600 shadow-sm text-green-600 dark:text-green-400 font-medium">Lab Sinh học</button>
                        </div>
                        <button
                            onClick={() => { logout(); showToast("Đã đăng xuất khỏi Simlab", "info"); router.replace("/"); }}
                            className="lab-btn-danger px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-1.5"
                        >
                            
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-5 pt-6">
                <div className="no-print flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 w-fit mb-6">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            id={`tour-tab-${t.id}`}
                            onClick={() => setTab(t.id)}
                            aria-current={tab === t.id ? "page" : undefined}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 ${tab === t.id
                                ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ─── Tab: Lớp học ─── */}
                {tab === "classes" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Create class */}
                        <div id="tour-create-class" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Tạo lớp học mới</h2>
                            <form onSubmit={handleCreateClass} className="space-y-3.5" noValidate>
                                <div>
                                    <label htmlFor="class-name" className="lab-label">Tên lớp</label>
                                    <input
                                        id="class-name"
                                        value={className}
                                        onChange={(e) => setClassName(e.target.value)}
                                        placeholder="VD: 10A1 - Hóa học"
                                        className={`lab-input ${classError && !className.trim() ? "lab-input-error" : ""}`}
                                    />
                                    {classError && !className.trim() && (
                                        <p className="lab-field-error">{classError}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="lab-label">Khối lớp</span>
                                    <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Chọn khối lớp">
                                        {gradeOptions.map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                role="radio"
                                                aria-checked={grade === g}
                                                onClick={() => setGrade(g)}
                                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${grade === g
                                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                                                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                Lớp {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="lab-label">Môn học</span>
                                    <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Chọn môn học">
                                        {subjectOptions.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={subject === s.id}
                                                onClick={() => setSubject(s.id)}
                                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${subject === s.id
                                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                                                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="class-desc" className="lab-label">Mô tả (không bắt buộc)</label>
                                    <input
                                        id="class-desc"
                                        value={classDesc}
                                        onChange={(e) => setClassDesc(e.target.value)}
                                        placeholder="VD: Nhóm học sinh chuyên hóa kỳ 1"
                                        className="lab-input"
                                    />
                                </div>
                                {classError && className.trim() && (
                                    <p className="lab-field-error">{classError}</p>
                                )}
                                <button type="submit" className="lab-btn-primary w-full px-4 py-2.5 text-sm rounded-lg inline-flex items-center justify-center gap-1.5">
                                    
                                    Tạo lớp
                                </button>
                            </form>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3">
                                Mã mời được sinh tự động — gửi cho học sinh để các em vào lớp.
                            </p>
                        </div>

                        {/* Class list */}
                        <div id="tour-class-list" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Lớp của bạn ({filteredTeacherClasses.length})</h2>
                                <div className="flex gap-1.5 flex-wrap">
                                    <div className="relative">
                                        
                                        <input
                                            value={classSearch}
                                            onChange={(e) => setClassSearch(e.target.value)}
                                            placeholder="Tìm lớp..."
                                            aria-label="Tìm lớp"
                                            className="lab-input !w-36 pl-8 text-xs"
                                        />
                                    </div>
                                    <select
                                        value={classGradeFilter}
                                        onChange={(e) => setClassGradeFilter(Number(e.target.value))}
                                        aria-label="Lọc theo khối lớp"
                                        className="lab-select !w-24 !py-1.5 text-xs"
                                    >
                                        <option value={0}>Tất cả khối</option>
                                        {gradeOptions.map((g) => (
                                            <option key={g} value={g}>Lớp {g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {filteredTeacherClasses.length === 0 ? (
                                <div className="lab-empty">
                                    <div className="lab-empty-icon">
                                        
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có lớp nào — hãy tạo lớp đầu tiên.</p>
                                    <button
                                        onClick={() => {
                                            setTab("classes");
                                            setTimeout(() => {
                                                document.getElementById("create-class-name")?.focus();
                                            }, 50);
                                        }}
                                        className="lab-btn-primary mt-4 px-4 py-2 text-xs"
                                    >
                                        + Tạo lớp mới
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredTeacherClasses.map((c) => {
                                        const classAssignments = getAssignmentsForClass(c.id);
                                        const classStudents = getStudentsForClass(c.id);
                                        const submitted = classAssignments.reduce((acc, a) => acc + getSubmissionsForAssignment(a.id).length, 0);
                                        const totalPossible = classAssignments.length * classStudents.length;
                                        const rate = totalPossible ? Math.round((submitted / totalPossible) * 100) : 0;
                                        return (
                                            <div key={c.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                                c.subject === "physics" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300" :
                                                                c.subject === "biology" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                                "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                                            }`}>
                                                                {c.subject === "physics" ? "Vật lý" : c.subject === "biology" ? "Sinh học" : "Hóa học"}
                                                            </span>
                                                            {c.name}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                            Lớp {c.grade} · {c.description || "Không mô tả"}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-md px-2 py-1">
                                                        Mã: {c.code}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                                {classStudents.length} học sinh · {classAssignments.length} bài
                                                            </span>
                                                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                                                                {rate}% nộp bài
                                                            </span>
                                                        </div>
                                                        <ProgressBar value={rate} barClassName="bg-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => { handleSelectClassForAssignments(c.id); setTab("assignments"); }}
                                                        className="lab-btn px-2.5 py-1 text-[11px] rounded-lg inline-flex items-center gap-1"
                                                    >
                                                        
                                                        Giao bài
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedClassName(c.id); setTab("results"); }}
                                                        className="lab-btn px-2.5 py-1 text-[11px] rounded-lg inline-flex items-center gap-1"
                                                    >
                                                        
                                                        Kết quả
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClass(c.id, c.name)}
                                                        className="lab-btn-danger px-2.5 py-1 text-[11px] rounded-lg inline-flex items-center gap-1"
                                                    >
                                                        
                                                        Xóa lớp
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Tab: Giao bài ─── */}
                {tab === "assignments" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Form */}
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Giao bài thí nghiệm</h2>
                            <form onSubmit={handleCreateAssignment} className="space-y-3.5" noValidate>
                                <div>
                                    <label htmlFor="assign-class" className="lab-label">Chọn lớp</label>
                                    <select
                                        id="assign-class"
                                        value={selectedClassId}
                                        onChange={(e) => handleSelectClassForAssignments(e.target.value)}
                                        className="lab-select"
                                    >
                                        <option value="">— Chọn lớp —</option>
                                        {teacherClasses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} (mã {c.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="assign-exp" className="lab-label">Chọn thí nghiệm</label>
                                    <select
                                        id="assign-exp"
                                        value={selectedExpId}
                                        onChange={(e) => {
        const newExpId = e.target.value;
        setSelectedExpId(newExpId);
        if (enableCustomQuiz) {
            const exp = getExperiment(newExpId);
            if (exp && exp.quiz) {
                setCustomQuiz(JSON.parse(JSON.stringify(exp.quiz)));
            } else {
                setCustomQuiz([{ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }]);
            }
        }
    }}
                                        className="lab-select"
                                    >
                                        <option value="">— Chọn thí nghiệm —</option>
                                        {experiments
                                            .filter(exp => {
                                                if (!selectedClassId) return true;
                                                const cls = getClassById(selectedClassId);
                                                const clsSubj = cls?.subject || "chemistry";
                                                const expSubj = exp.subject || "chemistry";
                                                return clsSubj === expSubj;
                                            })
                                            .map((exp) => (
                                                <option key={exp.id} value={exp.id}>
                                                    Lớp {exp.grade} · {exp.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                {selectedExpId && (() => {
                                    const exp = getExperiment(selectedExpId);
                                    if (!exp) return null;
                                    return (
                                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2.5">
                                            <p className="text-[11px] text-blue-700 dark:text-blue-300 inline-flex items-start gap-1.5">
                                                
                                                <span>{exp.lesson}</span>
                                            </p>
                                            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 inline-flex items-start gap-1.5">
                                                
                                                <span>{exp.objectives[0]}</span>
                                            </p>
                                        </div>
                                    );
                                })()}
                                <div>
                                    <label htmlFor="assign-title" className="lab-label">Tiêu đề bài (không bắt buộc)</label>
                                    <input
                                        id="assign-title"
                                        value={assignmentTitle}
                                        onChange={(e) => setAssignmentTitle(e.target.value)}
                                        placeholder="VD: Bài thực hành số 1"
                                        className="lab-input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="assign-target" className="lab-label">Điều kiện đích (Target Condition)</label>
                                    <input
                                        id="assign-target"
                                        value={targetCondition}
                                        onChange={(e) => setTargetCondition(e.target.value)}
                                        placeholder="VD: Thu được đúng 50ml khí H2"
                                        className="lab-input"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Học sinh phải đạt điều kiện này để hoàn thành xuất sắc.</p>
                                </div>
                                <div>
                                    <label htmlFor="assign-rubric" className="lab-label">Rubric an toàn (Mỗi lỗi 1 dòng)</label>
                                    <textarea
                                        id="assign-rubric"
                                        value={safetyRubric}
                                        onChange={(e) => setSafetyRubric(e.target.value)}
                                        placeholder="VD: Quên đeo kính bảo hộ&#10;Đổ nước vào axit"
                                        className="lab-input resize-none h-16"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Hệ thống sẽ dựa vào rubric này để ghi log và trừ điểm thao tác.</p>
                                </div>
                                <div>
                                    <label htmlFor="assign-due" className="lab-label">Hạn nộp (không bắt buộc)</label>
                                    <input
                                        id="assign-due"
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="lab-input [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:dark:opacity-80 [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 cursor-pointer"
                                    />
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="lab-label mb-0">Tùy chỉnh bộ câu hỏi trắc nghiệm</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!enableCustomQuiz) {
                                                    const exp = getExperiment(selectedExpId);
                                                    if (exp && exp.quiz) {
                                                        setCustomQuiz(JSON.parse(JSON.stringify(exp.quiz)));
                                                    } else {
                                                        setCustomQuiz([{ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }]);
                                                    }
                                                }
                                                setEnableCustomQuiz(!enableCustomQuiz);
                                            }}
                                            className={`text-[10px] px-2 py-1 rounded font-medium ${enableCustomQuiz ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                                        >
                                            {enableCustomQuiz ? "Hủy tùy chỉnh" : "Bật tùy chỉnh"}
                                        </button>
                                    </div>
                                    {enableCustomQuiz && (
                                        <div className="space-y-4">
                                            {customQuiz.map((q, idx) => (
                                                <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[11px] font-bold">Câu hỏi {idx + 1}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCustomQuiz(customQuiz.filter((_, i) => i !== idx))}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={q.question}
                                                        onChange={(e) => {
                                                            const n = [...customQuiz];
                                                            n[idx].question = e.target.value;
                                                            setCustomQuiz(n);
                                                        }}
                                                        placeholder="Nhập nội dung câu hỏi..."
                                                        className="lab-input mb-2"
                                                    />
                                                    <div className="space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                                                        {q.options.map((opt: string, optIdx: number) => (
                                                            <div key={optIdx} className="flex items-center gap-2">
                                                                <input
                                                                    type="radio"
                                                                    name={`correct-${idx}`}
                                                                    checked={q.correctIndex === optIdx}
                                                                    onChange={() => {
                                                                        const n = [...customQuiz];
                                                                        n[idx].correctIndex = optIdx;
                                                                        setCustomQuiz(n);
                                                                    }}
                                                                    className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const n = [...customQuiz];
                                                                        n[idx].options[optIdx] = e.target.value;
                                                                        setCustomQuiz(n);
                                                                    }}
                                                                    placeholder={`Lựa chọn ${optIdx + 1}`}
                                                                    className="lab-input !py-1 text-xs"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={q.explanation}
                                                        onChange={(e) => {
                                                            const n = [...customQuiz];
                                                            n[idx].explanation = e.target.value;
                                                            setCustomQuiz(n);
                                                        }}
                                                        placeholder="Giải thích đáp án (tùy chọn)..."
                                                        className="lab-input mt-2 !py-1.5 text-[11px] bg-white dark:bg-gray-800"
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setCustomQuiz([...customQuiz, { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }])}
                                                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-500 hover:border-blue-500 transition-colors"
                                            >
                                                + Thêm câu hỏi
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {assignError && (
                                    <p className="lab-field-error">{assignError}</p>
                                )}
                                <button type="submit" className="lab-btn-primary w-full px-4 py-2.5 text-sm rounded-lg inline-flex items-center justify-center gap-1.5">
                                    
                                    Giao bài
                                </button>
                            </form>
                        </div>

                        {/* Assignment list */}
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                    Bài đã giao{selectedClassId ? ` — ${getClassById(selectedClassId)?.name ?? ""}` : ""}
                                </h2>
                                <div className="relative">
                                    
                                    <input
                                        value={assignSearch}
                                        onChange={(e) => setAssignSearch(e.target.value)}
                                        placeholder="Tìm bài đã giao..."
                                        aria-label="Tìm bài đã giao"
                                        className="lab-input !w-44 pl-8 text-xs"
                                    />
                                </div>
                            </div>
                            {filteredAssignments.length === 0 ? (
                                <div className="lab-empty">
                                    <div className="lab-empty-icon">
                                        
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedClassId
                                            ? "Lớp này chưa có bài giao."
                                            : "Chọn lớp để xem danh sách bài đã giao."}
                                    </p>
                                    {!selectedClassId && (
                                        <button
                                            onClick={() => {
                                                setSelectedClassId(teacherClasses[0]?.id ?? "");
                                                handleSelectClassForAssignments(teacherClasses[0]?.id ?? "");
                                            }}
                                            className="lab-btn-primary mt-4 px-4 py-2 text-xs"
                                        >
                                            + Giao bài ngay
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredAssignments.map((a) => {
                                        const exp = getExperiment(a.experimentId);
                                        const count = getSubmissionsForAssignment(a.id).length;
                                        return (
                                            <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{a.title}</p>
                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                            {exp ? `${exp.emoji} ${exp.name} · Lớp ${exp.grade}` : "Không rõ thí nghiệm"}
                                                        </p>
                                                        {a.dueDate && (
                                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 inline-flex items-center gap-1">
                                                                
                                                                Hạn: {new Date(a.dueDate).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="lab-badge-green">
                                                        {count} bài nộp
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedClassName(a.classId); setSelectedAssignmentId(a.id); setTab("results"); }}
                                                    className="mt-3 lab-btn px-2.5 py-1 text-[11px] rounded-lg inline-flex items-center gap-1"
                                                >
                                                    
                                                    Xem kết quả
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Tab: Kết quả ─── */}
                {tab === "results" && (
                    <div className="space-y-6">
                        <div className="no-print bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
                            <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="result-class" className="lab-label">Chọn lớp</label>
                                    <select
                                        id="result-class"
                                        value={selectedClassName}
                                        onChange={(e) => { setSelectedClassName(e.target.value); setSelectedAssignmentId(""); }}
                                        className="lab-select"
                                    >
                                        <option value="">— Chọn lớp —</option>
                                        {teacherClasses.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="result-assignment" className="lab-label">Chọn bài</label>
                                    <select
                                        id="result-assignment"
                                        value={selectedAssignmentId}
                                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                                        disabled={!selectedClassForResults}
                                        className="lab-select"
                                    >
                                        <option value="">— Chọn bài đã giao —</option>
                                        {resultsAssignments.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {getExperiment(a.experimentId)?.name ?? a.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {selectedAssignment ? (
                            <div className="print-area bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                            {selectedAssignment.title}
                                        </h2>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                            {selectedExp ? `${selectedExp.emoji} ${selectedExp.name} · ${selectedExp.lesson}` : "Thí nghiệm"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 no-print">
                                        <span className="lab-badge">
                                            {resultsSubmissions.length}/{report?.total ?? 0} bài nộp
                                        </span>
                                        <button
                                            onClick={handlePrint}
                                            disabled={resultsSubmissions.length === 0}
                                            className="lab-btn px-3 py-1.5 text-[11px] rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            
                                            In / PDF
                                        </button>
                                        <button
                                            onClick={handleExportCSV}
                                            disabled={resultsSubmissions.length === 0}
                                            className="lab-btn-primary px-3 py-1.5 text-[11px] rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            
                                            Xuất CSV
                                        </button>
                                    </div>
                                </div>

                                {/* Báo cáo: thẻ thống kê */}
                                {report && resultsSubmissions.length > 0 && (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 no-print">
                                        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3.5">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Điểm trung bình</p>
                                            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                                                {report.avg.toFixed(1)}<span className="text-xs font-medium text-gray-400">/10</span>
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3.5">
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Tỷ lệ nộp bài</p>
                                            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                                                {report.submissionRate}%<span className="text-xs font-medium text-gray-400"> ({report.submitted}/{report.total})</span>
                                            </p>
                                        </div>
                                        <div className="rounded-md border border-emerald-200 dark:border-emerald-800 p-3.5 bg-emerald-50/50 dark:bg-emerald-900/10">
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-1">Điểm 8-10</p>
                                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{report.distribution.high}</p>
                                        </div>
                                        <div className="rounded-md border border-red-200 dark:border-red-800 p-3.5 bg-red-50/50 dark:bg-red-900/10">
                                            <p className="text-[10px] text-red-600 dark:text-red-400 mb-1">Cần cải thiện (&lt;5)</p>
                                            <p className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{report.distribution.low}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Báo cáo: biểu đồ phân bố điểm */}
                                {report && resultsSubmissions.length > 0 && (
                                    <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 mb-5 no-print">
                                        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200 mb-3">Phân bố điểm</p>
                                        <div className="flex items-end gap-6 h-28">
                                            {[
                                                { label: "0 - 4", value: report.distribution.low, cls: "bg-red-400 dark:bg-red-500", note: "Yếu" },
                                                { label: "5 - 7", value: report.distribution.mid, cls: "bg-amber-400 dark:bg-amber-500", note: "Khá" },
                                                { label: "8 - 10", value: report.distribution.high, cls: "bg-emerald-500 dark:bg-emerald-400", note: "Tốt" },
                                            ].map((bar) => (
                                                <div key={bar.label} className="flex-1 flex flex-col items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 tabular-nums">{bar.value}</span>
                                                    <div
                                                        className={`w-full max-w-16 rounded-t-lg ${bar.cls} transition-all duration-500`}
                                                        style={{ height: `${Math.max((bar.value / report.maxBar) * 64, bar.value > 0 ? 10 : 3)}px` }}
                                                        title={`${bar.label} điểm: ${bar.value} học sinh`}
                                                    />
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{bar.label}</span>
                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 -mt-1">{bar.note}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {resultsSubmissions.length === 0 ? (
                                    <div className="lab-empty">
                                        <div className="lab-empty-icon">
                                            
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Chưa có học sinh nộp bài.
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                                            Nhắc học sinh vào phòng lab và ấn &quot;Nộp bài&quot; sau khi hoàn thành.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="lab-table-wrap">
                                        <table className="lab-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Học sinh</th>
                                                    <th>Tổng điểm</th>
                                                    <th>Lý thuyết</th>
                                                    <th>Thao tác</th>
                                                    <th>Nộp lúc</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resultsSubmissions.map((s, i) => {
                                                    const student = getUsers().find((u) => u.id === s.studentId);
                                                    const theoryScore = s.totalQuestions > 0 ? Math.round((s.correctCount / s.totalQuestions) * 100) / 10 : 0;
                                                    const score = Math.round(((theoryScore + (s.processScore ?? 0)) / 2) * 10) / 10;
                                                    return (
                                                        <tr key={s.id}>
                                                            <td className="text-gray-500 dark:text-gray-400">{i + 1}</td>
                                                            <td className="font-medium text-gray-800 dark:text-gray-100">
                                                                {student?.name ?? "Không rõ"}
                                                            </td>
                                                            <td>
                                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${score >= 8
                                                                    ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                                                                    : score >= 5
                                                                        ? "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                                                                        : "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                                                                    }`}>
                                                                    {score}/10
                                                                </span>
                                                            </td>
                                                            <td className="text-gray-600 dark:text-gray-300">
                                                                {s.correctCount}/{s.totalQuestions}
                                                            </td>
                                                            <td className="text-gray-600 dark:text-gray-300 relative group">
                                                                <span className={s.processScore < 10 ? "text-amber-600" : "text-emerald-600"}>{s.processScore}/10</span>
                                                                {s.safetyErrors && s.safetyErrors.length > 0 && (
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-[10px] p-2 rounded shadow-lg z-50">
                                                                        <p className="font-bold mb-1">Lỗi vi phạm:</p>
                                                                        <ul className="list-disc pl-3">
                                                                            {s.safetyErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="text-gray-500 dark:text-gray-400 text-xs">
                                                                {new Date(s.submittedAt).toLocaleString("vi-VN")}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-print lab-empty">
                                <div className="lab-empty-icon">
                                    
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Chọn lớp và bài để xem kết quả.
                                </p>
                                {teacherClasses.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setSelectedClassName(teacherClasses[0].id);
                                        }}
                                        className="lab-btn-primary mt-4 px-4 py-2 text-xs"
                                    >
                                        Xem lớp đầu tiên
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Class Confirmation Modal */}
            {classToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5">
                            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
                                <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    
                                </div>
                                <h3 className="font-bold text-base text-gray-900 dark:text-white">Xóa lớp học</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Bạn có chắc chắn muốn xóa lớp <span className="font-bold text-gray-900 dark:text-white">&quot;{classToDelete.name}&quot;</span> không?
                                Tất cả bài tập và dữ liệu học sinh trong lớp này sẽ bị gỡ bỏ. Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 px-5 py-4 flex gap-3 justify-end">
                            <button
                                onClick={() => setClassToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDeleteClass}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ProfileModal
                open={profileOpen}
                user={user}
                onClose={() => setProfileOpen(false)}
                onSaved={(updated) => {
                    setUser(updated);
                    load();
                }}
            />
        </div>
    );
}
