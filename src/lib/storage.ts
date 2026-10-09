// ─── Lớp dữ liệu (Data Layer) — Supabase backend với sync adapter ───
// Các hàm export giữ interface ĐỒNG BỘ (sync) để không phải sửa toàn bộ component.
// Dữ liệu được cache trong memory, đồng bộ ngầm với Supabase qua các helper async.

import { supabase } from "./supabase";

export type Role = "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  school?: string;
  createdAt: number;
  avatarColor?: string;
  avatarIcon?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  grade: number;
  subject: "chemistry" | "physics" | "biology";
  description?: string;
  createdAt: number;
}

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  experimentId: string;
  title: string;
  dueDate?: string;
  targetCondition?: string;
  safetyRubric?: string[];
  customQuiz?: any[];
  createdAt: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  correctCount: number;
  totalQuestions: number;
  processScore: number;
  safetyErrors: string[];
  actionsLog: string[];
  answers: number[];
  submittedAt: number;
  feedback?: string;
}

export interface UserProgress {
  xp: number;
  streak: number;
  lastActiveDay: string;
  badges: string[];
  reactionsCount: number;
  submissionsCount: number;
  perfectCount: number;
  bestScore: number;
}

export type ActivityType = "reaction" | "submit" | "join" | "perfect" | "streak" | "profile";

export interface ActivityEntry {
  id: string;
  userId: string;
  type: ActivityType;
  label: string;
  detail?: string;
  xp: number;
  at: number;
}

export interface BadgeDef {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

// ─── In-memory cache (populated on app load via initStore()) ─────────────────
const store = {
  users: [] as User[],
  classes: [] as ClassRoom[],
  assignments: [] as Assignment[],
  submissions: [] as Submission[],
  joined: {} as Record<string, string[]>, // studentId → class codes[]
  progress: {} as Record<string, UserProgress>,
  activity: [] as ActivityEntry[],
  session: null as string | null, // userId
  walkthrough: {} as Record<string, boolean>,
};

// ─── LocalStorage helpers (session + walkthrough only) ──────────────────────
const K_SESSION = "simlab_session";
const K_WALKTHROUGH = "simlab_walkthrough_done";

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { 
      let r = window.localStorage.getItem(key); 
      if (!r) r = window.sessionStorage.getItem(key);
      if (!r) return fallback;
      try { return JSON.parse(r); } catch { return r as unknown as T; }
  } catch { return fallback; }
}
function lsWrite<T>(key: string, val: T, persistent: boolean = true): void {
  if (typeof window === "undefined") return;
  try { 
      if (val === null) {
          window.localStorage.removeItem(key);
          window.sessionStorage.removeItem(key);
          return;
      }
      const str = JSON.stringify(val);
      if (persistent) {
          window.localStorage.setItem(key, str);
          window.sessionStorage.removeItem(key);
      } else {
          window.sessionStorage.setItem(key, str);
          window.localStorage.removeItem(key);
      }
  } catch { /* ignore */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function genClassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayDiff(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

// ─── Row mappers (snake_case DB → camelCase TS) ───────────────────────────────
function mapUser(r: any): User {
  return { id: r.id, name: r.name, email: r.email, password: r.password, role: r.role,
    school: r.school ?? undefined, createdAt: r.created_at,
    avatarColor: r.avatar_color ?? undefined, avatarIcon: r.avatar_icon ?? undefined };
}
function mapClass(r: any): ClassRoom {
  return { id: r.id, name: r.name, code: r.code, teacherId: r.teacher_id,
    grade: r.grade, subject: r.subject, description: r.description ?? undefined, createdAt: r.created_at };
}
function mapAssignment(r: any): Assignment {
  return { id: r.id, classId: r.class_id, teacherId: r.teacher_id,
    experimentId: r.experiment_id, title: r.title, dueDate: r.due_date ?? undefined,
    targetCondition: r.target_condition ?? undefined, safetyRubric: r.safety_rubric ?? undefined,
    customQuiz: r.custom_quiz ?? undefined, createdAt: r.created_at };
}
function mapSubmission(r: any): Submission {
  return { id: r.id, assignmentId: r.assignment_id, studentId: r.student_id,
    correctCount: r.correct_count, totalQuestions: r.total_questions,
    processScore: r.process_score, safetyErrors: r.safety_errors ?? [],
    actionsLog: r.actions_log ?? [], answers: r.answers ?? [],
    submittedAt: r.submitted_at, feedback: r.feedback ?? undefined };
}
function mapProgress(r: any): UserProgress {
  return { xp: r.xp, streak: r.streak, lastActiveDay: r.last_active_day, badges: r.badges ?? [],
    reactionsCount: r.reactions_count, submissionsCount: r.submissions_count,
    perfectCount: r.perfect_count, bestScore: r.best_score };
}

// ─── Initialize: load all data from Supabase into cache ──────────────────────
let _initialized = false;
let _initPromise: Promise<void> | null = null;

export async function initStore(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const [
      { data: users }, { data: classes }, { data: assignments },
      { data: submissions }, { data: members }, { data: progress }, { data: activity }
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("classes").select("*"),
      supabase.from("assignments").select("*"),
      supabase.from("submissions").select("*"),
      supabase.from("class_members").select("*"),
      supabase.from("user_progress").select("*"),
      supabase.from("activity").select("*"),
    ]);

    store.users = (users ?? []).map(mapUser);
    store.classes = (classes ?? []).map(mapClass);
    store.assignments = (assignments ?? []).map(mapAssignment);
    store.submissions = (submissions ?? []).map(mapSubmission);
    store.joined = {};
    for (const m of members ?? []) {
      if (!store.joined[m.student_id]) store.joined[m.student_id] = [];
      store.joined[m.student_id].push(m.class_code);
    }
    store.progress = {};
    for (const p of progress ?? []) store.progress[p.user_id] = mapProgress(p);
    store.activity = (activity ?? []).map((r: any) => ({
      id: r.id, userId: r.user_id, type: r.type as ActivityType,
      label: r.label, detail: r.detail ?? undefined, xp: r.xp, at: r.at,
    }));
    store.session = lsRead<string | null>(K_SESSION, null);
    store.walkthrough = lsRead<Record<string, boolean>>(K_WALKTHROUGH, {});
    _initialized = true;
  })();
  return _initPromise;
}

