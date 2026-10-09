/**
 * policies.ts — Single source of truth cho toàn bộ chính sách Vyyy Boutique.
 * 
 * Được dùng bởi:
 *   - AI Chat system prompt
 *   - Hiển thị trang chính sách / hỗ trợ khách hàng
 */

export interface PolicySubItem {
    title: string;
    content: string;
    bullets?: string[];
}

export interface PolicySection {
    id: string;
    icon: string;
    title: string;
    badge: string;
    badgeColor: string;
    items: PolicySubItem[];
}

export const POLICIES: PolicySection[] = [
    {
        id: 'return',
        icon: 'RefreshCw',
        title: 'Chính sách đổi trả hàng cụa shop',
        badge: '7 ngày',
        badgeColor: 'emerald',
        items: [
            {
                title: 'Điều kiện được đổi/trả trang phục',
                content: 'Khách hàng có quyền yêu cầu đổi/trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng với các điều kiện:',
                bullets: [
                    'Trang phục còn nguyên tem mác, nhãn hiệu Vyyy Boutique',
                    'Sản phẩm chưa qua sử dụng, chưa qua giặt tẩy hoặc chỉnh sửa phom dáng',
                    'Còn đầy đủ hộp, túi phụ kiện đi kèm (nếu có)',
                    'Có hóa đơn mua hàng hoặc xác nhận đơn hàng điện tử',
                    'Lý do đổi/trả hợp lệ: giao sai size, sai màu, lỗi đường may, không đúng mô tả',
                ],
            },
            {
                title: 'Quy trình đổi/trả',
                content: 'Thực hiện qua 4 bước đơn giản:',
                bullets: [
                    'Bước 1: Liên hệ hotline Vyyy Boutique 1800-VYYY (1800-8999) hoặc khung chat AI',
                    'Bước 2: Gửi mã đơn hàng và hình ảnh/video mô tả lỗi hoặc nhu cầu đổi size',
                    'Bước 3: Chuyên viên tư vấn xác nhận và hướng dẫn đóng gói gửi hàng',
                    'Bước 4: Nhận sản phẩm mới hoặc hoàn tiền trong vòng 3–5 ngày làm việc',
                ],
            },
            {
                title: 'Chi phí vận chuyển đổi/trả',
                content: 'Phân chia trách nhiệm chi phí vận chuyển:',
                bullets: [
                    'Lỗi do nhà sản xuất / sai mẫu: Vyyy Boutique chịu 100% phí vận chuyển 2 chiều',
                    'Đổi size / màu (lần 1): Vyyy Boutique hỗ trợ 50% phí ship chiều đổi',
                    'Đổi ý không có lý do: Khách hàng thanh toán phí vận chuyển 2 chiều',
                ],
            },
        ],
    },
    {
        id: 'refund',
        icon: 'CreditCard',
        title: 'Chính sách hoàn tiền',
        badge: '3–5 ngày',
        badgeColor: 'blue',
        items: [
            {
                title: 'Phương thức & thời gian hoàn tiền',
                content: 'Số tiền hoàn lại được chuyển theo cùng phương thức thanh toán gốc:',
                bullets: [
                    'Thanh toán COD / Chuyển khoản VietQR: Hoàn về khoản ngân hàng trong 3–5 ngày làm việc',
                    'Thẻ tín dụng / Thẻ ghi nợ: Hoàn trong 5–10 ngày làm việc theo chính sách ngân hàng',
                    'Vyyy Voucher: Hoàn mã giảm giá tương đương trong vòng 24 giờ',
                ],
            },
            {
                title: 'Hoàn tiền 100%',
                content: 'Vyyy Boutique hoàn trả 100% giá trị đơn hàng (bao gồm cả phí ship) nếu:',
                bullets: [
                    'Sản phẩm giao không đúng chất liệu, phom dáng mô tả',
                    'Trang phục bị lỗi đường may, hư hỏng trong lúc vận chuyển',
                    'Đơn hàng bị thất lạc trong quá trình vận chuyển',
                    'Cửa hàng tự hủy đơn do hết mẫu vải hoặc hết size',
                ],
            },
        ],
    },
    {
        id: 'cancel',
        icon: 'XCircle',
        title: 'Chính sách hủy đơn hàng',
        badge: 'Trước khi giao',
        badgeColor: 'amber',
        items: [
            {
                title: 'Quy định hủy đơn',
                content: 'Thời điểm được phép hủy đơn:',
                bullets: [
                    'Trạng thái "Chờ xử lý": Hủy hoàn toàn miễn phí, hoàn lại tiền đã thanh toán trong 24h',
                    'Trạng thái "Đang đóng gói": Phụ thu 2% chi phí xử lý phụ kiện đóng gói',
                    'Trạng thái "Đang giao hàng": Không thể hủy, khách hàng áp dụng quy trình đổi trả sau khi nhận',
                ],
            },
        ],
    },
    {
        id: 'shipping',
        icon: 'Truck',
        title: 'Chính sách vận chuyển toàn quốc',
        badge: 'Miễn phí',
        badgeColor: 'purple',
        items: [
            {
                title: 'Thời gian & Phí giao hàng',
                content: 'Vyyy Boutique áp dụng chương trình FREESHIP cho mọi đơn hàng:',
                bullets: [
                    'Nội thành Hà Nội & TP.HCM: 1–2 ngày làm việc',
                    'Các tỉnh thành khác: 2–4 ngày làm việc',
                    'Giao hỏa tốc nhận trong ngày: Áp dụng đơn nội thành đặt trước 14h',
                ],
            },
        ],
    },
];

export function buildPolicyText(): string {
    const lines = ['=== CHÍNH SÁCH VYYY BOUTIQUE ===\n'];
    POLICIES.forEach((section, si) => {
        lines.push(`--- ${si + 1}. ${section.title.toUpperCase()} ---`);
        section.items.forEach(item => {
            lines.push(`\n[${item.title}]`);
            lines.push(item.content);
            (item.bullets || []).forEach(b => lines.push(`- ${b}`));
        });
        lines.push('');
    });
    lines.push('Hotline Nàng Thơ CSKH: 1800-VYYY (8:00 – 22:00 hàng ngày)');
    lines.push('=== HẾT CHÍNH SÁCH ===');
    return lines.join('\n');
}

export const POLICY_TEXT = buildPolicyText();
