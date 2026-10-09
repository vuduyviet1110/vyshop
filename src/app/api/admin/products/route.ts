import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Lấy danh sách Racks và Products cho trang Admin
export async function GET() {
    try {
        const [racks, products] = await Promise.all([
            prisma.rack.findMany({ orderBy: { sortOrder: 'asc' } }),
            prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
        ]);

        return NextResponse.json({
            success: true,
            racks,
            products
        });
    } catch (error) {
        console.error('❌ [API ADMIN PRODUCTS GET ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tải danh sách quản lý' }, { status: 500 });
    }
}

// PATCH: Cập nhật rackId cho Sản phẩm (Gắn hoặc Gỡ sản phẩm khỏi Dàn sào / Bộ sưu tập)
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { productId, rackId } = body;

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Thiếu thông tin productId' }, { status: 400 });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { rackId: rackId ? rackId : null }
        });

        return NextResponse.json({
            success: true,
            message: rackId ? `Đã gắn sản phẩm ${updatedProduct.name} vào Dàn sào ${rackId}` : `Đã gỡ sản phẩm ${updatedProduct.name} khỏi Dàn sào`,
            product: updatedProduct
        });
    } catch (error) {
        console.error('❌ [API ADMIN PRODUCTS PATCH ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi cập nhật Dàn sào cho sản phẩm' }, { status: 500 });
    }
}

// PUT: Cập nhật tiêu đề & subtitle cho Dàn sào (Rack)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { rackId, title, subtitle } = body;

        if (!rackId || !title) {
            return NextResponse.json({ success: false, message: 'Thiếu rackId hoặc title' }, { status: 400 });
        }

        const updatedRack = await prisma.rack.update({
            where: { id: rackId },
            data: {
                title: title.trim(),
                subtitle: subtitle ? subtitle.trim() : ''
            }
        });

        return NextResponse.json({
            success: true,
            message: `Cập nhật Dàn sào "${updatedRack.id}" thành công!`,
            rack: updatedRack
        });
    } catch (error) {
        console.error('❌ [API ADMIN RACK PUT ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi cập nhật Dàn sào' }, { status: 500 });
    }
}

// POST: Tạo Dàn sào (Bộ sưu tập) mới
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, title, subtitle, sortOrder } = body;

        if (!id || !title) {
            return NextResponse.json({ success: false, message: 'Thiếu id hoặc title dàn sào' }, { status: 400 });
        }

        const newRack = await prisma.rack.create({
            data: {
                id: id.trim().toLowerCase().replace(/\s+/g, '-'),
                title: title.trim(),
                subtitle: subtitle ? subtitle.trim() : 'BST Mới',
                sortOrder: sortOrder || 0
            }
        });

        return NextResponse.json({
            success: true,
            message: `Tạo Dàn sào "${newRack.title}" thành công!`,
            rack: newRack
        });
    } catch (error) {
        console.error('❌ [API ADMIN RACK POST ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi tạo Dàn sào mới hoặc ID đã tồn tại' }, { status: 500 });
    }
}

// DELETE: Xóa Dàn sào
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rackId = searchParams.get('rackId');

        if (!rackId) {
            return NextResponse.json({ success: false, message: 'Thiếu rackId' }, { status: 400 });
        }

        await prisma.rack.delete({
            where: { id: rackId }
        });

        return NextResponse.json({
            success: true,
            message: `Đã xóa Dàn sào ${rackId}`
        });
    } catch (error) {
        console.error('❌ [API ADMIN RACK DELETE ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi xóa Dàn sào' }, { status: 500 });
    }
}

