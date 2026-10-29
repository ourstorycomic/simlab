import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import db from "@/lib/db";
import { DEFAULT_LEADERBOARD, LeaderboardEntry } from "@/lib/leaderboardStorage";

// Tạo bảng SQLite cục bộ dự phòng nếu chưa có
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS minigame_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_school TEXT,
      avatar_color TEXT,
      avatar_icon TEXT,
      score INTEGER NOT NULL,
      max_combo INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      matches_count INTEGER NOT NULL,
      mode TEXT NOT NULL,
      grade INTEGER DEFAULT 0,
      played_at INTEGER NOT NULL
    );
  `);
} catch (e) {
  console.warn("Could not init sqlite minigame_scores table:", e);
}

// Hàm lọc giữ lại kỷ lục điểm cao nhất của từng người chơi theo từng chế độ
function deduplicateScores(list: LeaderboardEntry[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  for (const item of list) {
    const userKey = item.userId ? `id-${item.userId}` : `name-${item.userName.trim().toLowerCase()}`;
    const key = `${userKey}__${item.mode || "blitz"}`;
    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key)!;
      if (item.score > existing.score) {
        map.set(key, item);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = parseInt(searchParams.get("grade") || "0", 10);
    const mode = searchParams.get("mode") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    // 1. Ưu tiên đọc từ Supabase Cloud
    try {
      let query = supabase
        .from("minigame_scores")
        .select("*")
        .gt("score", 0)
        .order("score", { ascending: false })
        .limit(limit * 2);

      if (grade > 0) {
        query = query.eq("grade", grade);
      }
      if (mode !== "all") {
        query = query.eq("mode", mode);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const formatted: LeaderboardEntry[] = data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          userSchool: r.user_school,
          avatarColor: r.avatar_color,
          avatarIcon: r.avatar_icon,
          score: r.score,
          maxCombo: r.max_combo,
          accuracy: r.accuracy,
          matchesCount: r.matches_count,
          mode: r.mode,
          grade: r.grade,
          playedAt: Number(r.played_at),
        }));
        const deduped = deduplicateScores(formatted).slice(0, limit);
        return NextResponse.json({ success: true, source: "supabase", scores: deduped });
      }
    } catch (supaErr) {
      console.warn("Supabase fetch failed, falling back to SQLite:", supaErr);
    }

    // 2. Dự phòng: Đọc từ SQLite cục bộ
    let rows: any[] = [];
    try {
      let query = "SELECT * FROM minigame_scores WHERE score > 0";
      const params: any[] = [];

      if (grade > 0) {
        query += " AND grade = ?";
        params.push(grade);
      }
      if (mode !== "all") {
        query += " AND mode = ?";
        params.push(mode);
      }

      query += " ORDER BY score DESC, played_at DESC LIMIT ?";
      params.push(limit * 2);

      rows = db.prepare(query).all(...params);
    } catch (err) {
      // Fallback
    }

    if (!rows || rows.length === 0) {
      // 3. Dự phòng cấp 3: Dùng danh sách Top mẫu chuẩn
      let filtered = [...DEFAULT_LEADERBOARD];
      if (grade > 0) filtered = filtered.filter((item) => item.grade === 0 || item.grade === grade);
      if (mode !== "all") filtered = filtered.filter((item) => item.mode === mode);
      return NextResponse.json({ success: true, source: "default", scores: deduplicateScores(filtered).slice(0, limit) });
    }

    const formatted: LeaderboardEntry[] = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userSchool: r.user_school,
      avatarColor: r.avatar_color,
      avatarIcon: r.avatar_icon,
      score: r.score,
      maxCombo: r.max_combo,
      accuracy: r.accuracy,
      matchesCount: r.matches_count,
      mode: r.mode,
      grade: r.grade,
      playedAt: r.played_at,
    }));

    const deduped = deduplicateScores(formatted).slice(0, limit);
    return NextResponse.json({ success: true, source: "sqlite", scores: deduped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      userName,
      userSchool,
      avatarColor,
      avatarIcon,
      score,
      maxCombo,
      accuracy,
      matchesCount,
      mode = "blitz",
      grade = 0,
    } = body;

    // Không lưu các lượt chơi 0 điểm để tránh rác bảng xếp hạng
    if (!userName || typeof score !== "number" || score <= 0) {
      return NextResponse.json({ error: "Điểm số không hợp lệ để ghi nhận" }, { status: 400 });
    }

    const id = "score-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const playedAt = Date.now();

    const record = {
      id,
      user_id: userId || null,
      user_name: userName.trim(),
      user_school: userSchool?.trim() || null,
      avatar_color: avatarColor || "#3b82f6",
      avatar_icon: avatarIcon || "HS",
      score,
      max_combo: maxCombo || 0,
      accuracy: accuracy || 100,
      matches_count: matchesCount || 0,
      mode,
      grade,
      played_at: playedAt,
    };

    // 1. Lưu lên Supabase: Cập nhật nếu điểm mới cao hơn điểm cũ
    try {
      let supaExisting: any = null;
      if (record.user_id) {
        const { data } = await supabase
          .from("minigame_scores")
          .select("*")
          .eq("user_id", record.user_id)
          .eq("mode", record.mode)
          .order("score", { ascending: false })
          .limit(1);
        if (data && data.length > 0) supaExisting = data[0];
      }

      if (supaExisting) {
        if (record.score > supaExisting.score) {
          await supabase
            .from("minigame_scores")
            .update({
              score: record.score,
              max_combo: record.max_combo,
              accuracy: record.accuracy,
              matches_count: record.matches_count,
              played_at: record.played_at,
              user_school: record.user_school,
              avatar_color: record.avatar_color,
            })
            .eq("id", supaExisting.id);
        }
      } else {
        await supabase.from("minigame_scores").insert(record);
      }
    } catch (e) {
      console.warn("Supabase insert/update minigame_scores error:", e);
    }

    // 2. Lưu dự phòng SQLite cục bộ: Cập nhật nếu điểm mới cao hơn điểm cũ
    try {
      let existing: any = null;
      if (record.user_id) {
        existing = db
          .prepare("SELECT * FROM minigame_scores WHERE user_id = ? AND mode = ? AND grade = ?")
          .get(record.user_id, record.mode, record.grade);
      }
      if (!existing) {
        existing = db
          .prepare("SELECT * FROM minigame_scores WHERE LOWER(user_name) = LOWER(?) AND mode = ? AND grade = ?")
          .get(record.user_name, record.mode, record.grade);
      }

      if (existing) {
        // Chỉ cập nhật nếu đạt kỷ lục điểm số mới cao hơn
        if (record.score > existing.score) {
          db.prepare(`
            UPDATE minigame_scores
            SET score = ?, max_combo = ?, accuracy = ?, matches_count = ?, played_at = ?, avatar_color = ?, avatar_icon = ?, user_school = ?
            WHERE id = ?
          `).run(
            record.score,
            record.max_combo,
            record.accuracy,
            record.matches_count,
            record.played_at,
            record.avatar_color,
            record.avatar_icon,
            record.user_school,
            existing.id
          );
        }
      } else {
        const stmt = db.prepare(`
          INSERT INTO minigame_scores (
            id, user_id, user_name, user_school, avatar_color, avatar_icon,
            score, max_combo, accuracy, matches_count, mode, grade, played_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          id,
          record.user_id,
          record.user_name,
          record.user_school,
          record.avatar_color,
          record.avatar_icon,
          record.score,
          record.max_combo,
          record.accuracy,
          record.matches_count,
          record.mode,
          record.grade,
          record.played_at
        );
      }
    } catch (e) {
      console.warn("Could not insert/update sqlite:", e);
    }

    return NextResponse.json({
      success: true,
      entry: {
        id,
        userId,
        userName,
        userSchool,
        avatarColor,
        avatarIcon,
        score,
        maxCombo,
        accuracy,
        matchesCount,
        mode,
        grade,
        playedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
