"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ActivityEntry,
    Assignment,
    BADGES,
    ClassRoom,
    User,
    UserProgress,
    getActivity,
    getAssignmentsForStudent,
    getClasses,
    getCurrentUser,
    getProgress,
    getStudentJoinedCodes,
    getSubmission,
    joinClass,
    leaveClass,
    logout,
    seedIfNeeded,
} from "@/lib/storage";
import { experiments, Experiment } from "@/lib/experiments";
import { curriculum, GradeCurriculum } from "@/lib/curriculum";
import { useToast } from "@/components/toast";
import { Avatar, BadgeChip, ProfileModal, XPBar } from "@/components/Avatar";
import { Tour, TourStep } from "@/components/Tour";
function getExperiment(id: string): Experiment | undefined {
    return experiments.find((e) => e.id === id);
}

const TABS = [
    { id: "all", label: "Tất cả" },
    { id: "grade-8", label: "Lớp 8" },
    { id: "grade-9", label: "Lớp 9" },
    { id: "grade-10", label: "Lớp 10" },
    { id: "grade-11", label: "Lớp 11" },
    { id: "grade-12", label: "Lớp 12" },
] as const;

const STATUS_TABS = [
    { id: "all", label: "Tất cả trạng thái" },
    { id: "done", label: "Đã nộp" },
    { id: "todo", label: "Chưa nộp" },
] as const;

const VIEW_TABS = [
    { id: "assignments", label: "Bài tập" },
    { id: "activity", label: "Hoạt động của tôi" },
] as const;

