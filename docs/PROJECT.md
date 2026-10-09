# Simlab — Phòng thí nghiệm Hóa học Ảo

> **Bản quyền tài liệu:** Simlab · Cập nhật lần cuối: 07/2026 · Phiên bản: 1.0 (MVP B2B)

Simlab là nền tảng **phòng thí nghiệm hóa học ảo** dành cho giáo viên và học sinh trung học (lớp 8–12) tại Việt Nam, bám sát **Chương trình Giáo dục phổ thông 2018 (GDPT 2018)**. Học sinh được thực hành thí nghiệm an toàn, trực quan; giáo viên giao bài, chấm điểm tự động và theo dõi kết quả cả lớp.

---

## 1. Tầm nhìn & Vị trí sản phẩm

### 1.1 Vấn đề

- Hóa học là môn học **bắt buộc** từ lớp 8 đến lớp 12, nhưng nhiều trường **thiếu phòng thí nghiệm, hóa chất, dụng cụ**.
- Thí nghiệm thật tiềm ẩn rủi ro (axit, bazơ mạnh, chất dễ cháy nổ), tốn kém và mất thời gian chuẩn bị.
- Học sinh gặp khó trong việc **hình dung phản ứng** chỉ qua lý thuyết và phương trình.
- Giáo viên không có công cụ **giao bài thực hành + chấm điểm tự động + thống kê** bám chương trình.

### 1.2 Giải pháp

| Khía cạnh | Giải pháp Simlab |
|---|---|
| **An toàn** | Mô phỏng đầy đủ hiện tượng (sủi bọt, kết tủa, cháy, đổi màu…) mà không có rủi ro thật |
| **Đúng chương trình** | 15 thí nghiệm mẫu map theo lớp/chương/bài SGK GDPT 2018 (lớp 8–12) |
| **Vai trò giáo viên** | Tạo lớp (mã mời), giao bài thí nghiệm, xem bảng điểm, xuất CSV |
| **Vai trò học sinh** | Vào lớp bằng mã, làm thí nghiệm theo bài được giao, trả lời câu hỏi, nộp bài |
| **Đánh giá** | Quiz tự động chấm, điểm /10, giải thích đáp án từng câu |

### 1.3 Đối tượng

- **B2B (chính)**: Trường THCS/THPT, trung tâm luyện thi, giáo viên bộ môn Hóa.
- **B2C (phụ)**: Học sinh tự ôn luyện, phụ huynh.

---

## 2. Kiến trúc kỹ thuật

### 2.1 Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 14 (App Router, React 18, TypeScript 5.4) |
| Styling | Tailwind CSS 3.4 + CSS animations tùy biến |
| Hiệu ứng phản ứng | HTML5 Canvas (`ReactionEffects`) + SVG (`Beaker`, `TransactionAnimation`) |
| Hiệu ứng kỷ niệm | canvas-confetti |
| Dữ liệu (MVP) | localStorage — lớp dữ liệu đồng bộ (`src/lib/storage.ts`), sẵn sàng thay bằng Supabase/Postgres |
| Lint/Validate | ESLint (`next/core-web-vitals`), `npm run validate` (tsx) |

### 2.2 Cấu trúc thư mục

