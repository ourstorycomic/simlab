import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 });
        }

        const cleanEmail = String(email).trim().toLowerCase().replace(/,com$/, '.com');

        // Tìm kiếm email không phân biệt hoa thường
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .ilike('email', cleanEmail);

        if (error) {
            console.error("Supabase login query error:", error);
            return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu: " + error.message }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
        }

        const user = users[0];
        const isMatch = user.password && (bcrypt.compareSync(password, user.password) || user.password === password);
        if (!isMatch) {
            return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
        }

        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            school: user.school || undefined
        };

        return NextResponse.json(safeUser, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Lỗi máy chủ nội bộ" }, { status: 500 });
    }
}
