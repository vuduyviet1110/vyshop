/**
 * THÔNG TIN LIÊN HỆ & PHÁP LÝ CỦA CỬA HÀNG (hiện ở chân trang).
 * Hotline lấy theo chính sách đang dùng cho AI chat; địa chỉ / pháp nhân chỉ hiện khi
 * được cấu hình trong .env, không đặt giá trị giả.
 */
export const STORE_INFO = {
    name: 'VYYY BOUTIQUE',
    hotline: '1800-VYYY (1800-8999)',
    hotlineHref: 'tel:18008999',
    hours: '8:00 – 22:00 hàng ngày',
    address: process.env.NEXT_PUBLIC_STORE_ADDRESS?.trim() || '',
    // Ví dụ: "Hộ kinh doanh Đoàn Hà Vy - MST 0123456789"
    legal: process.env.NEXT_PUBLIC_STORE_LEGAL?.trim() || '',
    facebookPage: process.env.NEXT_PUBLIC_FACEBOOK_PAGE?.trim() || '',
    zaloId: process.env.NEXT_PUBLIC_ZALO_ID?.trim() || '',
};
