-- ============================================================
--  SIMLAB EDU — Supabase Schema
--  Paste toàn bộ file này vào Supabase SQL Editor > Run
-- ============================================================

-- ── 1. Users ─────────────────────────────────────────────────
create table if not exists public.users (
  id            text primary key,
  name          text not null,
  email         text not null unique,
  password      text not null,
  role          text not null check (role in ('teacher', 'student')),
  school        text,
  avatar_color  text,
  avatar_icon   text,
  created_at    bigint not null default extract(epoch from now())::bigint * 1000
);

-- ── 2. Classes ────────────────────────────────────────────────
create table if not exists public.classes (
  id          text primary key,
  name        text not null,
  code        text not null unique,
  teacher_id  text not null references public.users(id) on delete cascade,
  grade       int  not null,
  subject     text not null check (subject in ('chemistry', 'physics', 'biology')),
  description text,
  created_at  bigint not null default extract(epoch from now())::bigint * 1000
);

-- ── 3. Class memberships (student joins) ─────────────────────
create table if not exists public.class_members (
  student_id  text not null references public.users(id) on delete cascade,
  class_code  text not null,
  primary key (student_id, class_code)
);

-- ── 4. Assignments ───────────────────────────────────────────
create table if not exists public.assignments (
  id                text primary key,
  class_id          text not null references public.classes(id) on delete cascade,
  teacher_id        text not null references public.users(id) on delete cascade,
  experiment_id     text not null,
  title             text not null,
  due_date          text,
  target_condition  text,
  safety_rubric     jsonb,
  custom_quiz       jsonb,
  created_at        bigint not null default extract(epoch from now())::bigint * 1000
);

-- ── 5. Submissions ───────────────────────────────────────────
create table if not exists public.submissions (
  id              text primary key,
  assignment_id   text not null references public.assignments(id) on delete cascade,
  student_id      text not null references public.users(id) on delete cascade,
  correct_count   int  not null default 0,
  total_questions int  not null default 0,
  process_score   int  not null default 10,
  safety_errors   jsonb not null default '[]',
  actions_log     jsonb not null default '[]',
  answers         jsonb not null default '[]',
  feedback        text,
  submitted_at    bigint not null default extract(epoch from now())::bigint * 1000,
  unique (assignment_id, student_id)
);

-- ── 6. User progress (gamification) ─────────────────────────
create table if not exists public.user_progress (
  user_id           text primary key references public.users(id) on delete cascade,
  xp                int not null default 0,
  streak            int not null default 0,
  last_active_day   text not null default '',
  badges            jsonb not null default '[]',
  reactions_count   int not null default 0,
  submissions_count int not null default 0,
  perfect_count     int not null default 0,
  best_score        float not null default 0
);

-- ── 7. Activity feed ─────────────────────────────────────────
create table if not exists public.activity (
  id        text primary key,
  user_id   text not null references public.users(id) on delete cascade,
  type      text not null,
  label     text not null,
  detail    text,
  xp        int  not null default 0,
  at        bigint not null default extract(epoch from now())::bigint * 1000
);

-- ── 8. Walkthrough flags ─────────────────────────────────────
create table if not exists public.walkthrough_done (
  user_id text primary key references public.users(id) on delete cascade,
  done    boolean not null default false
);

-- ── Row Level Security: TẮT để demo đơn giản ────────────────
alter table public.users          disable row level security;
alter table public.classes        disable row level security;
alter table public.class_members  disable row level security;
alter table public.assignments    disable row level security;
alter table public.submissions    disable row level security;
alter table public.user_progress  disable row level security;
alter table public.activity       disable row level security;
alter table public.walkthrough_done disable row level security;

-- ── Seed: 2 tài khoản demo ────────────────────────────────
insert into public.users (id, name, email, password, role, school, avatar_color, avatar_icon)
values
  ('u_teacher_demo', 'Co Minh Anh', 'gv@simlab.vn', 'demo123', 'teacher', 'THPT Chuyen KHTN', '#2563eb', 'GV'),
  ('u_student_demo', 'Nguyen Van An', 'hs@simlab.vn', 'demo123', 'student', 'THPT Chuyen KHTN', '#16a34a', 'HS')
