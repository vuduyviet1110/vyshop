import { NextResponse } from 'next/server';
import { listRacks } from '../../../lib/storeData';

// GET /api/racks -> danh sách dàn sào (theo thứ tự hiển thị) kèm số sản phẩm
export async function GET() {
    try {
        const racks = await listRacks();
        return NextResponse.json({ success: true, racks }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
    } catch (error) {
        console.error('❌ [API RACKS GET ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tải danh sách dàn sào' }, { status: 500 });
    }
}
