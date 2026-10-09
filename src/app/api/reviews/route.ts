import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { prisma } from '../../../lib/prisma';

const MAX_COMMENT = 1000;

const fail = (message: string, status: number) =>
    NextResponse.json({ success: false, message }, { status });

// Tên hiển thị ẩn bớt: "Nguyễn Văn An" -> "Nguyễn V. A."
const maskName = (name?: string | null, email?: string | null) => {
    const base = (name || email?.split('@')[0] || 'Nàng thơ').trim();
    const parts = base.split(/\s+/);
    if (parts.length === 1) return parts[0];
    return [parts[0], ...parts.slice(1).map((p) => `${p[0].toUpperCase()}.`)].join(' ');
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        if (!productId) return fail('Thiếu productId', 400);

        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
        const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '5', 10) || 5));

        const session = await auth();
        const userId = session?.user?.id;

        const [rows, grouped, mine] = await Promise.all([
            prisma.review.findMany({
                where: { productId },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: { user: { select: { name: true, email: true } } },
            }),
            prisma.review.groupBy({
                by: ['rating'],
                where: { productId },
                _count: { rating: true },
            }),
            // đánh giá của chính người xem, kể cả khi nó nằm ở trang sau -> form biết là đang "sửa"
            userId ? prisma.review.findUnique({ where: { userId_productId: { userId, productId } } }) : null,
        ]);

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let count = 0;
        let sum = 0;
        for (const g of grouped) {
            distribution[g.rating] = g._count.rating;
            count += g._count.rating;
            sum += g.rating * g._count.rating;
        }

        return NextResponse.json({
            success: true,
            pagination: { page, limit, totalPages: Math.ceil(count / limit), hasNextPage: page * limit < count },
            myReview: mine ? { id: mine.id, rating: mine.rating, comment: mine.comment } : null,
            summary: { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution },
            reviews: rows.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                author: maskName(r.user.name, r.user.email),
                createdAt: r.createdAt,
                mine: r.userId === userId,
            })),
        });
    } catch (error) {
        console.error('❌ [API REVIEWS GET ERROR]:', error);
        return fail('Không tải được đánh giá', 500);
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) return fail('Vui lòng đăng nhập để đánh giá', 401);

        const body = await request.json();
        const productId = typeof body.productId === 'string' ? body.productId : '';
        const rating = Number(body.rating);
        const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

        if (!productId) return fail('Thiếu productId', 400);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Số sao phải từ 1 đến 5', 400);
        if (comment.length < 5) return fail('Nhận xét cần ít nhất 5 ký tự', 400);
        if (comment.length > MAX_COMMENT) return fail(`Nhận xét tối đa ${MAX_COMMENT} ký tự`, 400);

        const review = await prisma.review.upsert({
            where: { userId_productId: { userId, productId } },
            create: { userId, productId, rating, comment },
            update: { rating, comment },
        });

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error('❌ [API REVIEWS POST ERROR]:', error);
        return fail('Không lưu được đánh giá', 500);
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) return fail('Vui lòng đăng nhập', 401);

        const id = new URL(request.url).searchParams.get('id');
        if (!id) return fail('Thiếu id', 400);

        const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';
        const { count } = await prisma.review.deleteMany({
            where: isAdmin ? { id } : { id, userId },
        });
        if (!count) return fail('Không tìm thấy đánh giá của bạn', 404);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ [API REVIEWS DELETE ERROR]:', error);
        return fail('Không xoá được đánh giá', 500);
    }
}