/** Reset cache (gọi sau khi write để buộc re-fetch) */
export function invalidateStore(): void {
  _initialized = false;
  _initPromise = null;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): User[] { return [...store.users]; }

export function registerUser(data: { name: string; email: string; password: string; role: Role; school?: string }): User {
  if (store.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase()))
    throw new Error("Email đã được đăng ký");
  const user: User = {
    id: uid("u"), name: data.name, email: data.email, password: data.password,
    role: data.role, school: data.school, createdAt: Date.now(),
    avatarColor: "#2563eb",
    avatarIcon: data.name.slice(data.name.lastIndexOf(" ") + 1).slice(0, 1).toUpperCase() || "?",
  };
  store.users.push(user);
  supabase.from("users").insert({
    id: user.id, name: user.name, email: user.email, password: user.password,
    role: user.role, school: user.school ?? null,
    avatar_color: user.avatarColor, avatar_icon: user.avatarIcon, created_at: user.createdAt,
  }).then();
  return user;
}

export function getUserByEmail(email: string): User | null {
  return store.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

export function getUserById(id: string): User | null {
  return store.users.find((u) => u.id === id) ?? null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Keep old function names for backward compat
export function loginUser(email: string, password: string, rememberMe: boolean = true): User {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) throw new Error("Email hoặc mật khẩu không đúng");
  store.session = user.id;
  lsWrite(K_SESSION, user.id, rememberMe);
  return user;
}


export function syncUser(apiUser: User) {
  const existingIndex = store.users.findIndex(u => u.id === apiUser.id || u.email.toLowerCase() === apiUser.email.toLowerCase());
  if (existingIndex >= 0) {
      store.users[existingIndex] = { ...store.users[existingIndex], ...apiUser };
  } else {
      store.users.push(apiUser);
  }
}

export function setSession(userId: string, rememberMe: boolean = true): void {
  store.session = userId;
  lsWrite(K_SESSION, userId, rememberMe);
}

export function logout(): void {
  store.session = null;
  lsWrite(K_SESSION, null);
}

export function getCurrentUser(): User | null {
  if (!store.session) return null;
  return getUserById(store.session);
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export function getClasses(): ClassRoom[] { return [...store.classes]; }

export function createClass(data: { name: string; teacherId: string; grade: number; subject: "chemistry" | "physics" | "biology"; description?: string }): ClassRoom {
  const cls: ClassRoom = {
    id: uid("c"), name: data.name, code: genClassCode(), teacherId: data.teacherId,
    grade: data.grade, subject: data.subject, description: data.description, createdAt: Date.now(),
  };
  store.classes.push(cls);
  supabase.from("classes").insert({
    id: cls.id, name: cls.name, code: cls.code, teacher_id: cls.teacherId,
    grade: cls.grade, subject: cls.subject, description: cls.description ?? null, created_at: cls.createdAt,
  }).then();
  return cls;
}

export function getClassByCode(code: string): ClassRoom | null {
  return store.classes.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()) ?? null;
}

export function getClassById(id: string): ClassRoom | null {
  return store.classes.find((c) => c.id === id) ?? null;
}

export function deleteClass(id: string): void {
  const target = store.classes.find((c) => c.id === id);
  if (!target) return;
  store.classes = store.classes.filter((c) => c.id !== id);
  const deletedIds = new Set(store.assignments.filter((a) => a.classId === id).map((a) => a.id));
  store.assignments = store.assignments.filter((a) => a.classId !== id);
  store.submissions = store.submissions.filter((s) => !deletedIds.has(s.assignmentId));
  for (const uid in store.joined) {
    store.joined[uid] = store.joined[uid].filter((code) => code !== target.code);
  }
  supabase.from("classes").delete().eq("id", id).then(); // cascade handles the rest
}

export function leaveClass(studentId: string, classCode: string): void {
  if (store.joined[studentId]) {
    store.joined[studentId] = store.joined[studentId].filter((c) => c.toUpperCase() !== classCode.toUpperCase());
  }
  supabase.from("class_members").delete().eq("student_id", studentId).ilike("class_code", classCode).then();
}

// ─── Class members ───────────────────────────────────────────────────────────

export function getStudentJoinedCodes(studentId: string): string[] {
  return store.joined[studentId] ?? [];
}

export function joinClass(studentId: string, code: string): ClassRoom {
  const cls = getClassByCode(code);
  if (!cls) throw new Error("Không tìm thấy lớp với mã này");
  if (!store.joined[studentId]) store.joined[studentId] = [];
  if (!store.joined[studentId].includes(cls.code)) {
    store.joined[studentId].push(cls.code);
    supabase.from("class_members").upsert({ student_id: studentId, class_code: cls.code }, { onConflict: "student_id,class_code" }).then();
  }
  return cls;
}

export function getStudentsForClass(classId: string): User[] {
  const cls = getClassById(classId);
  if (!cls) return [];
  return store.users.filter((u) => u.role === "student" && (store.joined[u.id] ?? []).includes(cls.code));
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export function getAssignments(): Assignment[] { return [...store.assignments]; }

export function createAssignment(data: {
  classId: string; teacherId: string; experimentId: string; title: string;
  dueDate?: string; targetCondition?: string; safetyRubric?: string[]; customQuiz?: any[];
}): Assignment {
  const a: Assignment = {
    id: uid("a"), classId: data.classId, teacherId: data.teacherId,
    experimentId: data.experimentId, title: data.title, dueDate: data.dueDate,
    targetCondition: data.targetCondition, safetyRubric: data.safetyRubric,
    customQuiz: data.customQuiz && data.customQuiz.length > 0 ? data.customQuiz : undefined,
    createdAt: Date.now(),
  };
  store.assignments.push(a);
  supabase.from("assignments").insert({
    id: a.id, class_id: a.classId, teacher_id: a.teacherId, experiment_id: a.experimentId,
    title: a.title, due_date: a.dueDate ?? null, target_condition: a.targetCondition ?? null,
    safety_rubric: a.safetyRubric ?? null,
    custom_quiz: a.customQuiz && a.customQuiz.length > 0 ? a.customQuiz : null,
    created_at: a.createdAt,
  }).then();
  return a;
}

export function getAssignmentsForClass(classId: string): Assignment[] {
  return store.assignments.filter((a) => a.classId === classId).sort((a, b) => b.createdAt - a.createdAt);
}

export function getAssignmentsForStudent(studentId: string): Assignment[] {
  const codes = getStudentJoinedCodes(studentId);
  const classIds = store.classes.filter((c) => codes.includes(c.code)).map((c) => c.id);
  return store.assignments.filter((a) => classIds.includes(a.classId)).sort((a, b) => b.createdAt - a.createdAt);
}

export function getAssignmentById(id: string): Assignment | null {
  return store.assignments.find((a) => a.id === id) ?? null;
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export function getSubmissions(): Submission[] { return [...store.submissions]; }

export function submitAssignment(data: {
  assignmentId: string; studentId: string; correctCount: number; totalQuestions: number;
  answers: number[]; processScore: number; safetyErrors: string[]; actionsLog: string[];
}): Submission {
  const now = Date.now();
  const existingIdx = store.submissions.findIndex(
    (s) => s.assignmentId === data.assignmentId && s.studentId === data.studentId
  );
  const sub: Submission = {
    id: existingIdx >= 0 ? store.submissions[existingIdx].id : uid("s"),
    assignmentId: data.assignmentId, studentId: data.studentId,
    correctCount: data.correctCount, totalQuestions: data.totalQuestions,
    answers: data.answers, processScore: data.processScore,
    safetyErrors: data.safetyErrors, actionsLog: data.actionsLog, submittedAt: now,
  };
  if (existingIdx >= 0) store.submissions[existingIdx] = sub;
  else store.submissions.push(sub);
  supabase.from("submissions").upsert({
    id: sub.id, assignment_id: sub.assignmentId, student_id: sub.studentId,
    correct_count: sub.correctCount, total_questions: sub.totalQuestions,
    answers: sub.answers, process_score: sub.processScore,
    safety_errors: sub.safetyErrors, actions_log: sub.actionsLog, submitted_at: sub.submittedAt,
  }, { onConflict: "assignment_id,student_id" }).then();
  return sub;
}

export function getSubmissionsForAssignment(assignmentId: string): Submission[] {
  return store.submissions.filter((s) => s.assignmentId === assignmentId);
}

export function getSubmission(assignmentId: string, studentId: string): Submission | null {
  return store.submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId) ?? null;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export const BADGES: BadgeDef[] = [
  { id: "first-reaction", label: "Nhà thực hành", desc: "Tạo phản ứng hóa học đầu tiên", icon: "🧪" },
  { id: "reactions-10", label: "Thợ pha chế", desc: "Tạo 10 phản ứng hóa học", icon: "⚗️" },
  { id: "reactions-25", label: "Bậc thầy phản ứng", desc: "Tạo 25 phản ứng hóa học", icon: "🔬" },
  { id: "first-submit", label: "Người nộp bài", desc: "Nộp bài thí nghiệm đầu tiên", icon: "📝" },
  { id: "submit-5", label: "Chăm chỉ", desc: "Nộp 5 bài thí nghiệm", icon: "🎯" },
  { id: "good-score", label: "Học sinh giỏi", desc: "Đạt điểm 8 trở lên", icon: "🌟" },
  { id: "perfect-score", label: "Toàn A", desc: "Đạt điểm tuyệt đối 10", icon: "💯" },
  { id: "streak-3", label: "Đam mê", desc: "3 ngày liên tiếp làm thí nghiệm", icon: "🔥" },
  { id: "streak-7", label: "Nghiện phòng lab", desc: "7 ngày liên tiếp làm thí nghiệm", icon: "🏆" },
];

export function getBadgeDefinitions(): BadgeDef[] { return BADGES; }

export function getLevel(xp: number): { level: number; current: number; needed: number; progress: number } {
  const level = Math.floor(xp / 100) + 1;
  const current = xp % 100;
  return { level, current, needed: 100, progress: current / 100 };
}

export function getLevelTitle(level: number): string {
  if (level <= 1) return "Tân binh phòng lab";
  if (level <= 3) return "Nhà khoa học trẻ";
  if (level <= 6) return "Thạc sĩ thực nghiệm";
  if (level <= 10) return "Chuyên gia thí nghiệm";
  return "Bậc thầy khoa học";
}

function computeBadges(p: UserProgress): string[] {
  const e: string[] = [];
  if (p.reactionsCount >= 1) e.push("first-reaction");
  if (p.reactionsCount >= 10) e.push("reactions-10");
  if (p.reactionsCount >= 25) e.push("reactions-25");
  if (p.submissionsCount >= 1) e.push("first-submit");
  if (p.submissionsCount >= 5) e.push("submit-5");
  if (p.bestScore >= 8) e.push("good-score");
  if (p.perfectCount >= 1) e.push("perfect-score");
  if (p.streak >= 3) e.push("streak-3");
  if (p.streak >= 7) e.push("streak-7");
  return e;
}

function badgeDiff(before: string[], after: string[]): BadgeDef[] {
  return after.filter((id) => !before.includes(id))
    .map((id) => BADGES.find((b) => b.id === id)).filter((b): b is BadgeDef => !!b);
}

function saveProgressSync(userId: string, p: UserProgress): void {
  store.progress[userId] = p;
  supabase.from("user_progress").upsert({
    user_id: userId, xp: p.xp, streak: p.streak, last_active_day: p.lastActiveDay,
    badges: p.badges, reactions_count: p.reactionsCount, submissions_count: p.submissionsCount,
    perfect_count: p.perfectCount, best_score: p.bestScore,
  }, { onConflict: "user_id" }).then();
}

export function getProgress(userId: string): UserProgress {
  return store.progress[userId] ?? {
    xp: 0, streak: 0, lastActiveDay: "", badges: [],
    reactionsCount: 0, submissionsCount: 0, perfectCount: 0, bestScore: 0,
  };
}

function touchStreak(p: UserProgress): void {
  const today = todayStr();
  if (p.lastActiveDay === today) return;
  const diff = p.lastActiveDay ? dayDiff(today, p.lastActiveDay) : 0;
  p.streak = diff === 1 ? p.streak + 1 : 1;
  p.lastActiveDay = today;
}

export function addActivity(userId: string, type: ActivityType, label: string, xp: number, detail?: string): void {
  const entry: ActivityEntry = { id: uid("act"), userId, type, label, xp, detail, at: Date.now() };
  store.activity.push(entry);
  supabase.from("activity").insert({
    id: entry.id, user_id: entry.userId, type: entry.type, label: entry.label,
    xp: entry.xp, detail: entry.detail ?? null, at: entry.at,
  }).then();
}

export function getActivity(userId: string, limit = 30): ActivityEntry[] {
  return store.activity
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}

export function recordReaction(userId: string, chem1: string, chem2: string): { progress: UserProgress; newBadges: BadgeDef[] } {
  const p = { ...getProgress(userId) };
  const before = [...p.badges];
  p.reactionsCount += 1;
  touchStreak(p);
  p.xp += 10;
  p.badges = computeBadges(p);
  saveProgressSync(userId, p);
  addActivity(userId, "reaction", `Thí nghiệm: ${chem1} + ${chem2}`, 10, "Tạo ra phản ứng hóa học");
  return { progress: p, newBadges: badgeDiff(before, p.badges) };
}

export function recordSubmission(userId: string, score: number): { progress: UserProgress; newBadges: BadgeDef[] } {
  const p = { ...getProgress(userId) };
  const before = [...p.badges];
  p.submissionsCount += 1;
  p.bestScore = Math.max(p.bestScore, score);
  if (score >= 9.5) p.perfectCount += 1;
  const bonus = score >= 9 ? 30 : score >= 7 ? 20 : 10;
  touchStreak(p);
  p.xp += 20 + bonus;
  p.badges = computeBadges(p);
  saveProgressSync(userId, p);
  const type: ActivityType = score >= 9.5 ? "perfect" : "submit";
  addActivity(userId, type, score >= 9.5 ? "Bài nộp đạt điểm tuyệt đối" : "Nộp bài thí nghiệm", 20 + bonus, `Đạt ${score}/10 điểm`);
  return { progress: p, newBadges: badgeDiff(before, p.badges) };
}

// ─── Walkthrough ─────────────────────────────────────────────────────────────

export function isWalkthroughDone(userId: string): boolean {
  return !!store.walkthrough[userId];
}

export function setWalkthroughDone(userId: string): void {
  store.walkthrough[userId] = true;
  lsWrite(K_WALKTHROUGH, store.walkthrough);
  supabase.from("walkthrough_done").upsert({ user_id: userId, done: true }, { onConflict: "user_id" }).then();
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function getStudentCountForClass(classId: string): number {
  return getStudentsForClass(classId).length;
}

// ─── updateUser (for Avatar component) ──────────────────────────────────────

export function updateUser(userId: string, data: Partial<Pick<User, "name" | "school" | "avatarColor" | "avatarIcon">>): User {
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("Không tìm thấy người dùng");
  store.users[idx] = { ...store.users[idx], ...data };
  supabase.from("users").update({
    name: data.name, school: data.school, avatar_color: data.avatarColor, avatar_icon: data.avatarIcon,
  }).eq("id", userId).then();
  return store.users[idx];
}

// ─── Seed: chạy qua docs/supabase-schema.sql trên Supabase Dashboard ─────────
export function seedIfNeeded(): void {
  // no-op: seed được thực hiện qua docs/supabase-schema.sql
  // initStore() sẽ load dữ liệu từ Supabase khi app khởi động
}

// ─── Expose initStore for app-level bootstrap ────────────────────────────────
// Gọi initStore() ở layout.tsx hoặc page đầu tiên trước khi dùng bất kỳ hàm nào ở đây.
