import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role, school } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        // Chuẩn hóa email
        const cleanEmail = String(email).trim().toLowerCase().replace(/,com$/, '.com');

        // Kiểm tra định dạng email hợp lệ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return NextResponse.json({ error: "Định dạng email không hợp lệ (ví dụ: giaovien@gmail.com)" }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .ilike('email', cleanEmail);

        if (checkError) {
            console.error("Check existing user error:", checkError);
            return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu: " + checkError.message }, { status: 500 });
        }
        
        if (existingUsers && existingUsers.length > 0) {
            return NextResponse.json({ error: "Email này đã được đăng ký trong hệ thống" }, { status: 400 });
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const userId = crypto.randomUUID();

        // Insert into database
        const { error } = await supabase
            .from('users')
            .insert({
                id: userId,
                name: String(name).trim(),
                email: cleanEmail,
                password: hashedPassword,
                role,
                school: school ? String(school).trim() : null
            });

        if (error) {
            throw new Error(error.message);
        }

        const newUser = {
            id: userId,
            name: String(name).trim(),
            email: cleanEmail,
            role,
            school: school ? String(school).trim() : undefined
        };

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Lỗi máy chủ nội bộ" }, { status: 500 });
    }
}
