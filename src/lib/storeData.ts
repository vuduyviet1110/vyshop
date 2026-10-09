import { prisma } from './prisma';

// Gắn điểm trung bình + số đánh giá cho từng sản phẩm. Lỗi (vd. bảng Review chưa tạo) thì bỏ qua, danh sách vẫn trả bình thường.
export async function withRatings<T extends { id: string }>(products: T[]) {
    if (products.length === 0) return products;
    try {
        const stats = await prisma.review.groupBy({
            by: ['productId'],
            where: { productId: { in: products.map((p) => p.id) } },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const byId = new Map(stats.map((r) => [r.productId, r]));
        return products.map((p) => {
            const r = byId.get(p.id);
            return {
                ...p,
                ratingAvg: r?._avg.rating ? Math.round(r._avg.rating * 10) / 10 : 0,
                ratingCount: r?._count.rating ?? 0,
            };
        });
    } catch (error) {
        console.error('⚠️ [STORE DATA] Không lấy được rating:', error);
        return products;
    }
}

// Danh sách dàn sào (theo thứ tự hiển thị) kèm số sản phẩm
export async function listRacks() {
    const racks = await prisma.rack.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, subtitle: true, _count: { select: { products: true } } },
    });
    return racks.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle, productCount: r._count.products }));
}

// Một trang sản phẩm của dàn sào (không tìm thấy rackId thì lấy dàn đầu tiên). null nếu chưa có dàn nào.
export async function getRackPage(rackId: string, page: number, limit: number) {
    const currentRack = (await prisma.rack.findUnique({ where: { id: rackId } })) || (await prisma.rack.findFirst());
    if (!currentRack) return null;

    const skip = (page - 1) * limit;
    const [totalProducts, products] = await Promise.all([
        prisma.product.count({ where: { rackId: currentRack.id } }),
        prisma.product.findMany({ where: { rackId: currentRack.id }, orderBy: { sortOrder: 'asc' }, skip, take: limit }),
    ]);
    const totalPages = Math.ceil(totalProducts / limit);

    return {
        success: true,
        rackId: currentRack.id,
        title: currentRack.title,
        subtitle: currentRack.subtitle,
        pagination: { page, limit, totalProducts, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
        products: await withRatings(products),
    };
}
