// ─── Quản lý Bảng Xếp Hạng Minigame (Local + Supabase + SQLite) ───

export interface LeaderboardEntry {
  id: string;
  userId?: string;
  userName: string;
  userSchool?: string;
  avatarColor?: string;
  avatarIcon?: string;
  score: number;
  maxCombo: number;
  accuracy: number; // Tỉ lệ chính xác %
  matchesCount: number;
  mode: "blitz" | "campaign" | "survival";
  grade: number; // 0: Đấu trường hỗn hợp, 8-12: Khối lớp
  playedAt: number;
}

export interface XpLeaderboardEntry {
  id: string;
  userId?: string;
  userName: string;
  userSchool?: string;
  avatarColor?: string;
  avatarIcon?: string;
  xp: number;
  level: number;
  streak: number;
  role?: string;
}

const STORAGE_KEY = "simlab_minigame_leaderboard";

// Dữ liệu mẫu Bảng Vàng Kinh Nghiệm (Top XP tích lũy toàn hệ thống)
export const DEFAULT_XP_LEADERBOARD: XpLeaderboardEntry[] = [
  {
    id: "xp-1",
    userName: "Nguyễn Minh Anh",
    userSchool: "THPT Chuyên Hà Nội - Amsterdam",
    avatarColor: "#3b82f6",
    avatarIcon: "HS",
    xp: 14850,
    level: 10,
    streak: 28,
  },
  {
    id: "xp-2",
    userName: "Hoàng Nhật Minh",
    userSchool: "THPT Chuyên KHTN (Hà Nội)",
    avatarColor: "#8b5cf6",
    avatarIcon: "HS",
    xp: 12620,
    level: 9,
    streak: 22,
  },
  {
    id: "xp-3",
    userName: "Trần Bảo Ngọc",
    userSchool: "THPT Chuyên Lê Hồng Phong (TP.HCM)",
    avatarColor: "#ec4899",
    avatarIcon: "HS",
    xp: 10940,
    level: 8,
    streak: 19,
  },
  {
    id: "xp-4",
    userName: "Chu Đức Anh",
    userSchool: "THPT Chuyên Sư Phạm (Hà Nội)",
    avatarColor: "#10b981",
    avatarIcon: "HS",
    xp: 9480,
    level: 7,
    streak: 15,
  },
  {
    id: "xp-5",
    userName: "Lê Quỳnh Như",
    userSchool: "THPT Gia Định (TP.HCM)",
    avatarColor: "#06b6d4",
    avatarIcon: "HS",
    xp: 8150,
    level: 6,
    streak: 14,
  },
  {
    id: "xp-6",
    userName: "Lê Hoàng Long",
    userSchool: "THPT Chuyên Lam Sơn (Thanh Hóa)",
    avatarColor: "#f59e0b",
    avatarIcon: "HS",
    xp: 6920,
    level: 5,
    streak: 11,
  },
  {
    id: "xp-7",
    userName: "Đặng Thùy Dương",
    userSchool: "THPT Chuyên Ngoại Ngữ",
    avatarColor: "#14b8a6",
    avatarIcon: "HS",
    xp: 5740,
    level: 4,
    streak: 8,
  },
  {
    id: "xp-8",
    userName: "Phạm Đăng Khoa",
    userSchool: "THPT Chuyên Quốc Học Huế",
    avatarColor: "#f43f5e",
    avatarIcon: "HS",
    xp: 4890,
    level: 4,
    streak: 7,
  },
];