```
simlab/
├─ docs/
│  └─ PROJECT.md                    # Tài liệu dự án (file này)
├─ scripts/
│  └─ validate-reactions.ts         # Kiểm tra tính hợp lệ của CSDL phản ứng
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 # Root layout, dark mode script, SEO
│  │  ├─ page.tsx                   # Trang chủ: hero + đăng nhập/đăng ký
│  │  ├─ globals.css                # Tailwind + keyframes hoạt ảnh
│  │  ├─ globals.d.ts               # Khai báo kiểu cho canvas-confetti
│  │  ├─ lab/
│  │  │  └─ page.tsx                # /lab — Phòng thí nghiệm (Suspense + LabBench)
│  │  └─ dashboard/
│  │     ├─ teacher/page.tsx        # /dashboard/teacher — Quản lý lớp, bài, điểm, CSV
│  │     └─ student/page.tsx        # /dashboard/student — Vào lớp, bài được giao
│  ├─ components/
│  │  ├─ LabBench.tsx               # Màn hình chính phòng thí nghiệm
│  │  ├─ Beaker.tsx                 # Ống nghiệm / cốc thủy tinh SVG động
│  │  ├─ ChemicalSelector.tsx       # Kho hóa chất (drag & drop / click)
│  │  ├─ ReactionEffects.tsx        # Particle effects trên Canvas
│  │  ├─ ReactionInfo.tsx           # Thẻ thông tin phản ứng
│  │  ├─ ExperimentPanel.tsx        # Danh sách thí nghiệm mẫu
│  │  ├─ SafetyModal.tsx            # Cảnh báo an toàn hóa chất
│  │  └─ AssignmentQuiz.tsx         # Overlay câu hỏi + nộp bài
│  └─ lib/
│     ├─ chemicals.ts               # CSDL 67 hóa chất (màu, trạng thái, độc hại…)
│     ├─ reactions.ts               # Công cụ phản ứng 4422 cặp + phản ứng nhiệt phân
│     ├─ experiments.ts             # 15 thí nghiệm mẫu + lý thuyết + quiz SGK
│     ├─ curriculum.ts              # Map lớp/chương/bài GDPT 2018
│     ├─ storage.ts                 # Lớp dữ liệu localStorage (users/classes/assignments/submissions)
│     └─ glassware.ts               # Đề xuất dụng cụ thủy tinh theo phản ứng
```

### 2.3 Luồng dữ liệu (MVP)

```
┌────────────┐   login/register   ┌──────────────────┐
│  Trang chủ │ ─────────────────▶ │  localStorage     │
└────────────┘                    │  (storage.ts)     │
        ▲                         └──────────────────┘
        │                                ▲
┌───────┴─────────┐   giao bài    ┌──────┴──────────┐
│ Teacher dashboard│ ───────────▶ │ Assignment      │
│ (lớp, mã mời)    │              │ (class+experiment)│
└─────────────────┘               └─────────────────┘
        ▲                                │ học sinh làm
        │                                ▼
┌───────┴─────────┐   nộp bài    ┌──────────────────┐
│ Student dashboard│◀─────────── │ LabBench + Quiz  │
│ (kết quả, điểm)  │  submission │ (/lab?assignment)│
└─────────────────┘              └──────────────────┘
```

---

## 3. Tính năng chi tiết

### 3.1 Phòng thí nghiệm ảo (`/lab`)

- **67 hóa chất** (kim loại, dung dịch, oxit, axit/bazơ/muối…) với màu sắc, trạng thái, mức độ nguy hiểm riêng.
- **Thao tác**: click hoặc drag & drop hóa chất vào ống nghiệm/cốc; đốt nóng; xóa; chọn dụng cụ thủy tinh phù hợp (tự đề xuất).
- **4422 cặp phản ứng** — đúng có phản ứng (hiện tượng + phương trình + giải thích), sai không có phản ứng.
- **Hiệu ứng**: sủi bọt, kết tủa, cháy, đổi màu, khói, tia lửa, nhiệt lượng… trên Canvas/SVG.
- **Cảnh báo an toàn**: hóa chất ăn mòn/độc/dễ cháy phải xác nhận trước khi dùng.
- **15 thí nghiệm mẫu** bám SGK — mỗi thí nghiệm có mục tiêu, lý thuyết, PTHH, các bước tiến hành, hiện tượng dự kiến, lưu ý an toàn.
- **Chế độ bài tập** (`/lab?assignment=<id>`): tự nạp thí nghiệm được giao, hiện banner bài tập, nút **Nộp bài** mở quiz.

### 3.2 Trang chủ (`/`)

- Hero giới thiệu + thống kê (67 hóa chất · 15 thí nghiệm · chấm điểm tự động).
- Đăng nhập / đăng ký theo vai **Giáo viên** hoặc **Học sinh**.
- Nút đăng nhập demo 1 click với 2 tài khoản mẫu.

### 3.3 Dashboard giáo viên (`/dashboard/teacher`)

| Tab | Tính năng |
|---|---|
| **Lớp học** | Tạo lớp (tên, khối lớp 8–12), tự sinh **mã mời 6 ký tự** (VD `HOA10A`), danh sách lớp kèm mã |
| **Giao bài** | Chọn lớp → chọn thí nghiệm (xem trước mục tiêu bài học) → tiêu đề → hạn nộp; danh sách bài đã giao kèm số bài nộp |
| **Kết quả** | Chọn lớp → chọn bài → bảng điểm từng học sinh (Điểm /10, Đúng/Tổng, thời gian nộp), màu phân loại, **Xuất CSV** (tương thích Excel tiếng Việt) |

