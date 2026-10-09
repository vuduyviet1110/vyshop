// Định dạng tiền VNĐ dùng chung toàn site: 710000 -> "710.000 đ".
// Giá trong DB (Product.price, Order.totalPrice...) luôn là VNĐ nguyên đồng.
const vndNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export const formatVND = (amount: number): string => `${vndNumber.format(Math.round(amount))} đ`;
