import { NextResponse } from 'next/server';

export async function DELETE() {
    return NextResponse.json({ message: 'Đã làm sạch lịch sử trò chuyện AI thành công!' });
}
