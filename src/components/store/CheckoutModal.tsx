import React from 'react';
import { QrCode, CreditCard, Banknote, CheckCircle, X } from 'lucide-react';
import { BANK_CONFIG } from '../../config/bankConfig';
import type { CartItem } from '../../types/product';
import { formatVND } from '../../lib/format';

export type PaymentMethod = 'COD' | 'VIETQR' | 'CREDIT';
export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  note: string;
}

interface CheckoutModalProps {
  cartItems: CartItem[];
  cartCount: number;
  cartTotalPrice: number;
  checkoutSuccess: boolean;
  customerInfo: CustomerInfo;
  isVerifyingQR: boolean;
  paymentBill: string | null;
  paymentMethod: PaymentMethod;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setCheckoutSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVerifyingQR: React.Dispatch<React.SetStateAction<boolean>>;
  setPaymentBill: React.Dispatch<React.SetStateAction<string | null>>;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  updateCartWithStorage: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
}

export function CheckoutModal({
  cartItems,
  cartCount,
  cartTotalPrice,
  checkoutSuccess,
  customerInfo,
  isVerifyingQR,
  paymentBill,
  paymentMethod,
  setCartItems,
  setCheckoutSuccess,
  setCustomerInfo,
  setIsCheckoutOpen,
  setIsVerifyingQR,
  setPaymentBill,
  setPaymentMethod,
  updateCartWithStorage,
}: CheckoutModalProps) {
  return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => setIsCheckoutOpen(false)}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '820px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid var(--accent-terracotta)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {checkoutSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <CheckCircle size={56} color="var(--accent-sage)" style={{ margin: '0 auto 16px' }} />
              <h3 className="vyyy-heading gold-gradient-text" style={{ fontSize: '22px', marginBottom: '8px' }}>ĐẶT HÀNG THÀNH CÔNG!</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Cảm ơn nàng <strong>{customerInfo.name}</strong> đã lựa chọn Vyyy Boutique.<br />
                Chuyên viên tư vấn sẽ sớm gọi tới số <strong>{customerInfo.phone}</strong> để xác nhận và đóng gói sản phẩm!
              </p>
              <div style={{ margin: '20px 0', padding: '16px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', textAlign: 'left', border: '1px solid var(--border-sage)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 8px', color: 'var(--accent-sage)' }}>ĐƠN HÀNG GỒM {cartCount} MÓN:</p>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '4px 0' }}>
                    <span>{item.product.name} (x{item.quantity}) - {item.size}/{item.color}</span>
                    <span style={{ fontWeight: 700 }}>{formatVND(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border-sage)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
                  <span>THÀNH TIỀN:</span>
                  <span>{formatVND(cartTotalPrice)}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCartItems([]);
                  setIsCheckoutOpen(false);
                  setCheckoutSuccess(false);
                  setCustomerInfo({ name: '', phone: '', address: '', note: '' });
                }}
                style={{
                  padding: '12px 28px',
                  backgroundColor: 'var(--accent-sage)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                HOÀN TẤT & VỀ TRANG CHỦ
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-sage)', paddingBottom: '14px' }}>
                <div>
                  <h3 className="vyyy-heading gold-gradient-text" style={{ fontSize: '20px', margin: 0 }}>THÔNG TIN ĐẶT HÀNG & THANH TOÁN</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Hoàn tất đơn hàng để Vyyy Giao Đồ Tận Nơi Cho Nàng</p>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
                    alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng!');
                    return;
                  }

                  const orderPayload = {
                    orderId: 'VYYY-' + Math.floor(100000 + Math.random() * 900000),
                    name: customerInfo.name,
                    phone: customerInfo.phone,
                    address: customerInfo.address,
                    note: customerInfo.note,
                    paymentMethod: paymentMethod,
                    totalPrice: cartTotalPrice,
                    items: cartItems.map(i => ({
                      name: i.product.name,
                      size: i.size,
                      color: i.color,
                      quantity: i.quantity
                    })),
                    status: paymentMethod === 'VIETQR' ? 'Đã thanh toán (VietQR)' : 'Chờ xác nhận (COD)'
                  };

                  // Gửi đơn hàng lên Google Apps Script nếu có cấu hình URL env
                  const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
                  if (googleScriptUrl) {
                    try {
                      fetch(googleScriptUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderPayload)
                      });
                    } catch (err) {
                      console.error('Lỗi bắn Google Sheet:', err);
                    }
                  }

                  // Gửi đơn hàng về Server lưu trữ Realtime cho Admin Dashboard
                  try {
                    const orderRes = await fetch('/api/orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerName: customerInfo.name,
                        phone: customerInfo.phone,
                        address: customerInfo.address,
                        note: customerInfo.note,
                        items: cartItems.map(item => ({
                          id: item.id,
                          productId: item.product.id,
                          productName: item.product.name,
                          size: item.size,
                          color: item.color,
                          quantity: item.quantity,
                          price: item.product.price,
                          image: item.product.image
                        })),
                        totalPrice: cartTotalPrice,
                        paymentMethod,
                        status: paymentMethod === 'COD' ? 'CHO_THANH_TOAN' : 'CHO_THANH_TOAN'
                      })
                    });
                    if (!orderRes.ok) {
                      const err = await orderRes.json().catch(() => ({}));
                      alert(err.message || 'Không tạo được đơn hàng, vui lòng thử lại.');
                      return;
                    }
                  } catch (err) {
                    console.error('Lỗi lưu đơn hàng:', err);
                    alert('Không kết nối được máy chủ, đơn hàng chưa được tạo. Vui lòng thử lại.');
                    return;
                  }

                  if (paymentMethod === 'VIETQR') {
                    setIsVerifyingQR(true);
                    setTimeout(() => {
                      setIsVerifyingQR(false);
                      setCheckoutSuccess(true);
                      updateCartWithStorage([]);
                    }, 1800);
                  } else {
                    setCheckoutSuccess(true);
                    updateCartWithStorage([]);
                  }
                }}
                className="checkout-form-desktop-grid"
              >
                {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Địa chỉ giao hàng
                  </span>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>HỌ VÀ TÊN NÀNG THƠ *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Đoàn Hà Vy"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-sage)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>SỐ ĐIỆN THOẠI LH *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0988 123 456"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-sage)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>ĐỊA CHỈ NHẬN HÀNG *</label>
                    <input
                      type="text"
                      required
                      placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, TP"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-sage)', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>GHI CHÚ ĐƠN HÀNG (NẾU CÓ)</label>
                    <textarea
                      rows={3}
                      placeholder="Lưu ý về giờ giao hàng, chiều cao cân nặng để shop hỗ trợ chỉnh sửa..."
                      value={customerInfo.note}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-sage)', fontSize: '13px', outline: 'none', resize: 'none' }}
                    />
                  </div>
                </div>

                {/* CỘT PHẢI: PHƯƠNG THỨC THANH TOÁN & MÃ QR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Phương thức thanh toán
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('VIETQR')}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '12px',
                        border: paymentMethod === 'VIETQR' ? '2px solid var(--accent-sage)' : '1px solid var(--border-sage)',
                        backgroundColor: paymentMethod === 'VIETQR' ? 'rgba(91, 110, 93, 0.12)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: paymentMethod === 'VIETQR' ? 'var(--accent-sage)' : 'var(--text-secondary)'
                      }}
                    >
                      <QrCode size={20} color={paymentMethod === 'VIETQR' ? 'var(--accent-sage)' : '#666'} />
                      <span>VietQR Ngân Hàng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT')}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '12px',
                        border: paymentMethod === 'CREDIT' ? '2px solid var(--accent-sage)' : '1px solid var(--border-sage)',
                        backgroundColor: paymentMethod === 'CREDIT' ? 'rgba(91, 110, 93, 0.12)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: paymentMethod === 'CREDIT' ? 'var(--accent-sage)' : 'var(--text-secondary)'
                      }}
                    >
                      <CreditCard size={20} color={paymentMethod === 'CREDIT' ? 'var(--accent-sage)' : '#666'} />
                      <span>Thẻ Tín Dụng/ATM</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '12px',
                        border: paymentMethod === 'COD' ? '2px solid var(--accent-sage)' : '1px solid var(--border-sage)',
                        backgroundColor: paymentMethod === 'COD' ? 'rgba(91, 110, 93, 0.12)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: paymentMethod === 'COD' ? 'var(--accent-sage)' : 'var(--text-secondary)'
                      }}
                    >
                      <Banknote size={20} color={paymentMethod === 'COD' ? 'var(--accent-sage)' : '#666'} />
                      <span>COD Tiền Mặt</span>
                    </button>
                  </div>

                  {/* CHI TIẾT THEO PHƯƠNG THỨC THANH TOÁN */}
                  {paymentMethod === 'VIETQR' && (
                    <div style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '14px', border: '1px solid var(--border-sage)', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-sage)', display: 'block', marginBottom: '4px' }}>
                        MÃ VIETQR TỰ ĐỘNG CHÍNH XÁC SỐ TIỀN & CÚ PHÁP
                      </span>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Số tiền: <strong>{formatVND(cartTotalPrice)}</strong> • Nội dung: <strong>VYYY {customerInfo.phone || 'CHO NANG'}</strong>
                      </p>

                      {/* Mã VietQR động từ BANK_CONFIG */}
                      <img
                        src={BANK_CONFIG.getVietQRUrl(cartTotalPrice, customerInfo.phone)}
                        alt={`Mã VietQR ${BANK_CONFIG.accountName}`}
                        style={{ width: '170px', height: '170px', borderRadius: '12px', border: '2px solid var(--accent-sage)', padding: '4px', background: '#fff', margin: '0 auto 8px', display: 'block' }}
                      />

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'left', background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-sage)', lineHeight: '1.6', marginBottom: '10px' }}>
                        <div>• Ngân hàng: <strong>{BANK_CONFIG.bankName}</strong></div>
                        <div>• Số tài khoản: <strong style={{ color: 'var(--accent-terracotta)', fontSize: '12px' }}>{BANK_CONFIG.accountNumber}</strong></div>
                        <div>• Chủ tài khoản: <strong>{BANK_CONFIG.accountName}</strong></div>
                      </div>

                      {/* TẢI ẢNH BIÊN LAI / BILL CHUYỂN TIỀN CỦA KHÁCH */}
                      <div style={{ textAlign: 'left', background: 'rgba(91, 110, 93, 0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px dashed var(--accent-sage)' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--accent-sage)', marginBottom: '4px' }}>
                          📸 ĐẢM BẢO XÁC NHẬN: TẢI ẢNH BIÊN LAI/BILL CHUYỂN TIỀN
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setPaymentBill(url);
                            }
                          }}
                          style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                        />
                        {paymentBill && (
                          <div style={{ marginTop: '6px', fontSize: '11px', color: '#2e7d32', fontWeight: 700 }}>
                            ✓ Đã đính kèm ảnh biên lai giao dịch thành công!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'CREDIT' && (
                    <div style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '14px', border: '1px solid var(--border-sage)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>SỐ THẺ QUỐC TẾ / ATM *</label>
                        <input
                          type="text"
                          placeholder="4123 4567 8901 2345"
                          maxLength={19}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-sage)', fontSize: '12px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>NGÀY HẾT HẠN *</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-sage)', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>MÃ CVC / CVV *</label>
                          <input
                            type="password"
                            placeholder="123"
                            maxLength={4}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-sage)', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'COD' && (
                    <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '14px', border: '1px solid var(--border-sage)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-sage)', display: 'block', marginBottom: '4px' }}>THU TIỀN TẬN NƠI (COD)</span>
                      Nàng chỉ cần thanh toán tiền mặt trực tiếp cho nhân viên giao hàng khi kiểm tra và nhận đồ ưng ý!
                    </div>
                  )}

                  {/* Tổng tiền thanh toán & Nút hành động */}
                  <div style={{ padding: '12px 14px', backgroundColor: 'rgba(91,110,93,0.08)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-sage)' }}>TỔNG THANH TOÁN:</span>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>{formatVND(cartTotalPrice)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingQR}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: 'var(--accent-sage)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '13px',
                      letterSpacing: '0.08em',
                      cursor: isVerifyingQR ? 'wait' : 'pointer',
                      boxShadow: '0 4px 14px rgba(91, 110, 93, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isVerifyingQR ? (
                      <span>ĐANG XÁC NHẬN GIAO DỊCH NHÂN NGÂN HÀNG...</span>
                    ) : (
                      <span>{paymentMethod === 'VIETQR' ? 'TÔI ĐÃ CHUYỂN KHOẢN & XÁC NHẬN ➔' : 'XÁC NHẬN THANH TOÁN & ĐẶT HÀNG ➔'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
  );
}
