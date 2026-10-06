/**
 * CẤU HÌNH THÔNG TIN TÀI KHOẢN NGÂN HÀNG & SEPAY TẬP TRUNG
 * Ưu tiên đọc từ biến môi trường (.env / .env.local)
 */

export const BANK_CONFIG = {
    // Thông tin tài khoản ngân hàng chính thức (Lấy từ .env hoặc fallback giá trị mặc định)
    bankId: process.env.NEXT_PUBLIC_BANK_ID,
    bankName: process.env.NEXT_PUBLIC_BANK_NAME,
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER,
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,

    transferPrefix: process.env.NEXT_PUBLIC_TRANSFER_PREFIX,

    // Hàm tạo link VietQR tự động chính xác số tiền & cú pháp
    getVietQRUrl: (amount: number, customerPhone?: string) => {
        const prefix = BANK_CONFIG.transferPrefix;
        const memo = encodeURIComponent(`${prefix} ${customerPhone || 'CHO NANG'}`);
        const name = encodeURIComponent(BANK_CONFIG.accountName);
        return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNumber}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${name}`;
    }
};
