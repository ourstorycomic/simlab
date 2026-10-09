const fs = require('fs');

let teacher = fs.readFileSync('src/app/dashboard/teacher/page.tsx', 'utf8');

const newTeacherSteps = `const tourSteps: TourStep[] = [
        {
            target: "#tour-tab-classes",
            title: "1. Quản lý lớp học",
            description: "Đây là nơi bạn tạo lớp và quản lý học sinh.",
            tabId: "tour-tab-classes"
        },
        {
            target: "#class-name",
            title: "2. Tạo lớp học mới",
            description: "Nhập tên lớp học vào đây (ví dụ: Hóa 10A1).",
            tabId: "tour-tab-classes"
        },
        {
            target: "#btn-create-class",
            title: "3. Xác nhận tạo lớp",
            description: "Bấm nút này để tạo lớp. Hệ thống sẽ cấp một mã để học sinh tham gia.",
            tabId: "tour-tab-classes"
        },
        {
            target: "#tour-tab-assignments",
            title: "4. Giao bài tập",
            description: "Bấm sang tab này để giao bài thực hành cho học sinh.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#assign-class",
            title: "5. Chọn lớp",
            description: "Chọn lớp học mà bạn vừa tạo.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#assign-exp",
            title: "6. Chọn thí nghiệm",
            description: "Chọn bài thực hành từ kho nội dung bám sát GDPT 2018.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#btn-create-assignment",
            title: "7. Giao bài",
            description: "Sau khi điền đủ thông tin, bấm nút này để giao bài cho học sinh.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#tour-tab-results",
            title: "8. Xem kết quả",
            description: "Bạn có thể theo dõi tiến độ, điểm số và lỗi an toàn của học sinh tại đây.",
            tabId: "tour-tab-results"
        }
    ];`;

teacher = teacher.replace(/const tourSteps:\s*TourStep\[\]\s*=\s*\[[\s\S]*?\];/, newTeacherSteps);
// Add IDs to submit buttons
teacher = teacher.replace(
    /<button type="submit" className="lab-btn-primary w-full py-2(.*?)>Tạo lớp<\/button>/,
    '<button type="submit" id="btn-create-class" className="lab-btn-primary w-full py-2$1>Tạo lớp</button>'
);
teacher = teacher.replace(
    /<button type="submit" className="lab-btn-primary w-full py-2(.*?)>Giao bài<\/button>/,
    '<button type="submit" id="btn-create-assignment" className="lab-btn-primary w-full py-2$1>Giao bài</button>'
);

fs.writeFileSync('src/app/dashboard/teacher/page.tsx', teacher);

let student = fs.readFileSync('src/app/dashboard/student/page.tsx', 'utf8');

const newStudentSteps = `const tourSteps: TourStep[] = [
        {
            target: "#tour-tab-assignments",
            title: "1. Bài tập của tôi",
            description: "Đây là nơi hiển thị các bài tập giáo viên đã giao.",
            tabId: "tour-tab-assignments"
        },
        {
            target: "#tour-tab-classes",
            title: "2. Lớp học",
            description: "Bạn có thể vào tab này để tham gia lớp học mới.",
            tabId: "tour-tab-classes"
        },
        {
            target: "#join-code",
            title: "3. Nhập mã lớp",
            description: "Nhập mã lớp do giáo viên cung cấp vào ô này.",
            tabId: "tour-tab-classes"
        },
        {
            target: "#btn-join-class",
            title: "4. Tham gia",
            description: "Bấm nút này để vào lớp. Sau khi vào lớp, các bài tập giáo viên giao sẽ xuất hiện ở tab Bài tập.",
            tabId: "tour-tab-classes"
        },
        {
            target: "#tour-free-lab",
            title: "5. Thực hành tự do",
            description: "Bạn có thể vào thẳng các phòng lab để tự do khám phá mà không cần bài tập.",
            tabId: "tour-tab-assignments" // Dùng tab mặc định
        },
        {
            target: "#tour-gamification",
            title: "6. Tiến độ của bạn",
            description: "Theo dõi điểm XP, chuỗi ngày học liên tiếp và huy hiệu bạn đã đạt được.",
            tabId: "tour-tab-activity"
        }
    ];`;

student = student.replace(/const tourSteps:\s*TourStep\[\]\s*=\s*\[[\s\S]*?\];/, newStudentSteps);
student = student.replace(
    /<button type="submit" className="lab-btn-primary px-4 py-2(.*?)>Tham gia<\/button>/,
    '<button type="submit" id="btn-join-class" className="lab-btn-primary px-4 py-2$1>Tham gia</button>'
);

fs.writeFileSync('src/app/dashboard/student/page.tsx', student);
