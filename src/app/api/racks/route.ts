import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/racks -> danh sách dàn sào (theo thứ tự hiển thị) kèm số sản phẩm
export async function GET() {
    try {
        const racks = await prisma.rack.findMany({
            orderBy: { sortOrder: 'asc' },
            select: { id: true, title: true, subtitle: true, _count: { select: { products: true } } },
        });

        return NextResponse.json({
            success: true,
            racks: racks.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle, productCount: r._count.products })),
        });
    } catch (error) {
        console.error('❌ [API RACKS GET ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tải danh sách dàn sào' }, { status: 500 });
    }
}
