import { NextResponse } from 'next/server';
import { BANK_CONFIG } from '../../../../config/bankConfig';

// Định dạng dữ liệu chuẩn SePay gửi về Webhook
export interface SepayWebhookPayload {
    id: number;
    gateway: string;
    transactionDate: string;
    accountNumber: string;
    subAccount: string | null;
    transferAmount: number;
    transferType: 'in' | 'out';
    content: string;
    code: string | null;
    description: string;
    referenceCode: string;
    accumulated: number;
}

// Global in-memory order store (dùng làm cơ sở dữ liệu tạm thời trước khi kết nối DB chính)
declare global {
    var __VYYY_ORDERS__: Record<string, any> | undefined;
}

if (!globalThis.__VYYY_ORDERS__) {
    globalThis.__VYYY_ORDERS__ = {};
}

// API Endpoint: POST /api/webhook/sepay
export async function POST(request: Request) {
    try {
        // 1. Kiểm tra API Key bảo mật (nếu có cấu hình trong SePay Webhook Header API Key)
        const apiKey = request.headers.get('Authorization') || request.headers.get('x-api-key');
        const expectedSecret = process.env.SEPAY_WEBHOOK_SECRET;

        if (expectedSecret && apiKey !== `Apikey ${expectedSecret}` && apiKey !== expectedSecret) {
            console.warn('⚠️ [SEPAY WEBHOOK]: Từ chối kết nối do sai API Key bảo mật.');
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload: SepayWebhookPayload = await request.json();
        console.log('📬 [SEPAY WEBHOOK RECIEVED]:', JSON.stringify(payload, null, 2));

        const { accountNumber, transferAmount, content, transferType } = payload;

        // Kiểm tra đúng số tài khoản shop Vyyy Boutique
        if (accountNumber && accountNumber !== BANK_CONFIG.accountNumber) {
            return NextResponse.json({ success: true, message: 'Bỏ qua giao dịch không đúng tài khoản shop' });
        }

        // Chỉ xử lý giao dịch tiền vào (transferType === 'in')
        if (transferType !== 'in') {
            return NextResponse.json({ success: true, message: 'Bỏ qua giao dịch tiền ra' });
        }

        // 2. Trích xuất thông tin Mã Đơn Hàng hoặc Số Điện Thoại từ nội dung chuyển khoản
        // Ví dụ nội dung: "VYYY BOUTIQUE 0988123456" hoặc "VYYY 123456"
        const phoneMatch = content.match(/0\d{9}/);
        const orderIdMatch = content.match(/VYYY-\d{6}/i);

        const matchedKey = orderIdMatch ? orderIdMatch[0].toUpperCase() : (phoneMatch ? phoneMatch[0] : null);

        console.log(`🔎 [SEPAY MATCHING]: Tìm thấy từ khóa khớp đơn hàng: "${matchedKey}" | Số tiền: ${transferAmount?.toLocaleString('vi-VN')} VNĐ`);

        // 3. Tự động chuyển trạng thái đơn hàng sang ĐÃ THANH TOÁN
        if (matchedKey && globalThis.__VYYY_ORDERS__[matchedKey]) {
            globalThis.__VYYY_ORDERS__[matchedKey].status = 'ĐÃ THANH TOÁN (VIETQR AUTOMATIC)';
            globalThis.__VYYY_ORDERS__[matchedKey].paidAmount = transferAmount;
            globalThis.__VYYY_ORDERS__[matchedKey].paidAt = new Date().toISOString();

            console.log(`✅ [SEPAY AUTOMATION SUCCESS]: Đơn hàng ${matchedKey} đã tự động cập nhật trạng thái THANH TOÁN THÀNH CÔNG!`);
        }

        // Trả về response HTTP 200 cho SePay để xác nhận đã nhận được Webhook
        return NextResponse.json({
            success: true,
            message: 'Xử lý SePay Webhook thành công',
            matchedKey,
            receivedAmount: transferAmount
        }, { status: 200 });

    } catch (error) {
        console.error('❌ [SEPAY WEBHOOK ERROR]:', error);
        return NextResponse.json({ success: false, message: 'Lỗi server xử lý Webhook' }, { status: 500 });
    }
}

// API Endpoint: GET /api/webhook/sepay (Dùng để kiểm tra nhanh Webhook đang sống)
export async function GET() {
    return NextResponse.json({
        status: 'ONLINE',
        service: 'Vyyy Boutique SePay Webhook Listener',
        targetAccount: '1230016022004 (MBBank - DOAN HA VY)',
        timestamp: new Date().toISOString()
    });
}
