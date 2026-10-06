import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// API Endpoint: GET /api/orders -> Lấy danh sách toàn bộ đơn hàng & Thống kê từ Database (Supabase/Neon)
export async function GET() {
    try {
        // Nếu đã cấu hình DATABASE_URL -> Lấy từ Supabase / Neon PostgreSQL qua Prisma
        if (process.env.DATABASE_URL) {
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
                source: 'POSTGRESQL_PRISMA',
                stats: {
                    totalRevenue,
                    pendingOrders,
                    paidOrders,
                    totalOrders: dbOrders.length
                },
                orders: formattedOrders
            });
        }

        // Fallback: Sử dụng dữ liệu tạm thời nếu chưa điền DATABASE_URL vào .env.local
        const mockOrders = globalThis.__VYYY_ORDERS_LIST__ || [];
        const totalRevenue = mockOrders
            .filter(o => o.status === 'DA_THANH_TOAN' || o.status === 'HOAN_THANH')
            .reduce((sum, o) => sum + o.totalPrice, 0);

        return NextResponse.json({
            success: true,
            source: 'IN_MEMORY_FALLBACK',
            stats: {
                totalRevenue,
                pendingOrders: mockOrders.filter(o => o.status === 'CHO_THANH_TOAN').length,
                paidOrders: mockOrders.filter(o => o.status === 'DA_THANH_TOAN').length,
                totalOrders: mockOrders.length
            },
            orders: mockOrders
        });

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

        if (process.env.DATABASE_URL) {
            const createdDbOrder = await prisma.order.create({
                data: {
                    orderCode,
                    customerName: newOrderData.customerName,
                    phone: newOrderData.phone,
                    address: newOrderData.address,
                    note: newOrderData.note || '',
                    totalPrice: newOrderData.totalPrice,
                    paymentMethod: newOrderData.paymentMethod,
                    status: newOrderData.status || 'CHO_THANH_TOAN',
                    items: {
                        create: newOrderData.items.map((item: any) => ({
                            productName: item.productName,
                            size: item.size,
                            color: item.color,
                            quantity: item.quantity,
                            price: item.price,
                            image: item.image
                        }))
                    }
                },
                include: { items: true }
            });

            return NextResponse.json({
                success: true,
                source: 'POSTGRESQL_PRISMA',
                order: {
                    ...createdDbOrder,
                    id: createdDbOrder.orderCode
                }
            });
        }

        // Fallback in-memory
        const newOrder = {
            id: orderCode,
            ...newOrderData,
            status: newOrderData.status || 'CHO_THANH_TOAN',
            createdAt: new Date().toISOString()
        };

        if (!globalThis.__VYYY_ORDERS_LIST__) globalThis.__VYYY_ORDERS_LIST__ = [];
        globalThis.__VYYY_ORDERS_LIST__.unshift(newOrder);

        if (!globalThis.__VYYY_ORDERS__) globalThis.__VYYY_ORDERS__ = {};
        globalThis.__VYYY_ORDERS__[newOrder.phone] = newOrder;
        globalThis.__VYYY_ORDERS__[orderCode] = newOrder;

        return NextResponse.json({ success: true, source: 'IN_MEMORY_FALLBACK', order: newOrder });

    } catch (error) {
        console.error('❌ [API ORDERS POST ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tạo đơn hàng' }, { status: 500 });
    }
}

// API Endpoint: PATCH /api/orders -> Cập nhật trạng thái đơn hàng
export async function PATCH(request: Request) {
    try {
        const { orderId, status } = await request.json();

        if (process.env.DATABASE_URL) {
            const updatedOrder = await prisma.order.update({
                where: { orderCode: orderId },
                data: {
                    status,
                    paidAt: status === 'DA_THANH_TOAN' ? new Date() : undefined
                }
            });
            return NextResponse.json({ success: true, source: 'POSTGRESQL_PRISMA', order: updatedOrder });
        }

        // Fallback in-memory
        const mockOrders = globalThis.__VYYY_ORDERS_LIST__ || [];
        const targetOrder = mockOrders.find(o => o.id === orderId);
        if (targetOrder) {
            targetOrder.status = status;
            if (status === 'DA_THANH_TOAN') targetOrder.paidAt = new Date().toISOString();
            return NextResponse.json({ success: true, source: 'IN_MEMORY_FALLBACK', order: targetOrder });
        }

        return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Lỗi cập nhật đơn hàng' }, { status: 500 });
    }
}
