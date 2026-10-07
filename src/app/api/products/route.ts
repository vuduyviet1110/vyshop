import { NextResponse } from 'next/server';
import { RACK_SETS } from '../../../data';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rackId = searchParams.get('rackId') || 'rack-1';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        const currentRack = RACK_SETS.find(r => r.id === rackId) || RACK_SETS[0];
        const allProducts = currentRack.products;

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = allProducts.slice(startIndex, endIndex);

        return NextResponse.json({
            success: true,
            rackId: currentRack.id,
            title: currentRack.title,
            subtitle: currentRack.subtitle,
            pagination: {
                page,
                limit,
                totalProducts: allProducts.length,
                totalPages: Math.ceil(allProducts.length / limit),
                hasNextPage: endIndex < allProducts.length,
                hasPrevPage: page > 1,
            },
            products: paginatedProducts
        });
    } catch (error) {
        console.error('❌ [API PRODUCTS GET ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tải danh sách sản phẩm' }, { status: 500 });
    }
}