### 3.4 Dashboard học sinh (`/dashboard/student`)

- **Vào lớp**: nhập mã mời (VD `HOA10A`) → gia nhập lớp ngay.
- **Bài được giao**: lọc theo khối lớp, xem trạng thái `✅ Đã nộp · x/y` hoặc `⏳ Chưa nộp`, nút **Làm thí nghiệm** mở `/lab?assignment=<id>`.
- **Chương trình học**: duyệt khối lớp → chương → bài học kèm thí nghiệm liên quan.

### 3.5 Bài tập & chấm điểm

- Mỗi thí nghiệm mẫu kèm **2–3 câu hỏi trắc nghiệm** (có giải thích đáp án).
- Học sinh trả lời đủ câu → **Nộp bài** → chấm tự động, điểm /10.
- Kết quả lưu theo `assignmentId + studentId`; làm lại được phép, điểm cập nhật (upsert).

### 3.6 Tài khoản demo

| Vai trò | Email | Mật khẩu | Thông tin |
|---|---|---|---|
| Giáo viên | `gv@simlab.vn` | `demo123` | Cô Minh Anh — THPT Chuyên KHTN |
| Học sinh | `hs@simlab.vn` | `demo123` | Nguyễn Văn An — Lớp 10A1 |

Mã lớp demo: **`HOA10A`** · Bài demo: *Thí nghiệm FeSO₄ + KMnO₄ trong H₂SO₄*.

> Dữ liệu demo được seed tự động vào localStorage lần đầu chạy (key `simlab_seeded_v2`). Muốn reset: xóa localStorage của trình duyệt.

---

## 4. Cơ sở dữ liệu (storage.ts)

| Bảng | Key | Nội dung |
|---|---|---|
| users | `simlab_users` | id, name, email, password, role (`teacher`/`student`), school, createdAt |
| classes | `simlab_classes` | id, name, code (mã mời), teacherId, grade, description, createdAt |
| assignments | `simlab_assignments` | id, classId, teacherId, experimentId, title, dueDate, createdAt |
| submissions | `simlab_submissions` | id, assignmentId, studentId, correctCount, totalQuestions, answers[], submittedAt |
| session | `simlab_session` | userId đang đăng nhập |
| joined | `simlab_joined` | Map `studentId → mã lớp đã tham gia` |

**API chính**: `seedIfNeeded`, `registerUser`, `loginUser`, `getCurrentUser`, `logout`, `createClass`, `getClassByCode`, `getClassById`, `createAssignment`, `getAssignmentById`, `getAssignmentsForStudent`, `joinClass`, `submitAssignment`, `getSubmission`, `getSubmissionsForAssignment`, `getStudentCountForClass`.

> **Lộ trình nâng cấp**: thay các hàm này bằng API Supabase/Postgres mà không đổi giao diện — tầng dữ liệu đã được cô lập hoàn toàn.

---

## 5. Dữ liệu chương trình (GDPT 2018)

### 5.1 Thí nghiệm mẫu theo khối lớp

| Lớp | Số thí nghiệm | Ví dụ |
|---|---|---|
| 8 | 3 | Quỳ tím + NaOH · Điều chế O₂ (H₂O₂/MnO₂) · Mg cháy trong không khí |
| 9 | 8 | Zn + HCl · CuSO₄ + NaOH · CaCO₃ + HCl · AgNO₃ + NaCl · BaCl₂ + Na₂SO₄ · Đốt cháy etanol · Fe + CuSO₄ · Nhiệt phân CaCO₃ |
| 10 | 2 | FeSO₄ + KMnO₄ trong H₂SO₄ · Pb(NO₃)₂ + KI |
| 11 | 1 | NH₃ + HCl (khói trắng) |
| 12 | 1 | FeCl₃ + KSCN (màu máu đỏ) |

**Tổng**: 15 thí nghiệm · 67 hóa chất · 4422 cặp phản ứng.

### 5.2 Cấu trúc dữ liệu thí nghiệm

