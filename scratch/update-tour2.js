const fs = require('fs');

let student = fs.readFileSync('src/app/dashboard/student/page.tsx', 'utf8');

// Add id to VIEW_TABS buttons so driver.js can target them
student = student.replace(
    /key=\{t\.id\}\s*role="tab"/g,
    'key={t.id}\n                                      id={`tour-tab-${t.id}`}\n                                      role="tab"'
);

const newStudentSteps = `const tourSteps: TourStep[] = [
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
    ];`;

student = student.replace(/const tourSteps:\s*TourStep\[\]\s*=\s*\[[\s\S]*?\];/, newStudentSteps);

fs.writeFileSync('src/app/dashboard/student/page.tsx', student);

let teacher = fs.readFileSync('src/app/dashboard/teacher/page.tsx', 'utf8');
// Fix teacher tourSteps description to be more accurate
const newTeacherSteps = `const tourSteps: TourStep[] = [
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
    ];`;
teacher = teacher.replace(/const tourSteps:\s*TourStep\[\]\s*=\s*\[[\s\S]*?\];/, newTeacherSteps);
fs.writeFileSync('src/app/dashboard/teacher/page.tsx', teacher);
