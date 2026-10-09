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
