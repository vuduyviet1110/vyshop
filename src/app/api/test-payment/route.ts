import { NextResponse } from 'next/server';
import { BANK_CONFIG } from '../../../config/bankConfig';

// Endpoint test giả lập thanh toán: POST /api/test-payment
export async function POST(request: Request) {
    try {
        const { phone, amount, orderId } = await request.json();

        const testPayload = {
            id: Math.floor(100000 + Math.random() * 900000),
            gateway: 'MBBank',
            transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
            accountNumber: BANK_CONFIG.accountNumber,
            subAccount: null,
            transferAmount: amount || 1850000,
            transferType: 'in',
            content: `VYYY BOUTIQUE ${phone || '0988123456'} ${orderId || ''}`,
            code: null,
            description: 'GIAO DICH GIA LAP TEST SEPAY WEBHOOK',
            referenceCode: 'TEST-' + Date.now(),
            accumulated: 10000000
        };

        console.log('🧪 [MÔ TRƯỜNG TEST] Giả lập SePay gửi Webhook:', testPayload);

        // Tự động gọi thẳng sang Webhook Route Handler nội bộ
        const origin = new URL(request.url).origin;
        const webhookRes = await fetch(`${origin}/api/webhook/sepay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.SEPAY_WEBHOOK_SECRET ? `Apikey ${process.env.SEPAY_WEBHOOK_SECRET}` : ''
            },
            body: JSON.stringify(testPayload)
        });

        const result = await webhookRes.json();

        return NextResponse.json({
            environment: 'SANDBOX / TEST MODE',
            status: 'TEST_TRIGGERED_SUCCESSFULLY',
            simulatedPayload: testPayload,
            webhookResponse: result
        });

    } catch (error) {
        return NextResponse.json({ error: 'Lỗi giả lập thanh toán test', details: String(error) }, { status: 500 });
    }
}
