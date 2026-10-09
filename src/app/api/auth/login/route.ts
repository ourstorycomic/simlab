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

        // Fetch user from Supabase (since we created our own users table, not Supabase Auth yet)
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
        }

        // Verify password
        const isMatch = bcrypt.compareSync(password, user.password);
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