// Dữ liệu mẫu ban đầu theo 3 chế độ chơi để bảng xếp hạng luôn sôi động
export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  // ── 1. Phản xạ tính giờ (Blitz) ──
  {
    id: "top-b1",
    userName: "Nguyễn Minh Anh",
    userSchool: "THPT Chuyên Hà Nội - Amsterdam",
    avatarColor: "#3b82f6",
    avatarIcon: "HS",
    score: 4350,
    maxCombo: 18,
    accuracy: 98,
    matchesCount: 24,
    mode: "blitz",
    grade: 0,
    playedAt: Date.now() - 3600000 * 2,
  },
  {
    id: "top-b2",
    userName: "Trần Bảo Ngọc",
    userSchool: "THPT Chuyên Lê Hồng Phong (TP.HCM)",
    avatarColor: "#ec4899",
    avatarIcon: "HS",
    score: 3980,
    maxCombo: 15,
    accuracy: 96,
    matchesCount: 22,
    mode: "blitz",
    grade: 0,
    playedAt: Date.now() - 3600000 * 5,
  },
  {
    id: "top-b3",
    userName: "Lê Hoàng Long",
    userSchool: "THPT Chuyên Lam Sơn (Thanh Hóa)",
    avatarColor: "#10b981",
    avatarIcon: "HS",
    score: 3620,
    maxCombo: 14,
    accuracy: 94,
    matchesCount: 20,
    mode: "blitz",
    grade: 0,
    playedAt: Date.now() - 3600000 * 12,
  },
  {
    id: "top-b4",
    userName: "Phạm Đăng Khoa",
    userSchool: "THPT Chuyên Quốc Học Huế",
    avatarColor: "#f59e0b",
    avatarIcon: "HS",
    score: 3150,
    maxCombo: 12,
    accuracy: 92,
    matchesCount: 18,
    mode: "blitz",
    grade: 0,
    playedAt: Date.now() - 3600000 * 18,
  },
  {
    id: "top-b5",
    userName: "Vũ Khánh Linh",
    userSchool: "THPT Chuyên Phan Bội Châu (Nghệ An)",
    avatarColor: "#8b5cf6",
    avatarIcon: "HS",
    score: 2890,
    maxCombo: 11,
    accuracy: 90,
    matchesCount: 16,
    mode: "blitz",
    grade: 0,
    playedAt: Date.now() - 3600000 * 24,
  },
  {
    id: "top-b6",
    userName: "Đỗ Hải Nam",
    userSchool: "THCS & THPT Nguyễn Tất Thành",
    avatarColor: "#06b6d4",
    avatarIcon: "HS",
    score: 2540,
    maxCombo: 9,
    accuracy: 88,
    matchesCount: 15,
    mode: "blitz",
    grade: 10,
    playedAt: Date.now() - 3600000 * 30,
  },
  {
    id: "top-b7",
    userName: "Bùi Thị Mai Anh",
    userSchool: "THPT Kim Liên (Hà Nội)",
    avatarColor: "#14b8a6",
    avatarIcon: "HS",
    score: 2280,
    maxCombo: 8,
    accuracy: 86,
    matchesCount: 14,
    mode: "blitz",
    grade: 9,
    playedAt: Date.now() - 3600000 * 36,
  },

  // ── 2. Vượt ải cấp lớp (Campaign) ──
  {
    id: "top-c1",
    userName: "Hoàng Nhật Minh",
    userSchool: "THPT Chuyên KHTN (Hà Nội)",
    avatarColor: "#8b5cf6",
    avatarIcon: "HS",
    score: 5420,
    maxCombo: 25,
    accuracy: 100,
    matchesCount: 30,
    mode: "campaign",
    grade: 12,
    playedAt: Date.now() - 3600000 * 3,
  },
  {
    id: "top-c2",
    userName: "Đặng Thùy Dương",
    userSchool: "THPT Chuyên Ngoại Ngữ",
    avatarColor: "#ec4899",
    avatarIcon: "HS",
    score: 4890,
    maxCombo: 21,
    accuracy: 97,
    matchesCount: 28,
    mode: "campaign",
    grade: 11,
    playedAt: Date.now() - 3600000 * 8,
  },
  {
    id: "top-c3",
    userName: "Nguyễn Gia Bảo",
    userSchool: "THPT Chu Văn An (Hà Nội)",
    avatarColor: "#3b82f6",
    avatarIcon: "HS",
    score: 4210,
    maxCombo: 19,
    accuracy: 95,
    matchesCount: 25,
    mode: "campaign",
    grade: 10,
    playedAt: Date.now() - 3600000 * 14,
  },
  {
    id: "top-c4",
    userName: "Trịnh Thu Trang",
    userSchool: "THCS Cầu Giấy",
    avatarColor: "#10b981",
    avatarIcon: "HS",
    score: 3760,
    maxCombo: 16,
    accuracy: 93,
    matchesCount: 22,
    mode: "campaign",
    grade: 9,
    playedAt: Date.now() - 3600000 * 20,
  },
  {
    id: "top-c5",
    userName: "Phan Tuấn Kiệt",
    userSchool: "THCS Trưng Vương",
    avatarColor: "#f59e0b",
    avatarIcon: "HS",
    score: 3350,
    maxCombo: 14,
    accuracy: 91,
    matchesCount: 20,
    mode: "campaign",
    grade: 8,
    playedAt: Date.now() - 3600000 * 26,
  },

  // ── 3. Sinh tồn vô hạn (Survival) ──
  {
    id: "top-s1",
    userName: "Chu Đức Anh",
    userSchool: "THPT Chuyên Sư Phạm (Hà Nội)",
    avatarColor: "#10b981",
    avatarIcon: "HS",
    score: 6800,
    maxCombo: 34,
    accuracy: 99,
    matchesCount: 42,
    mode: "survival",
    grade: 0,
    playedAt: Date.now() - 3600000 * 4,
  },
  {
    id: "top-s2",
    userName: "Lê Quỳnh Như",
    userSchool: "THPT Gia Định (TP.HCM)",
    avatarColor: "#06b6d4",
    avatarIcon: "HS",
    score: 5950,
    maxCombo: 28,
    accuracy: 96,
    matchesCount: 36,
    mode: "survival",
    grade: 0,
    playedAt: Date.now() - 3600000 * 9,
  },
  {
    id: "top-s3",
    userName: "Tạ Minh Quân",
    userSchool: "THPT Chuyên Hạ Long (Quảng Ninh)",
    avatarColor: "#f59e0b",
    avatarIcon: "HS",
    score: 5120,
    maxCombo: 24,
    accuracy: 94,
    matchesCount: 32,
    mode: "survival",
    grade: 0,
    playedAt: Date.now() - 3600000 * 16,
  },
  {
    id: "top-s4",
    userName: "Võ Hoài Nam",
    userSchool: "THPT Chuyên Bến Tre",
    avatarColor: "#8b5cf6",
    avatarIcon: "HS",
    score: 4480,
    maxCombo: 20,
    accuracy: 92,
    matchesCount: 28,
    mode: "survival",
    grade: 0,
    playedAt: Date.now() - 3600000 * 22,
  },
  {
    id: "top-s5",
    userName: "Nguyễn Phương Thảo",
    userSchool: "THPT Nguyễn Huệ (Hà Nội)",
    avatarColor: "#ec4899",
    avatarIcon: "HS",
    score: 3850,
    maxCombo: 17,
    accuracy: 90,
    matchesCount: 24,
    mode: "survival",
    grade: 0,
    playedAt: Date.now() - 3600000 * 28,
  },
];

