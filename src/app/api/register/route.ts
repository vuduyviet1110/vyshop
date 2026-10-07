import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Vui lòng điền đầy đủ Email và Mật khẩu!' },
                { status: 400 }
            );
        }

        const cleanEmail = sanitizeInput(String(email)).toLowerCase();
        const cleanName = sanitizeInput(String(name || 'Nàng Thơ Vyyy'));

        // Kiểm tra độ dài mật khẩu tối thiểu (Chống Brute Force yếu)
        if (String(password).length < 6) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có tối thiểu 6 ký tự!' },
                { status: 400 }
            );
        }

        // Kiểm tra xem Email đã tồn tại chưa
        const existingUser = await prisma.user.findUnique({
            where: { email: cleanEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email này đã được đăng ký tài khoản trước đó!' },
                { status: 400 }
            );
        }

        // Mã hóa mật khẩu bằng Bcrypt với Salt 10
        const hashedPassword = await bcrypt.hash(String(password), 10);

        // Tạo tài khoản người dùng mới
        const user = await prisma.user.create({
            data: {
                name: cleanName,
                email: cleanEmail,
                password: hashedPassword,
                role: 'USER',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(
            { success: true, message: 'Đăng ký tài khoản thành công!', user },
            { status: 201 }
        );
    } catch (error) {
        console.error('Lỗi API Register:', error);
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi máy chủ trong quá trình đăng ký!' },
            { status: 500 }
        );
    }
}
