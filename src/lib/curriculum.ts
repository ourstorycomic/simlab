// ─── Chương trình học (Curriculum) ───
// Bảng map thí nghiệm theo lớp, chương, bài của chương trình GDPT 2018.
// Mỗi bài học gắn với danh sách ID thí nghiệm tương ứng trong experiments.ts.

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  name: string;
  /** ID thí nghiệm liên quan (trong experiments.ts) */
  experimentIds: string[];
}

export interface GradeCurriculum {
  grade: number;
  label: string;
  chapters: Chapter[];
}

export const curriculum: GradeCurriculum[] = [
  // ── HÓA HỌC ───────────────────────────────────────────────────────
  {
    grade: 8,
    label: "Lớp 8",
    chapters: [
      {
        id: "g8-c1",
        name: "[Hóa học] Chương 1: Chất – Nguyên tử – Phân tử",
        lessons: [
          {
            id: "g8-c1-b4",
            name: "Bài 4: Nguyên tử",
            experimentIds: ["exp-quytim-naoh"],
          },
        ],
      },
      {
        id: "g8-c4",
        name: "[Hóa học] Chương 4: Oxi – Không khí",
        lessons: [
          {
            id: "g8-c4-b24",
            name: "Bài 24: Tính chất của oxi",
            experimentIds: ["exp-h2o2-mno2", "exp-mg-burn"],
          },
        ],
      },
      {
        id: "g8-c5",
        name: "[Vật lý] Chương 4: Nhiệt học",
        lessons: [
          {
            id: "g8-c5-b25",
            name: "Bài 25: Phương trình cân bằng nhiệt",
            experimentIds: ["exp-heat-specific"],
          },
        ],
      },
    ],
  },
  {
    grade: 9,
    label: "Lớp 9",
    chapters: [
      {
        id: "g9-c1",
        name: "Chương 1: Các hợp chất vô cơ",
        lessons: [
          {
            id: "g9-c1-b4",
            name: "Bài 4: Một số axit quan trọng",
            experimentIds: ["exp-caco3-hcl"],
          },
          {
            id: "g9-c1-b8",
            name: "Bài 8: Một số bazơ quan trọng",
            experimentIds: ["exp-cuso4-naoh"],
          },
          {
            id: "g9-c1-b9",
            name: "Bài 9: Tính chất hóa học của muối",
            experimentIds: ["exp-agno3-nacl", "exp-bacl2-na2so4"],
          },
        ],
      },
      {
        id: "g9-c2",
        name: "[Hóa học] Chương 2: Kim loại",
        lessons: [
          {
            id: "g9-c2-b16",
            name: "Bài 16: Tính chất hóa học của kim loại",
            experimentIds: ["exp-hcl-zn"],
          },
          {
            id: "g9-c2-b17",
            name: "Bài 17: Dãy hoạt động hóa học của kim loại",
            experimentIds: ["exp-fe-cuso4"],
          },
        ],
      },
      {
        id: "g9-c3",
        name: "[Hóa học] Chương 3: Phi kim – Sơ lược về bảng tuần hoàn",
        lessons: [
          {
            id: "g9-c3-b30",
            name: "Bài 30: Silic và hợp chất của silic",
            experimentIds: ["exp-caco3-heat"],
          },
        ],
      },
      {
        id: "g9-c5",
        name: "[Hóa học] Chương 5: Dẫn xuất của hidrocacbon",
        lessons: [
          {
            id: "g9-c5-b44",
            name: "Bài 44: Rượu etylic",
            experimentIds: ["exp-etanol-heat"],
          },
        ],
      },
      // Vật lý lớp 9
      {
        id: "g9-vl-c1",
        name: "[Vật lý] Chương 1: Điện học",
        lessons: [
          {
            id: "g9-vl-c1-b1",
            name: "Bài 1: Định luật Ohm",
            experimentIds: ["exp-ohm-law"],
          },
        ],
      },
      {
        id: "g9-vl-c2",
        name: "[Vật lý] Chương 2: Quang học",
        lessons: [
          {
            id: "g9-vl-c2-b40",
            name: "Bài 40: Hiện tượng khúc xạ ánh sáng",
            experimentIds: ["exp-reflection"],
          },
        ],
      },
    ],
  },
  {
    grade: 10,
    label: "Lớp 10",
    chapters: [
      {
        id: "g10-c4",
        name: "[Hóa học] Chương 4: Phản ứng oxi hóa – khử",
        lessons: [
          {
            id: "g10-c4-b15",
            name: "Bài 15: Phản ứng oxi hóa – khử",
            experimentIds: ["exp-feso4-kmno4"],
          },
        ],
      },
      {
        id: "g10-c5",
        name: "[Hóa học] Chương 5: Nhóm halogen",
        lessons: [
          {
            id: "g10-c5-b22",
            name: "Bài 22: Clo và hợp chất của clo",
            experimentIds: ["exp-pbno32-ki"],
          },
        ],
      },
      // Vật lý lớp 10
      {
        id: "g10-vl-c2",
        name: "[Vật lý] Chương 2: Động lực học chất điểm",
        lessons: [
          {
            id: "g10-vl-c2-b11",
            name: "Bài 11: Lực đàn hồi của lò xo — Định luật Hooke",
            experimentIds: ["exp-hookes-law"],
          },
        ],
      },
      {
        id: "g10-vl-c3",
        name: "[Vật lý] Chương 3: Dao động cơ",
        lessons: [
          {
            id: "g10-vl-c3-b11",
            name: "Bài 11: Con lắc đơn",
            experimentIds: ["exp-pendulum"],
          },
        ],
      },
      // Sinh học lớp 10
      {
        id: "g10-sh-c1",
        name: "[Sinh học] Chương 1: Giới thiệu về sinh học",
        lessons: [
          {
            id: "g10-sh-c1-b3",
            name: "Bài 10: Tuần hoàn ở động vật",
            experimentIds: ["exp-bio-heart"],
          },
          {
            id: "g10-sh-c1-b4",
            name: "Bài 14: Hệ thần kinh ở động vật trong chuyển hóa vật chất",
            experimentIds: ["exp-bio-brain"],
          },
        ],
      },
      {
        id: "g10-sh-c2",
        name: "[Sinh học] Chương 2: Cấu trúc tế bào",
        lessons: [
          {
            id: "g10-sh-c2-b8",
            name: "Bài 8: Tế bào nhân thực",
            experimentIds: ["exp-bio-brain"],
          },
        ],
      },
    ],
  },
  {
    grade: 11,
    label: "Lớp 11",
    chapters: [
      {
        id: "g11-c2",
        name: "[Hóa học] Chương 2: Nitơ – Photpho",
        lessons: [
          {
            id: "g11-c2-b8",
            name: "Bài 8: Amoniac và muối amoni",
            experimentIds: ["exp-nh3-hcl"],
          },
        ],
      },
      // Vật lý lớp 11
      {
        id: "g11-vl-c7",
        name: "[Vật lý] Chương 7: Mắt và các dụng cụ quang học",
        lessons: [
          {
            id: "g11-vl-c7-b29",
            name: "Bài 29: Thấu kính mỏng",
            experimentIds: ["exp-optics-lens"],
          },
        ],
      },
      // Sinh học lớp 11
      {
        id: "g11-sh-c1",
        name: "[Sinh học] Chương 1: Chuyển hóa vật chất và năng lượng ở thực vật",
        lessons: [
          {
            id: "g11-sh-c1-b2",
            name: "Bài 10: Tuần hoàn ở động vật",
            experimentIds: ["exp-bio-heart"],
          },
          {
            id: "g11-sh-c1-b9",
            name: "Bài 15: Cơ quan phân tích thị giác",
            experimentIds: ["exp-bio-eye"],
          },
        ],
      },
    ],
  },
  {
    grade: 12,
    label: "Lớp 12",
    chapters: [
      {
        id: "g12-c7",
        name: "[Hóa học] Chương 7: Sắt và một số kim loại quan trọng",
        lessons: [
          {
            id: "g12-c7-b25",
            name: "Bài 25: Sắt và hợp chất của sắt",
            experimentIds: ["exp-fecl3-kscn"],
          },
        ],
      },
    ],
  },
];

// ─── Tiện ích tra cứu ───

export function getGradeCurriculum(grade: number): GradeCurriculum | undefined {
  return curriculum.find((g) => g.grade === grade);
}

export function getAllLessonCount(): number {
  return curriculum.reduce(
    (sum, g) => sum + g.chapters.reduce((s, c) => s + c.lessons.length, 0),
    0
  );
}

export function getAllExperimentIds(): string[] {
  const ids = new Set<string>();
  for (const g of curriculum) {
    for (const c of g.chapters) {
      for (const l of c.lessons) {
        l.experimentIds.forEach((id) => ids.add(id));
      }
    }
  }
  return Array.from(ids);
}

/** Lấy thông tin bài học của một thí nghiệm (dùng cho dashboard) */
export function findLessonForExperiment(expId: string): { grade: number; chapter: string; lesson: string } | null {
  for (const g of curriculum) {
    for (const c of g.chapters) {
      for (const l of c.lessons) {
        if (l.experimentIds.includes(expId)) {
          return { grade: g.grade, chapter: c.name, lesson: l.name };
        }
      }
    }
  }
  return null;
}
