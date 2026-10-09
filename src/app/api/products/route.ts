import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getRackPage, withRatings } from '../../../lib/storeData';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // Tra cứu theo danh sách id (giỏ hàng cũ trong trình duyệt cần cập nhật lại giá/tên mới nhất)
        const ids = searchParams.get('ids');
        if (ids) {
            const idList = ids.split(',').map((i) => i.trim()).filter(Boolean).slice(0, 100);
            const found = await prisma.product.findMany({ where: { id: { in: idList } } });
            return NextResponse.json({ success: true, products: found });
        }

        const rackId = searchParams.get('rackId') || 'rack-1';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '24', 10);

        // Nếu rackId === 'all' hoặc 'ALL': Lấy TOÀN BỘ sản phẩm cho giao diện Catalog
        if (rackId.toLowerCase() === 'all') {
            const skip = (page - 1) * limit;
            const [totalProducts, products] = await Promise.all([
                prisma.product.count(),
                prisma.product.findMany({
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                })
            ]);
            const totalPages = Math.ceil(totalProducts / limit);
            return NextResponse.json({
                success: true,
                rackId: 'all',
                title: 'Tất Cả Sản Phẩm Vyyy Boutique',
                subtitle: 'Toàn bộ BST Áo Dài & Trang Phục Cao Cấp',
                pagination: {
                    page,
                    limit,
                    totalProducts,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
                products: await withRatings(products)
            }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
        }

        const result = await getRackPage(rackId, page, limit);
        if (!result) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy Dàn sào' }, { status: 404 });
        }
        return NextResponse.json(result, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
    } catch (error) {
        console.error('❌ [API PRODUCTS GET ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tải danh sách sản phẩm từ Database' }, { status: 500 });
    }
}

