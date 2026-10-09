import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// API Endpoint: GET /api/orders -> Lấy danh sách toàn bộ đơn hàng & Thống kê từ Database (Supabase/Neon)
export async function GET() {
    try {
        // Nếu đã cấu hình DATABASE_URL -> Lấy từ / Neon PostgreSQL qua Prisma
        {
            const dbOrders = await prisma.order.findMany({
                include: { items: true },
                orderBy: { createdAt: 'desc' }
            });

            const totalRevenue = dbOrders
                .filter(o => o.status === 'DA_THANH_TOAN' || o.status === 'HOAN_THANH')
                .reduce((sum, o) => sum + o.totalPrice, 0);

            const pendingOrders = dbOrders.filter(o => o.status === 'CHO_THANH_TOAN').length;
            const paidOrders = dbOrders.filter(o => o.status === 'DA_THANH_TOAN').length;

            const formattedOrders = dbOrders.map(o => ({
                id: o.orderCode,
                customerName: o.customerName,
                phone: o.phone,
                address: o.address,
                note: o.note,
                totalPrice: o.totalPrice,
                paymentMethod: o.paymentMethod,
                status: o.status,
                createdAt: o.createdAt.toISOString(),
                paidAt: o.paidAt?.toISOString(),
                items: o.items.map(item => ({
                    id: item.id,
                    productName: item.productName,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                }))
            }));

            return NextResponse.json({
                success: true,
                                stats: {
                    totalRevenue,
                    pendingOrders,
                    paidOrders,
                    totalOrders: dbOrders.length
                },
                orders: formattedOrders
            });
        }
    } catch (error) {
        console.error('❌ [API ORDERS GET ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tải đơn hàng', details: String(error) }, { status: 500 });
    }
}

// API Endpoint: POST /api/orders -> Tạo đơn hàng mới lưu vào PostgreSQL
export async function POST(request: Request) {
    try {
        const newOrderData = await request.json();
        const orderCode = `VYYY-${Math.floor(100000 + Math.random() * 900000)}`;

        const rawItems: { productId?: string; size: string; color: string; quantity: number }[] =
            Array.isArray(newOrderData.items) ? newOrderData.items : [];
        if (rawItems.length === 0) {
            return NextResponse.json({ success: false, message: 'Giỏ hàng trống' }, { status: 400 });
        }
        if (rawItems.some((i) => !i.productId || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99)) {
            return NextResponse.json({ success: false, message: 'Dữ liệu giỏ hàng không hợp lệ' }, { status: 400 });
        }

        // Giá, tên, ảnh luôn lấy từ database: không tin số tiền do trình duyệt gửi lên
        const products = await prisma.product.findMany({
            where: { id: { in: rawItems.map((i) => i.productId as string) } },
        });
        const byId = new Map(products.map((p) => [p.id, p]));
        const missing = rawItems.find((i) => !byId.has(i.productId as string));
        if (missing) {
            return NextResponse.json({ success: false, message: 'Có sản phẩm trong giỏ không còn bán, vui lòng tải lại trang' }, { status: 409 });
        }

        const items = rawItems.map((i) => {
            const p = byId.get(i.productId as string)!;
            return { productName: p.name, size: i.size, color: i.color, quantity: i.quantity, price: p.price, image: p.image };
        });
        const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const createdDbOrder = await prisma.order.create({
            data: {
                orderCode,
                customerName: newOrderData.customerName,
                phone: newOrderData.phone,
                address: newOrderData.address,
                note: newOrderData.note || '',
                totalPrice,
                paymentMethod: newOrderData.paymentMethod,
                status: newOrderData.status || 'CHO_THANH_TOAN',
                items: { create: items },
            },
            include: { items: true },
        });

        return NextResponse.json({
            success: true,
            order: { ...createdDbOrder, id: createdDbOrder.orderCode },
        });
    } catch (error) {
        console.error('❌ [API ORDERS POST ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tạo đơn hàng' }, { status: 500 });
    }
}

// API Endpoint: PATCH /api/orders -> Cập nhật trạng thái đơn hàng
export async function PATCH(request: Request) {
    try {
        const { orderId, status } = await request.json();

        {
            const updatedOrder = await prisma.order.update({
                where: { orderCode: orderId },
                data: {
                    status,
                    paidAt: status === 'DA_THANH_TOAN' ? new Date() : undefined
                }
            });
            return NextResponse.json({ success: true, source: 'POSTGRESQL_PRISMA', order: updatedOrder });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Lỗi cập nhật đơn hàng' }, { status: 500 });
    }
}