```ts
interface Experiment {
  id: string; name: string; emoji: string; description: string;
  chemicalIds: string[]; stepLabels: string[]; expected: string; note?: string;
  badge: "gas" | "precipitate" | "flame" | "color" | "heat";
  // Metadata SGK GDPT 2018
  grade: number; chapter: string; lesson: string;
  objectives: string[]; equations: string[]; theory: string;
  steps: string[]; quiz: QuizQuestion[];
}
```

---

## 6. Hướng dẫn cài đặt & chạy

```bash
# 1. Cài dependencies
npm install

# 2. Chạy môi trường phát triển (http://localhost:3000)
npm run dev

# 3. Build production
npm run build
npm run start

# 4. Kiểm tra chất lượng
npm run lint        # ESLint (next/core-web-vitals)
npm run validate    # Kiểm tra CSDL 4422 cặp phản ứng + 15 thí nghiệm
```

### Luồng trải nghiệm demo (khuyến nghị)

1. Mở trang chủ → bấm **Đăng nhập demo giáo viên** → vào tab *Giao bài* thấy bài đã giao lớp 10A1 → tab *Kết quả* xem bảng điểm.
2. Bấm **Đăng xuất** → **Đăng nhập demo học sinh** → thấy lớp `10A1 - Hóa học` và bài được giao.
3. Bấm **Làm thí nghiệm** → tự động nạp FeSO₄ + KMnO₄ → quan sát hiện tượng (màu tím nhạt dần, kết tủa) → **Nộp bài** → trả lời quiz → xem điểm + giải thích.
4. Quay lại dashboard học sinh → trạng thái bài chuyển `✅ Đã nộp`; giáo viên thấy điểm mới trong *Kết quả*.

---

## 7. Lộ trình phát triển

| Giai đoạn | Nội dung | Ưu tiên |
|---|---|---|
| **A. Nền tảng dữ liệu** | Mở rộng CSDL thí nghiệm theo SGK (đủ các bài thực hành bắt buộc lớp 8–12), chuẩn hóa metadata | P0 |
| **B. Đa vai trò** | Xác thực thật (Supabase Auth), quản lý trường học, phân quyền chi tiết | P0 |
| **C. Ngân hàng câu hỏi** | Quiz theo ma trận đánh giá, nhiều mức độ (nhận biết → vận dụng), tự sinh đề | P1 |
| **D. Thí điểm (pilot)** | 3–5 trường thí điểm, thu thập phản hồi, đo lường kết quả học tập | P1 |
| **E. Mở rộng** | Mô phỏng vật lý/sinh học, gói thuê bao B2B, báo cáo cho nhà trường/Sở | P2 |

### Hạ tầng mục tiêu

- **Frontend**: Next.js (giữ nguyên) + PWA để dùng offline trên máy tính phòng thí nghiệm.
- **Backend**: Supabase (Auth + Postgres + Storage) hoặc Node API; đồng bộ dữ liệu lớp học.
- **Nội dung**: Đội ngũ giáo viên giàu kinh nghiệm rà soát lý thuyết, PTHH, quiz theo từng bộ SGK (Kết nối tri thức, Chân trời sáng tạo, Cánh diều).

---

## 8. An toàn & Đạo đức sản phẩm

- Mô phỏng **không thay thế** hoàn toàn thí nghiệm thật — là công cụ hỗ trợ thực hành và ôn luyện an toàn.
- Cảnh báo độc tính, ăn mòn, dễ cháy hiển thị đúng theo tính chất hóa học của từng chất.
- Nội dung bám sát chuẩn kiến thức GDPT 2018; mọi phương trình hóa học được kiểm tra cân bằng.
- Không thu thập dữ liệu cá nhân ngoài phạm vi tài khoản học tập (MVP lưu cục bộ trên máy người dùng).

---

## 9. Thông tin thêm

- **Script validate**: [`scripts/validate-reactions.ts`](../scripts/validate-reactions.ts) kiểm tra: mọi cặp hóa chất có phản ứng xác định, mọi thí nghiệm dùng hóa chất tồn tại, mọi quiz có đáp án hợp lệ.
- **Tiện ích phát triển**: tất cả dữ liệu hóa chất/phản ứng nằm tập trung tại `src/lib/`, dễ mở rộng và kiểm thử.
