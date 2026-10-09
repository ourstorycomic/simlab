import db from "../src/lib/db";
import bcrypt from "bcryptjs";

console.log("Seeding SQL database with demo accounts...");

const salt = bcrypt.genSaltSync(10);
const password = bcrypt.hashSync("demo123", salt);

const users = [
    { id: "u_teacher_demo", name: "Cô Minh Anh", email: "gv@simlab.vn", role: "teacher", school: "THPT Chuyên KHTN" },
    { id: "u_student_demo", name: "Nguyễn Văn An", email: "hs@simlab.vn", role: "student", school: "THPT Chuyên KHTN" },
    { id: "u_s_binh", name: "Trần Văn Bình", email: "binh@simlab.vn", role: "student", school: "THPT Chuyên KHTN" }
];

const stmt = db.prepare("INSERT OR IGNORE INTO users (id, name, email, password, role, school) VALUES (?, ?, ?, ?, ?, ?)");

for (const u of users) {
    stmt.run(u.id, u.name, u.email, password, u.role, u.school);
    console.log(`Seeded user: ${u.email}`);
}

console.log("Done seeding!");