// Icon + màu cho từng loại hoạt động
const ACTIVITY_META: Record<ActivityEntry["type"], { icon: string; cls: string }> = {
    reaction: { icon: "🧪", cls: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20" },
    submit: { icon: "📝", cls: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20" },
    perfect: { icon: "💯", cls: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20" },
    streak: { icon: "🔥", cls: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20" },
    join: { icon: "🚪", cls: "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20" },
    profile: { icon: "👤", cls: "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" },
};

function formatActivityTime(at: number): string {
    const now = new Date();
    const d = new Date(at);
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOf = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayDiff = Math.round((startToday - startOf) / 86400000);
    if (dayDiff === 0) return `Hôm nay, ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    if (dayDiff === 1) return "Hôm qua";
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function StudentDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState("");
    const [joinedClasses, setJoinedClasses] = useState<ClassRoom[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [filterGrade, setFilterGrade] = useState<number | 0>(0);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [viewTab, setViewTab] = useState<string>("assignments");
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [activity, setActivity] = useState<ActivityEntry[]>([]);
    const [profileOpen, setProfileOpen] = useState(false);
    const [classToLeave, setClassToLeave] = useState<ClassRoom | null>(null);
    const [tourOpen, setTourOpen] = useState(false);

    const tourSteps: TourStep[] = [
        {
            target: "#tour-tab-assignments",
            title: "1. Bài tập của tôi",
            description: "Đây là tab hiển thị các bài tập giáo viên đã giao.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#tour-join-class",
            title: "2. Khu vực Lớp học",
            description: "Khu vực này dùng để quản lý và tham gia các lớp học của bạn."
        },
        {
            target: "#join-code",
            title: "3. Nhập mã lớp",
            description: "Nhập mã lớp gồm 6 chữ số do giáo viên cung cấp vào ô này."
        },
        {
            target: "#btn-join-class",
            title: "4. Tham gia",
            description: "Bấm nút này để xác nhận vào lớp. Các bài tập mới sẽ lập tức xuất hiện ở tab Bài tập."
        },
        {
            target: "#tour-free-lab",
            title: "5. Thực hành tự do",
            description: "Nếu không có bài tập, bạn vẫn có thể vào các phòng lab mô phỏng để tự do khám phá."
        },
        {
            target: "#tour-gamification",
            title: "6. Tiến độ của bạn",
            description: "Hệ thống sẽ ghi nhận điểm XP, chuỗi ngày học và trao huy hiệu cho bạn tại đây."
        }
    ];

    // Auto-start tour if first time
    useEffect(() => {
        const hasSeenTour = localStorage.getItem("simlab-student-tour");
        if (!hasSeenTour) {
            // Short delay to let animations finish
            setTimeout(() => setTourOpen(true), 500);
            localStorage.setItem("simlab-student-tour", "1");
        }
    }, []);

    const load = useCallback(() => {
        seedIfNeeded();
        const u = getCurrentUser();
        if (!u) return;
        const codes = getStudentJoinedCodes(u.id);
        const classes = getClasses().filter((c) => codes.includes(c.code));
        setJoinedClasses(classes);
        setAssignments(getAssignmentsForStudent(u.id));
        setProgress(getProgress(u.id));
        setActivity(getActivity(u.id, 40));
    }, []);

    const confirmLeaveClass = useCallback(() => {
        if (!user || !classToLeave) return;
        leaveClass(user.id, classToLeave.code);
        showToast(`Đã rời khỏi lớp "${classToLeave.name}"`, "info");
        setClassToLeave(null);
        load();
    }, [user, classToLeave, showToast, load]);

    useEffect(() => {
        load();
    }, [load]);

    // ─── Auth guard ───
    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            router.replace("/");
        } else if (u.role !== "student") {
            router.replace("/dashboard/teacher");
        } else {
            setUser(u);
        }
    }, [router]);

    const handleJoin = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setJoinError("");
            const u = getCurrentUser();
            if (!u) return;
            const code = joinCode.trim();
            if (!code) {
                setJoinError("Vui lòng nhập mã mời của lớp.");
                return;
            }
            try {
                const classRoom = joinClass(u.id, code);
                showToast(`Đã vào lớp "${classRoom.name}"`, "success");
                setJoinCode("");
                load();
            } catch (err) {
                setJoinError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            }
        },
        [joinCode, load, showToast]
    );

    const handleLogout = useCallback(() => {
        logout();
        showToast("Đã đăng xuất khỏi Simlab", "info");
        router.replace("/");
    }, [router, showToast]);

    const gradeCurriculums: GradeCurriculum[] = useMemo(() => curriculum, []);

    const filteredAssignments = useMemo(() => {
        const q = search.trim().toLowerCase();
        return assignments.filter((a) => {
            if (filterGrade) {
                const exp = getExperiment(a.experimentId);
                if (exp?.grade !== filterGrade) return false;
            }
            if (filterStatus === "done" && !getSubmission(a.id, user?.id ?? "")) return false;
            if (filterStatus === "todo" && getSubmission(a.id, user?.id ?? "")) return false;
            if (q) {
                const exp = getExperiment(a.experimentId);
                const hay = `${a.title} ${exp?.name ?? ""} ${exp?.lesson ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [assignments, filterGrade, filterStatus, search, user]);

    const earnedCount = progress?.badges.length ?? 0;

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
            <header className="relative bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
                {/* Accent strip */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-600" aria-hidden="true" />
                <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar user={user} size="md" />
                        <div>
                            <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Không gian học tập</h1>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                {user.name} · {user.school || "Chưa có trường"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setProfileOpen(true)}
                            className="lab-btn px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-1.5"
                        >
                            
                            Hồ sơ
                        </button>
                        <button
                            onClick={() => setTourOpen(true)}
                            className="px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                            Hướng dẫn
                        </button>
                        <div id="tour-free-lab" className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <span className="text-[10px] font-semibold text-gray-500 px-2 hidden sm:inline">Lab tự do:</span>
                            <button onClick={() => router.push("/lab")} className="px-2 py-1 text-xs rounded hover:bg-white dark:hover:bg-gray-600 shadow-sm text-emerald-600 dark:text-emerald-400 font-medium">Lab Hóa học</button>
                            <button onClick={() => router.push("/physics")} className="px-2 py-1 text-xs rounded hover:bg-white dark:hover:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400 font-medium">Lab Vật lý</button>
                            <button onClick={() => router.push("/biology")} className="px-2 py-1 text-xs rounded hover:bg-white dark:hover:bg-gray-600 shadow-sm text-green-600 dark:text-green-400 font-medium">Lab Sinh học</button>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="lab-btn-danger px-3 py-1.5 text-xs rounded-lg"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 py-6 space-y-6">
                {/* Gamification: XP + streak + badges */}
                <div id="tour-gamification" className="grid md:grid-cols-3 gap-6 items-start">
                    <XPBar xp={progress?.xp ?? 0} streak={progress?.streak ?? 0} />
                    <div className="md:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 inline-flex items-center gap-2">
                                
                                Huy hiệu của tôi
                            </h2>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                {earnedCount}/{BADGES.length} huy hiệu
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {BADGES.map((b) => (
                                <BadgeChip key={b.id} badge={b} earned={progress?.badges.includes(b.id) ?? false} />
                            ))}
                        </div>
                        {earnedCount === 0 && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2.5">
                                Hãy làm thí nghiệm và nộp bài để mở khóa huy hiệu đầu tiên nhé!
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 items-start">
                    {/* Left column: Join class + curriculum */}
                    <div className="space-y-6">
                        {/* Join class */}
                        <div id="tour-join-class" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-5">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Vào lớp bằng mã mời</h2>
                            <form onSubmit={handleJoin} noValidate className="space-y-2.5">
                                <div>
                                    <label htmlFor="join-code" className="lab-label">Mã mời của lớp</label>
                                    <input
                                        id="join-code"
                                        value={joinCode}
                                        onChange={(e) => {
                                            setJoinCode(e.target.value.toUpperCase());
                                            if (joinError) setJoinError("");
                                        }}
                                        placeholder="VD: HOA10A"
                                        aria-invalid={!!joinError}
                                        className={`lab-input font-mono uppercase tracking-widest ${joinError ? "lab-input-error" : ""}`}
                                    />
                                    {joinError && (
                                        <p className="lab-field-error" role="alert">{joinError}</p>
                                    )}
                                </div>
                                <button type="submit" className="lab-btn-primary w-full px-4 py-2 text-sm rounded-lg">
                                    Tham gia lớp
                                </button>
                            </form>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2.5 inline-flex items-center gap-1">
                                
                                Thử mã demo: <span className="font-mono">HOA10A</span>
                            </p>
                        </div>

                        {/* Joined classes */}
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-5">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">
                                Lớp của bạn ({joinedClasses.length})
                            </h2>
                            {joinedClasses.length === 0 ? (
                                <div className="lab-empty py-6">
                                    <div className="lab-empty-icon">
                                        
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Chưa tham gia lớp nào.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {joinedClasses.map((c) => (
                                        <div key={c.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between gap-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                        c.subject === "physics" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300" :
                                                        c.subject === "biology" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                        "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                                    }`}>
                                                        {c.subject === "physics" ? "Vật lý" : c.subject === "biology" ? "Sinh học" : "Hóa học"}
                                                    </span>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                                                </div>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                                    Lớp {c.grade} · Mã: <span className="font-mono font-bold text-gray-600 dark:text-gray-300">{c.code}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setClassToLeave(c)}
                                                title="Hủy tham gia lớp học"
                                                className="text-xs px-2.5 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50 flex items-center gap-1 shrink-0"
                                            >
                                                
                                                <span>Rời lớp</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Curriculum browse */}
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-5">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 inline-flex items-center gap-2">
                                
                                Chương trình thí nghiệm
                            </h2>
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {gradeCurriculums.map((g) => (
                                    <div key={g.grade}>
                                        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">{g.label}</p>
                                        {g.chapters.map((ch) => (
                                            <div key={ch.id} className="mb-1.5">
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">{ch.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {ch.lessons.map((l) => (
                                                        <span
                                                            key={l.id}
                                                            className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                                        >
                                                            {l.name.replace(/^Bài \d+: /, "")}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Assignments / Activity */}
                    <div className="md:col-span-2 space-y-4">
                        {/* View switcher */}
                        <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800/60 rounded-lg p-1 w-fit" role="tablist" aria-label="Chế độ xem">
                            {VIEW_TABS.map((t) => (
                                <button
                                    key={t.id}
                                      id={`tour-tab-${t.id}`}
                                      role="tab"
                                    aria-selected={viewTab === t.id}
                                    onClick={() => setViewTab(t.id)}
                                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${viewTab === t.id
                                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {viewTab === "assignments" ? (
                            <div id="tour-assignments" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 inline-flex items-center gap-2">
                                        
                                        Bài thí nghiệm được giao
                                    </h2>
                                    {/* Search */}
                                    <div className="relative">
                                        
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Tìm bài thí nghiệm..."
                                            aria-label="Tìm bài thí nghiệm"
                                            className="lab-input !w-52 pl-8 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Grade tabs */}
                                <div className="flex gap-1.5 flex-wrap mb-3" role="group" aria-label="Lọc theo khối lớp">
                                    {TABS.map((t) => {
                                        const g = t.id === "all" ? 0 : Number(t.id.replace("grade-", ""));
                                        const active = filterGrade === g;
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => setFilterGrade(g)}
                                                aria-pressed={active}
                                                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${active
                                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                                                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Status filter */}
                                <div className="flex gap-1.5 flex-wrap mb-4" role="group" aria-label="Lọc theo trạng thái">
                                    {STATUS_TABS.map((s) => {
                                        const active = filterStatus === s.id;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setFilterStatus(s.id)}
                                                aria-pressed={active}
                                                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${active
                                                    ? s.id === "done"
                                                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                                                        : s.id === "todo"
                                                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-semibold"
                                                            : "border-blue-400 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                                                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {filteredAssignments.length === 0 ? (
                                    <div className="lab-empty py-10">
                                        <div className="lab-empty-icon">
                                            
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {filterGrade
                                                ? `Chưa có bài nào ở lớp ${filterGrade}${search ? " khớp tìm kiếm" : ""}.`
                                                : search
                                                    ? "Không tìm thấy bài nào khớp với tìm kiếm."
                                                    : filterStatus !== "all"
                                                        ? `Không có bài nào ở trạng thái "${STATUS_TABS.find((s) => s.id === filterStatus)?.label}".`
                                                        : "Chưa có bài giao — hãy vào lớp bằng mã mời từ giáo viên."}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                                            <button onClick={() => router.push("/lab")} className="lab-btn-primary px-3 py-2 text-xs rounded-lg inline-flex items-center gap-1.5">🧪 Lab Hóa học</button>
                                            <button onClick={() => router.push("/physics")} className="px-3 py-2 text-xs rounded-lg inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white shadow">⚡ Lab Vật lý</button>
                                            <button onClick={() => router.push("/biology")} className="px-3 py-2 text-xs rounded-lg inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white shadow">🧬 Lab Sinh học</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredAssignments.map((a) => {
                                            const exp = getExperiment(a.experimentId);
                                            const submission = getSubmission(a.id, user.id);
                                            return (
                                                <div
                                                    key={a.id}
                                                    className={`border rounded-md p-4 ${submission
                                                        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                                                        : "border-gray-200 dark:border-gray-700"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                                                {a.title}
                                                            </p>
                                                            {exp && (
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {exp.emoji} {exp.name} · Lớp {exp.grade}
                                                                </p>
                                                            )}
                                                            {exp && (
                                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 inline-flex items-center gap-1">
                                                                    
                                                                    {exp.lesson}
                                                                </p>
                                                            )}
                                                            {a.dueDate && (
                                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 inline-flex items-center gap-1">
                                                                    
                                                                    Hạn nộp: {new Date(a.dueDate).toLocaleDateString("vi-VN")}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {submission ? (
                                                            <span className="lab-badge-green flex-shrink-0 inline-flex items-center gap-1">
                                                                
                                                                Đã nộp · {submission.correctCount}/{submission.totalQuestions}
                                                            </span>
                                                        ) : (
                                                            <span className="lab-badge-amber flex-shrink-0 inline-flex items-center gap-1">
                                                                
                                                                Chưa nộp
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <button
                                                            onClick={() => router.push(`/lab?assignment=${a.id}`)}
                                                            className="lab-btn-primary px-3 py-1.5 text-[11px] rounded-lg inline-flex items-center gap-1.5"
                                                        >
                                                            
                                                            {submission ? "Làm lại" : "Làm thí nghiệm"}
                                                        </button>
                                                        {exp && (
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                                {exp.quiz.length} câu hỏi · {exp.steps.length} bước hướng dẫn
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Activity history */
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-5">
                                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1 inline-flex items-center gap-2">
                                    
                                    Lịch sử hoạt động
                                </h2>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">
                                    Tổng {progress?.xp ?? 0} XP · {progress?.streak ?? 0} ngày streak · {progress?.reactionsCount ?? 0} phản ứng · {progress?.submissionsCount ?? 0} bài nộp
                                </p>
                                {activity.length === 0 ? (
                                    <div className="lab-empty py-10">
                                        <div className="lab-empty-icon">
                                            
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có hoạt động nào.</p>
                                        <button
                                            onClick={() => router.push("/lab")}
                                            className="lab-btn-primary px-4 py-2 text-xs rounded-lg inline-flex items-center gap-1.5 mt-3"
                                        >
                                            Bắt đầu làm thí nghiệm
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {activity.map((a) => {
                                            const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.reaction;
                                            return (
                                                <div
                                                    key={a.id}
                                                    className="flex items-start gap-3 border border-gray-100 dark:border-gray-700/60 rounded-md p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                                >
                                                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base flex-shrink-0 ${meta.cls}`} aria-hidden="true">
                                                        {meta.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{a.label}</p>
                                                        {a.detail && (
                                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{a.detail}</p>
                                                        )}
                                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">{formatActivityTime(a.at)}</p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                        +{a.xp} XP
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ProfileModal
                open={profileOpen}
                user={user}
                onClose={() => setProfileOpen(false)}
                onSaved={(updated) => {
                    setUser(updated);
                    load();
                }}
            />

            {/* Leave Class Confirmation Modal */}
            {classToLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5">
                            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
                                <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    
                                </div>
                                <h3 className="font-bold text-base text-gray-900 dark:text-white">Rời khỏi lớp học</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Bạn có chắc chắn muốn rời khỏi lớp <span className="font-bold text-gray-900 dark:text-white">&quot;{classToLeave.name}&quot;</span> không?
                                Bạn có thể tham gia lại bất cứ lúc nào bằng mã lớp.
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 px-5 py-4 flex gap-3 justify-end">
                            <button
                                onClick={() => setClassToLeave(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmLeaveClass}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                            >
                                Xác nhận rời lớp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
