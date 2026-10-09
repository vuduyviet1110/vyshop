import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { POLICY_TEXT } from '@/lib/policies';
import { normalizeRole, hasPermission, AppPermission } from '@/lib/roles';
import { formatVND } from '@/lib/format';

const groqApiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey: groqApiKey });
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const CANDIDATE_MODELS = Array.from(new Set([DEFAULT_MODEL, 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']));

const ORDER_KEYWORDS = [
    'đơn hàng', 'đơn', 'mua hàng', 'giao hàng', 'vận chuyển',
    'thanh toán', 'hủy đơn', 'hủy', 'hoàn tiền', 'trả hàng',
    'trạng thái', 'theo dõi', 'mã đơn', 'ship', 'nhận hàng',
    'địa chỉ giao', 'phí ship', 'phí vận chuyển', 'sản phẩm',
    'đơn của tôi', 'lịch sử mua', 'kiện hàng', 'áo dài', 'size',
    'khách hàng', 'thống kê', 'doanh thu', 'báo cáo', 'tổng quan',
    'chính sách', 'bảo hành', 'khuyến mãi', 'mã giảm giá', 'voucher',
    'tồn kho', 'kho hàng', 'nhà cung cấp', 'order', 'status', 'shipping'
];

function isOrderRelated(message: string): boolean {
    const lower = message.toLowerCase();
    return ORDER_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const body = await req.json();
        const { message } = body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ message: 'Tin nhắn không được để trống.' }, { status: 400 });
        }

        const trimmedMessage = message.trim().slice(0, 500);

        const user = session?.user;

        // Rate Limit cho khách chưa đăng nhập (GUEST RATE LIMIT: Tối đa 3 câu hỏi)
        if (!user) {
            const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'guest_unknown';
            const guestCountCookie = req.cookies.get('vyyy_ai_guest_count')?.value;
            const currentCount = guestCountCookie ? parseInt(guestCountCookie, 10) : 0;

            if (currentCount >= 3) {
                return NextResponse.json({
                    reply: '**Nàng chưa đăng nhập!** Để tiếp tục, Nàng vui lòng [Đăng nhập](/auth/login) tài khoản Vyyy Boutique nhé ạ! ',
                    limitReached: true,
                }, { status: 429 });
            }
        }

        const rawRole = (user as { role?: string })?.role || 'USER';
        const role = normalizeRole(rawRole);
        const isAdminUser = rawRole === 'ADMIN' || role === 'admin';
        const isOrderManager = role === 'order_manager';
        const isStaff = role === 'staff' || role === 'employee';
        const isSystemUser = isAdminUser || isOrderManager || isStaff;

        // Intent filter cho khách hàng (non-system users)
        if (!isSystemUser && !isOrderRelated(trimmedMessage)) {
            return NextResponse.json({
                reply: 'Xin lỗi, tôi là trợ lý AI Vyyy Boutique. Tôi chỉ hỗ trợ các câu hỏi liên quan đến đơn hàng, sản phẩm, size áo và chính sách cửa hàng. Bạn cần hỗ trợ gì ạ? 😊',
                outOfScope: true,
            }, { status: 200 });
        }

        const currentUserInfo = {
            name: user?.name || user?.email || 'Khách hàng',
            email: user?.email || 'N/A',
        };

        // Truy vấn dữ liệu thực tế từ Database (Prisma) song song (Promise.all) để tối ưu thời gian phản hồi
        let orderDataText = '[KHÔNG CÓ DỮ LIỆU ĐƠN HÀNG]';
        let analyticsDataText = '';
        let extraContextText = '';

        try {
            if (isSystemUser) {
                const [orders, totalOrders, revenueAgg, totalProducts, totalUsersCount, recentUsers] = await Promise.all([
                    prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { items: true } }),
                    (isAdminUser || isOrderManager) ? prisma.order.count() : Promise.resolve(0),
                    (isAdminUser || isOrderManager) ? prisma.order.aggregate({ _sum: { totalPrice: true } }) : Promise.resolve({ _sum: { totalPrice: null } }),
                    (isAdminUser || isOrderManager) ? prisma.product.count() : Promise.resolve(0),
                    isAdminUser ? prisma.user.count() : Promise.resolve(0),
                    isAdminUser ? prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { name: true, email: true, role: true } }) : Promise.resolve([]),
                ]);

                if (orders.length > 0) {
                    orderDataText = orders.map((o) => {
                        const items = o.items.slice(0, 3).map(i => `    • ${i.productName} (x${i.quantity}) - ${i.size}/${i.color} (${formatVND(i.price)})`).join('\n');
                        return `• ĐƠN #${o.orderCode} (Khách: ${o.customerName} - ${o.phone}): Status ${o.status} | Tổng ${formatVND(o.totalPrice)} | PTTT: ${o.paymentMethod}\n  Sản phẩm:\n${items}`;
                    }).join('\n');
                }

                if (isAdminUser || isOrderManager) {
                    const totalRevenue = revenueAgg._sum.totalPrice || 0;
                    analyticsDataText = `=== THỐNG KÊ DOANH THU & SỐ LIỆU ===
- Tổng đơn hàng hệ thống: ${totalOrders}
- Tổng doanh thu: ${formatVND(totalRevenue)}
- Tổng số sản phẩm trong Catalogue: ${totalProducts}
=== HẾT THỐNG KÊ ===`;
                }

                if (isAdminUser && recentUsers.length > 0) {
                    const userList = recentUsers.map((u, i) => `  ${i + 1}. ${u.name || 'Ẩn danh'} (${u.email}) - Role: ${u.role}`).join('\n');
                    extraContextText = `=== SỐ LIỆU NHÂN SỰ & TÀI KHOẢN ===
- Tổng số tài khoản đăng ký: ${totalUsersCount}
- Người dùng gần đây:\n${userList}
=== HẾT NHÂN SỰ ===`;
                }
            } else {
                if (user?.name || user?.email) {
                    const orders = await prisma.order.findMany({
                        where: { OR: [{ customerName: { contains: user.name || '', mode: 'insensitive' } }] },
                        take: 3,
                        orderBy: { createdAt: 'desc' },
                        include: { items: true },
                    });
                    if (orders.length > 0) {
                        orderDataText = orders.map((o) => `• ĐƠN #${o.orderCode}: Trạng thái ${o.status} | Tổng ${formatVND(o.totalPrice)}`).join('\n');
                    }
                }
            }
        } catch (dbErr) {
            console.error('Lỗi đọc dữ liệu DB cho AI:', dbErr);
        }

        // Role description
        let roleDescription = '';
        if (isAdminUser) {
            roleDescription = `VAI TRÒ: Quản trị viên (Admin) — Có toàn quyền truy cập tất cả tài nguyên hệ thống gồm doanh thu, nhân sự, đơn hàng và sản phẩm Vyyy Boutique.`;
        } else if (isOrderManager) {
            roleDescription = `VAI TRÒ: Quản lý đơn hàng (Order Manager) — Được xem doanh thu, đơn hàng và danh mục sản phẩm.`;
        } else if (isStaff) {
            roleDescription = `VAI TRÒ: Nhân viên CSKH/Bán hàng (Staff) — Được xem danh sách đơn hàng để xử lý và tư vấn sản phẩm.`;
        } else {
            roleDescription = `VAI TRÒ: Khách hàng (Nàng Thơ) — Chỉ xem được thông tin đơn hàng cá nhân, tư vấn chọn size/phối đồ và chính sách cửa hàng.`;
        }

        const systemPrompt = `Bạn là trợ lý AI chuyên nghiệp của thương hiệu thời trang cao cấp Vyyy Boutique (Nàng Thơ).

${roleDescription}
Người dùng hiện tại: ${currentUserInfo.name} (${currentUserInfo.email}) [Role: ${role}]

QUY TẮC BẢO MẬT & PHÂN QUYỀN PHẠM VI:
1. GIỚI HẠN PHẠM VI HỖ TRỢ:
   - Bạn CHỈ ĐƯỢC PHÉP TRẢ LỜI các chủ đề liên quan đến Vyyy Boutique: Thời trang, Áo dài, Suit & Trench Coat, Đơn hàng, Chọn Size, Phối đồ, Chính sách giao hàng/đổi trả/hoàn tiền, Quản trị doanh thu và vận hành cửa hàng.
   - TUYỆT ĐỐI TỪ CHỐI trả lời câu hỏi ngoài lề (thời tiết, giải toán, viết văn ngoài lề, kiến thức chung ngoài e-commerce...). Nếu gặp câu hỏi ngoài lề, hãy trả lời ngắn gọn lịch sự: "Xin lỗi Nàng, em là trợ lý AI chuyên biệt cho Vyyy Boutique. Em chỉ có thể hỗ trợ các thông tin về thời trang, chọn size, đơn hàng và chính sách của cửa hàng thôi ạ! 😊"
2. Dữ liệu bên dưới là DỮ LIỆU THỰC TẾ từ Database được lọc theo quyền hạn của tài khoản.
3. Nếu người dùng hỏi thông tin mà họ không có quyền xem (ví dụ khách hỏi doanh thu cửa hàng, nhân viên khác), hãy giải thích lịch sự về giới hạn phân quyền vai trò [${role}] của họ.
4. Trả lời bằng tiếng Việt xưng hô ngọt ngào, tinh tế ("Nàng", "Dạ em...", "Vyyy Boutique"), rõ ràng, súc tích. Sử dụng định dạng Markdown (gạch đầu dòng, in đậm) để giao diện dễ nhìn.

${POLICY_TEXT}

=== NGỮ CẢNH DỮ LIỆU THỰC TẾ ===
${orderDataText}
=== HẾT DỮ LIỆU ===
${analyticsDataText ? `\n${analyticsDataText}\n` : ''}
${extraContextText ? `\n${extraContextText}\n` : ''}`;

        // Payload cho Groq
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: trimmedMessage },
        ];

        let completion: any = null;
        let lastErr: any = null;

        if (!groqApiKey) {
            return NextResponse.json({
                reply: 'Chức năng AI Chat chưa được cấu hình API Key (GROQ_API_KEY). Nàng/Quản trị viên vui lòng thêm GROQ_API_KEY vào tệp môi trường .env nhé!',
            }, { status: 200 });
        }

        for (const modelCandidate of CANDIDATE_MODELS) {
            try {
                completion = await groq.chat.completions.create({
                    model: modelCandidate,
                    messages,
                    max_tokens: 350,
                    temperature: 0.3,
                    stream: true,
                });
                break;
            } catch (err) {
                lastErr = err;
                console.warn(`Groq model ${modelCandidate} failed:`, err);
            }
        }

        if (!completion) {
            return NextResponse.json({
                reply: 'Hệ thống AI hiện đang bận hoặc quá tải. Nàng vui lòng thử lại sau giây lát nhé!',
            }, { status: 500 });
        }

        // Tạo response stream SSE
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion) {
                        const token = chunk.choices[0]?.delta?.content || '';
                        if (token) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        const resHeaders: Record<string, string> = {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        };

        if (!user) {
            const guestCountCookie = req.cookies.get('vyyy_ai_guest_count')?.value;
            const newCount = (guestCountCookie ? parseInt(guestCountCookie, 10) : 0) + 1;
            resHeaders['Set-Cookie'] = `vyyy_ai_guest_count=${newCount}; Path=/; Max-Age=86400; SameSite=Lax`;
        }

        return new Response(stream, {
            headers: resHeaders,
        });
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({ message: error.message || 'Lỗi server AI Chat' }, { status: 500 });
    }
}