on conflict (id) do nothing;

-- ── 9. Minigame Leaderboard (Bảng Vàng Thi Đua Toàn Quốc) ────
create table if not exists public.minigame_scores (
  id            text primary key,
  user_id       text references public.users(id) on delete set null,
  user_name     text not null,
  user_school   text,
  avatar_color  text default '#3b82f6',
  avatar_icon   text default '⚡',
  score         int not null check (score > 0),
  max_combo     int not null default 0,
  accuracy      float not null default 100,
  matches_count int not null default 0,
  mode          text not null default 'blitz',
  grade         int default 0,
  played_at     bigint not null default extract(epoch from now())::bigint * 1000
);

create index if not exists idx_minigame_scores_score on public.minigame_scores (score desc, played_at desc);
create index if not exists idx_minigame_scores_filter on public.minigame_scores (grade, mode);

alter table public.minigame_scores disable row level security;

-- ── Seed: Top Bảng Xếp Hạng Đấu Trường Hóa Học ──────────────
insert into public.minigame_scores (id, user_name, user_school, avatar_color, avatar_icon, score, max_combo, accuracy, matches_count, mode, grade, played_at)
values
  ('score-top-01', 'Nguyễn Minh Anh', 'THPT Chuyên Hà Nội - Amsterdam', '#3b82f6', '⚡', 4350, 18, 98.5, 24, 'blitz', 0, extract(epoch from (now() - interval '2 hours'))::bigint * 1000),
  ('score-top-02', 'Trần Bảo Ngọc', 'THPT Chuyên Lê Hồng Phong (TP.HCM)', '#ec4899', '🔮', 3980, 15, 96.0, 22, 'blitz', 0, extract(epoch from (now() - interval '5 hours'))::bigint * 1000),
  ('score-top-03', 'Lê Hoàng Long', 'THPT Chuyên Lam Sơn (Thanh Hóa)', '#10b981', '👑', 3620, 14, 94.2, 20, 'blitz', 0, extract(epoch from (now() - interval '12 hours'))::bigint * 1000),
  ('score-top-04', 'Phạm Đăng Khoa', 'THPT Chuyên Quốc Học Huế', '#f59e0b', '🔥', 3150, 12, 92.0, 18, 'blitz', 0, extract(epoch from (now() - interval '1 day'))::bigint * 1000),
  ('score-top-05', 'Vũ Khánh Linh', 'THPT Chuyên Phan Bội Châu (Nghệ An)', '#8b5cf6', '🧪', 2890, 11, 90.5, 16, 'blitz', 0, extract(epoch from (now() - interval '1 day 4 hours'))::bigint * 1000),
  ('score-top-06', 'Đỗ Hải Nam', 'THPT Chuyên Nguyễn Huệ (Hà Nội)', '#06b6d4', '🔬', 2540, 9, 88.0, 15, 'blitz', 10, extract(epoch from (now() - interval '2 days'))::bigint * 1000),
  ('score-top-07', 'Bùi Thị Mai Anh', 'THPT Kim Liên (Hà Nội)', '#14b8a6', '⚗️', 2280, 8, 86.5, 14, 'blitz', 11, extract(epoch from (now() - interval '2 days 6 hours'))::bigint * 1000),
  ('score-top-08', 'Hoàng Gia Bảo', 'THPT Chuyên Trần Phú (Hải Phòng)', '#f97316', '⚡', 2150, 8, 85.0, 13, 'blitz', 12, extract(epoch from (now() - interval '3 days'))::bigint * 1000),
  ('score-top-09', 'Nguyễn Thảo Nguyên', 'THCS & THPT Lương Thế Vinh', '#84cc16', '🌟', 1980, 7, 84.0, 12, 'blitz', 9, extract(epoch from (now() - interval '3 days 10 hours'))::bigint * 1000),
  ('score-top-10', 'Trịnh Quốc Tuấn', 'THPT Chu Văn An (Hà Nội)', '#6366f1', '🎯', 1820, 6, 82.0, 11, 'blitz', 10, extract(epoch from (now() - interval '4 days'))::bigint * 1000)
on conflict (id) do update set
  score = excluded.score,
  max_combo = excluded.max_combo,
  accuracy = excluded.accuracy;
