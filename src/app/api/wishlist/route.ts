import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { prisma } from '../../../lib/prisma';

const unauthorized = () =>
    NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để dùng danh sách yêu thích' }, { status: 401 });

export async function GET() {
    try {
        const userId = (await auth())?.user?.id;
        if (!userId) return unauthorized();

        const dbWishlist = await prisma.wishlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({
            success: true,
            wishlist: dbWishlist.map(w => ({
                id: w.productId,
                name: w.productName,
                price: w.price,
                image: w.image,
                category: w.category
            }))
        });
    } catch (error) {
        console.error('❌ [API WISHLIST GET ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tải wishlist' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = (await auth())?.user?.id;
        if (!userId) return unauthorized();

        const item = await request.json();
        const data = {
            productName: item.name,
            price: String(item.price),
            image: item.image,
            category: item.category || 'Áo Dài Premium'
        };

        const created = await prisma.wishlist.upsert({
            where: { userId_productId: { userId, productId: item.id } },
            create: { userId, productId: item.id, ...data },
            update: data
        });
        return NextResponse.json({ success: true, item: created });
    } catch (error) {
        console.error('❌ [API WISHLIST POST ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi lưu wishlist' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = (await auth())?.user?.id;
        if (!userId) return unauthorized();

        const productId = new URL(request.url).searchParams.get('id');
        if (!productId) {
            return NextResponse.json({ success: false, message: 'Thiếu product ID' }, { status: 400 });
        }

        await prisma.wishlist.deleteMany({ where: { userId, productId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ [API WISHLIST DELETE ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi xóa wishlist' }, { status: 500 });
    }
}
