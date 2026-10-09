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

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            return NextResponse.json({ error: "Email này đã được đăng ký" }, { status: 400 });
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
                name,
                email,
                password: hashedPassword,
                role,
                school: school || null
            });

        if (error) {
            throw new Error(error.message);
        }

        const newUser = {
            id: userId,
            name,
            email,
            role,
            school: school || undefined
        };

        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Lỗi máy chủ nội bộ" }, { status: 500 });
    }
}
