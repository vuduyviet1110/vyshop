import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { prisma } from '../../../lib/prisma';

// Memory fallback for wishlist if DB error or no session
let memoryWishlist: any[] = [];

export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (userId && process.env.DATABASE_URL) {
            const dbWishlist = await prisma.wishlist.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            return NextResponse.json({
                success: true,
                source: 'POSTGRESQL_PRISMA',
                wishlist: dbWishlist.map(w => ({
                    id: w.productId,
                    name: w.productName,
                    price: w.price,
                    image: w.image,
                    category: w.category
                }))
            });
        }

        return NextResponse.json({
            success: true,
            source: 'MEMORY_FALLBACK',
            wishlist: memoryWishlist
        });
    } catch (error) {
        console.error('❌ [API WISHLIST GET ERROR]:', error);
        return NextResponse.json({ success: true, wishlist: memoryWishlist });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const item = await request.json();

        if (userId && process.env.DATABASE_URL) {
            const created = await prisma.wishlist.upsert({
                where: {
                    userId_productId: {
                        userId,
                        productId: item.id
                    }
                },
                create: {
                    userId,
                    productId: item.id,
                    productName: item.name,
                    price: String(item.price),
                    image: item.image,
                    category: item.category || 'Áo Dài Premium'
                },
                update: {
                    productName: item.name,
                    price: String(item.price),
                    image: item.image,
                    category: item.category || 'Áo Dài Premium'
                }
            });

            return NextResponse.json({ success: true, source: 'POSTGRESQL_PRISMA', item: created });
        }

        const isExist = memoryWishlist.some(w => w.id === item.id);
        if (!isExist) {
            memoryWishlist.unshift(item);
        }
        return NextResponse.json({ success: true, source: 'MEMORY_FALLBACK', item });
    } catch (error) {
        console.error('❌ [API WISHLIST POST ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi lưu wishlist' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Thiếu product ID' }, { status: 400 });
        }

        if (userId && process.env.DATABASE_URL) {
            await prisma.wishlist.deleteMany({
                where: {
                    userId,
                    productId
                }
            });
            return NextResponse.json({ success: true, source: 'POSTGRESQL_PRISMA' });
        }

        memoryWishlist = memoryWishlist.filter(w => w.id !== productId);
        return NextResponse.json({ success: true, source: 'MEMORY_FALLBACK' });
    } catch (error) {
        console.error('❌ [API WISHLIST DELETE ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi xóa wishlist' }, { status: 500 });
    }
}