export function getLocalLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return DEFAULT_LEADERBOARD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
      return DEFAULT_LEADERBOARD;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter((item: any) => typeof item.score === "number" && item.score > 0);
      return valid.length > 0 ? valid : DEFAULT_LEADERBOARD;
    }
    return DEFAULT_LEADERBOARD;
  } catch (e) {
    return DEFAULT_LEADERBOARD;
  }
}

export function saveLocalScore(entry: Omit<LeaderboardEntry, "id" | "playedAt">): { entry: LeaderboardEntry; rank: number } {
  if (entry.score <= 0) {
    const current = getLocalLeaderboard();
    return { entry: { ...entry, id: "temp", playedAt: Date.now() }, rank: current.length + 1 };
  }

  const current = getLocalLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: "score-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    playedAt: Date.now(),
  };

  // Cập nhật hoặc thêm mới: Nếu cùng user & mode & grade, giữ điểm cao hơn
  let updated = current.filter((item) => item.score > 0);
  const existingIdx = updated.findIndex(
    (e) => (e.userId && e.userId === newEntry.userId) || (e.userName.trim().toLowerCase() === newEntry.userName.trim().toLowerCase() && e.mode === newEntry.mode)
  );

  if (existingIdx >= 0) {
    if (newEntry.score > updated[existingIdx].score) {
      updated[existingIdx] = newEntry;
    }
  } else {
    updated.push(newEntry);
  }

  // Sắp xếp theo điểm giảm dần
  updated.sort((a, b) => b.score - a.score);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
    } catch (e) {
      // ignore
    }
  }

  // Tìm thứ hạng trong cùng chế độ chơi (mode)
  const modeList = updated.filter((e) => e.mode === newEntry.mode);
  const rank = modeList.findIndex((e) => e.id === newEntry.id || (e.userName === newEntry.userName && e.score === newEntry.score)) + 1;

  return { entry: newEntry, rank: rank > 0 ? rank : modeList.length };
}
