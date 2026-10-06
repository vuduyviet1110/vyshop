'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Menu, ChevronLeft, ChevronRight, QrCode, CreditCard, Banknote, CheckCircle, X } from 'lucide-react';
import { RACK_SETS, type Product } from './data';
import { BANK_CONFIG } from './config/bankConfig';

// Bảng màu một tiệm thật thường bày: tông nhã, cùng một gu, không phải cầu vồng.
// Mỗi phần tử là độ xoay màu + độ bão hoà áp lên ảnh gốc (áo xanh cobalt).
const RACK_PALETTE = [
  { hue: 0, sat: 0.9, bri: 1.0 },     // xanh cobalt gốc
  { hue: 28, sat: 0.62, bri: 1.06 },  // xanh tím nhạt
  { hue: 300, sat: 0.34, bri: 1.14 }, // hồng phấn
  { hue: 318, sat: 0.5, bri: 1.0 },   // đỏ đô
  { hue: 205, sat: 0.3, bri: 1.12 },  // be kem
  { hue: 95, sat: 0.42, bri: 0.98 },  // xanh rêu
  { hue: 332, sat: 0.26, bri: 1.16 }, // nude
  { hue: 250, sat: 0.3, bri: 1.05 },  // tím khói
  { hue: 150, sat: 0.36, bri: 1.02 }, // xanh ngọc trầm
  { hue: 345, sat: 0.72, bri: 0.94 }, // đỏ rượu
];

// Mỗi chiếc lệch màu/góc một chút -> dàn áo trông như hàng thật, không phải 30 bản sao.
const garmentLook = (id: string, index: number) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }

  // lệch pha palette để hai chiếc kề nhau không trùng tông
  const p = RACK_PALETTE[(index * 3 + Math.floor(index / RACK_PALETTE.length)) % RACK_PALETTE.length];

  return {
    hue: (p.hue + (h % 9) - 4).toFixed(0),
    sat: (p.sat + ((h >>> 8) % 12) / 100).toFixed(2),
    bri: (p.bri + ((h >>> 16) % 8) / 100 - 0.04).toFixed(2),
    tilt: (((h >>> 4) % 25) / 10 - 1.2).toFixed(1)
  };
};

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export const App: React.FC = () => {
  // State Giỏ hàng & Checkout
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'default-1',
      product: RACK_SETS[0].products[0],
      size: 'M',
      color: RACK_SETS[0].products[0].colors[0]?.name || 'Mặc định',
      quantity: 1
    }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Form thanh toán & Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VIETQR' | 'CREDIT'>('VIETQR');
  const [isVerifyingQR, setIsVerifyingQR] = useState(false);
  const [paymentBill, setPaymentBill] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tự động tắt Toast thông báo sau 4.2 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Thêm sản phẩm vào Giỏ Hàng
  const addToCart = (product: Product, size: string, color: string) => {
    const itemKey = `${product.id}-${size}-${color}`;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === itemKey);
      if (existing) {
        return prev.map(item => item.id === itemKey ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: itemKey, product, size, color, quantity: 1 }];
    });
  };

  // Cập nhật số lượng sản phẩm trong giỏ
  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  // Xóa sản phẩm khỏi giỏ
  const removeCartItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // State quản lý dàn treo hiện tại (Rack Index 0 hoặc 1)
  const [currentRackIndex, setCurrentRackIndex] = useState(0);
  const [rollingAnimClass, setRollingAnimClass] = useState('');
  const isTransitioningRef = useRef(false);

  const currentRack = RACK_SETS[currentRackIndex];
  const productsList = currentRack.products;

  // State quản lý sản phẩm đang được cầm ra ngắm từ dàn treo
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Refs để lưu danh sách các phần tử sản phẩm trên sào treo
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // khi chọn một sản phẩm, tự động cuộn container sào treo để đưa áo đó vào giữa màn hình
  useEffect(() => {
    if (selectedProduct && itemRefs.current[selectedProduct.id]) {
      const timer = setTimeout(() => {
        const itemEl = itemRefs.current[selectedProduct.id];
        const containerEl = itemEl?.closest('.rack-clothes-wrapper') as HTMLElement;

        if (itemEl && containerEl) {
          const itemLeft = itemEl.offsetLeft;
          const itemWidth = itemEl.offsetWidth;
          const containerWidth = containerEl.clientWidth;

          // Tính toán vị trí scrollLeft để item được căn chính giữa container
          const targetScrollLeft = itemLeft - (containerWidth / 2) + (itemWidth / 2);

          containerEl.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
          });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [selectedProduct]);

  // Hàm chuyển đổi giữa 2 Dàn sào treo riêng biệt (Rack 1 <-> Rack 2)
  const changeRack = (newIndex: number) => {
    if (newIndex === currentRackIndex || isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setSelectedProduct(null);

    // Dàn cũ trượt lướt sang bên trái
    setRollingAnimClass('rack-rolling-out');

    setTimeout(() => {
      setCurrentRackIndex(newIndex);
      // Dàn mới lập tức nối đuôi đi vào từ bên phải
      setRollingAnimClass('rack-rolling-in');

      setTimeout(() => {
        setRollingAnimClass('');
        isTransitioningRef.current = false;
      }, 450);
    }, 350);
  };

  // Cuộn chuột (Scroll) để trượt lướt qua lại giữa 2 Dàn sào riêng biệt
  const handleWheelOnRack = (e: React.WheelEvent) => {
    if (isTransitioningRef.current) return;

    if (e.deltaY > 15 || e.deltaX > 15) {
      // Cuộn xuống / sang phải -> Chuyển sang Dàn sào tiếp theo
      const nextIndex = (currentRackIndex + 1) % RACK_SETS.length;
      changeRack(nextIndex);
    } else if (e.deltaY < -15 || e.deltaX < -15) {
      // Cuộn lên / sang trái -> Quay lại Dàn sào trước
      const prevIndex = currentRackIndex === 0 ? RACK_SETS.length - 1 : currentRackIndex - 1;
      changeRack(prevIndex);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Toast Notification sang trọng khi thêm sản phẩm */}
      {toastMessage && (
        <div className="vyyy-toast-notification">
          <div className="toast-text">{toastMessage}</div>
        </div>
      )}

      {/* Thanh Thông Báo Đầu Trang */}
      <div
        style={{
          backgroundColor: 'var(--accent-sage)',
          color: '#ffffff',
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '6px 12px',
          textAlign: 'center',
          fontWeight: 600,
          flexShrink: 0
        }}
      >
        VYYY BOUTIQUE | MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC DÀNH CHO NÀNG THƠ
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: 'var(--bg-card)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-sage)', paddingBottom: '12px' }}>
              <span className="vyyy-heading gold-gradient-text" style={{ fontSize: '18px', fontWeight: 900 }}>MENU</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <a href="#new" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px' }}>HÀNG MỚI VỀ</a>
              <a href="#clothing" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '13px' }}>THỜI TRANG NÀNG THƠ</a>
              <a href="#suiting" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '13px' }}>SUIT & TRENCH COAT</a>
            </nav>
          </div>
        </div>
      )}

      {/* ==========================================
          HEADER VYYY (RESPONSIVE)
          ========================================== */}
      <header
        style={{
          flexShrink: 0,
          backgroundColor: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-sage)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div
          className="vyyy-header-inner"
          style={{
            height: '52px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              className="mobile-menu-btn"
            >
              <Menu size={20} color="var(--text-primary)" />
            </button>

            <h1 className="vyyy-heading gold-gradient-text vyyy-heading-logo" style={{ fontSize: '22px', letterSpacing: '0.18em', fontWeight: 900 }}>
              VYYY
            </h1>

            <nav style={{ display: 'flex', gap: '20px' }} className="vyyy-subheading vyyy-nav-links">
              <a href="#new" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '11px' }}>HÀNG MỚI VỀ</a>
              <a href="#clothing" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '11px' }}>THỜI TRANG NÀNG THƠ</a>
              <a href="#suiting" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '11px' }}>SUIT & TRENCH COAT</a>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              id="cart-header-badge"
              className={isCartBouncing ? 'cart-badge-bounce' : ''}
              onClick={() => setIsCartOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(91, 110, 93, 0.1)',
                border: '1px solid var(--border-sage)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              <ShoppingBag size={15} color="var(--accent-sage)" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-sage)' }}>
                GIỎ HÀNG ({cartCount})
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          CART DRAWER MODAL (TRƯỢT TỪ BÊN PHẢI)
          ========================================== */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              height: '100%',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
              animation: 'slideInRight 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Cart Drawer */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-sage)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={18} color="var(--accent-sage)" />
                <span className="vyyy-heading gold-gradient-text" style={{ fontSize: '16px', fontWeight: 900 }}>GIỎ HÀNG NÀNG THƠ</span>
                <span style={{ fontSize: '11px', background: 'rgba(91,110,93,0.1)', color: 'var(--accent-sage)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  {cartCount} món
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            {/* Content Danh Sách Món Hàng */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} color="var(--border-sage)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>Giỏ hàng của nàng hiện chưa có món nào</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Hãy dạo ngắm dàn sào treo và chọn những bộ trang phục ưng ý nhé!</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '12px',
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-sage)',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{ width: '64px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-sage)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.product.name}</h4>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                        <span>Size: <strong>{item.size}</strong></span>
                        <span>•</span>
                        <span>Màu: <strong>{item.color}</strong></span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-terracotta)', marginTop: '6px' }}>
                        {item.product.price.toLocaleString('vi-VN')} đ
                      </div>

                      {/* Tăng giảm số lượng */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-sage)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: 700, width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-sage)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeCartItem(item.id)}
                      style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '6px', fontSize: '16px' }}
                      title="Xóa sản phẩm"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Cart Drawer */}
            {cartItems.length > 0 && (
              <div style={{ padding: '20px', borderTop: '1px solid var(--border-sage)', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>TỔNG CỘNG HÀNG THỜI TRANG:</span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
                    {cartTotalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
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
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(91, 110, 93, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  TIẾN HÀNH ĐẶT HÀNG / CHECKOUT ➔
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          CHECKOUT FORM MODAL
          ========================================== */}
      {isCheckoutOpen && (
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
                      <span style={{ fontWeight: 700 }}>{(item.product.price * item.quantity).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-sage)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
                    <span>THÀNH TIỀN:</span>
                    <span>{cartTotalPrice.toLocaleString('vi-VN')} đ</span>
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

                    if (paymentMethod === 'VIETQR') {
                      setIsVerifyingQR(true);
                      setTimeout(() => {
                        setIsVerifyingQR(false);
                        setCheckoutSuccess(true);
                      }, 1800);
                    } else {
                      setCheckoutSuccess(true);
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
                          Số tiền: <strong>{cartTotalPrice.toLocaleString('vi-VN')} đ</strong> • Nội dung: <strong>VYYY {customerInfo.phone || 'CHO NANG'}</strong>
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
                      <span style={{ fontSize: '17px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>{cartTotalPrice.toLocaleString('vi-VN')} đ</span>
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
      )}

      {/* HERO BANNER RESPONSIVE */}
      <section className="vyyy-hero-section" style={{ padding: '10px 24px', borderBottom: '1px solid var(--border-sage)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span className="vyyy-subheading" style={{ color: 'var(--accent-terracotta)', fontWeight: 700, fontSize: '10px' }}>BỘ SƯU TẬP THU ĐÔNG 2026</span>
          <h2 className="vyyy-heading gold-gradient-text vyyy-hero-title" style={{ fontSize: '20px', marginTop: '2px' }}>ÁO TRENCH COAT</h2>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(91,110,93,0.1)', color: 'var(--accent-sage)', padding: '4px 12px', borderRadius: '12px', fontWeight: 700 }}>
          {productsList.length} MẪU TREO SÀO
        </span>
      </section>

      {/* ==========================================
          MAIN CONTAINER: DÀN TREO FULL MÀN HÌNH BAN ĐẦU & HIỂN THỊ CỘT TRÁI KHI CLICK CHỌN
          ========================================== */}
      <div className="vyyy-main-layout" style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', transition: 'all 0.4s ease', overflow: 'hidden' }}>

        {/* CỘT BÊN TRÁI: BẢNG CHI TIẾT SẢN PHẨM (DESKTOP PANEL & MOBILE POPUP MODAL) */}
        {selectedProduct && (
          <>
            {/* Overlay nền tối khi hiện Popup trên Mobile */}
            <div
              className="mobile-modal-overlay"
              onClick={() => setSelectedProduct(null)}
            />
            <div
              className="vyyy-left-column vyyy-product-modal"
              style={{
                borderRight: '1px solid var(--border-sage)',
                backgroundColor: 'var(--bg-card)',
                overflowY: 'auto',
                padding: '24px 28px 40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="vyyy-subheading" style={{ color: 'var(--accent-terracotta)', fontWeight: 800, background: 'rgba(184, 122, 92, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                      {selectedProduct.tag}
                    </span>

                    {/* NÚT ĐÓNG / CẤT ÁO VỀ DÀN TREO */}
                    <button
                      onClick={() => setSelectedProduct(null)}
                      style={{
                        background: 'rgba(91, 110, 93, 0.1)',
                        border: '1px solid var(--border-sage)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        fontWeight: 700
                      }}
                      title="Đóng chi tiết"
                    >
                      ✕
                    </button>
                  </div>

                  <h2 className="vyyy-heading gold-gradient-text" style={{ fontSize: '24px', marginBottom: '8px', lineHeight: 1.2 }}>
                    {selectedProduct.name}
                  </h2>

                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-terracotta)', marginBottom: '16px' }}>
                    ${selectedProduct.price.toLocaleString()} USD
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {selectedProduct.description}
                  </p>

                  {/* THÔNG TIN CHI TIẾT ÁO/QUẦN */}
                  <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-light)', marginBottom: '16px' }}>
                    <h4 className="vyyy-subheading" style={{ fontSize: '11px', color: 'var(--accent-sage)', marginBottom: '10px' }}>
                      ĐẶC ĐIỂM NỔI BẬT & ĐƯỜNG MAY
                    </h4>
                    <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedProduct.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>

                  {/* CHẤT LIỆU & BẢO QUẢN */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: 'var(--bg-main)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <span className="vyyy-subheading" style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>CHẤT LIỆU</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-olive)' }}>{selectedProduct.material}</span>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-main)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <span className="vyyy-subheading" style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>BẢO QUẢN</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-olive)' }}>{selectedProduct.care}</span>
                    </div>
                  </div>

                  {/* CHỌN MÀU SẮC */}
                  <div style={{ marginBottom: '16px' }}>
                    <span className="vyyy-subheading" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      MÀU SẮC NÀNG THƠ ({selectedProduct.colors[selectedColorIndex]?.name})
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedProduct.colors.map((col, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColorIndex(idx)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: col.hex,
                            border: selectedColorIndex === idx ? '2px solid var(--accent-terracotta)' : '2px solid transparent',
                            outline: selectedColorIndex === idx ? '2px solid var(--accent-sage)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title={col.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* CHỌN SIZE */}
                  <div style={{ marginBottom: '20px' }}>
                    <span className="vyyy-subheading" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      KÍCH THƯỚC CHUẨN (SIZE)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedProduct.sizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: selectedSize === sz ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-sage)',
                            backgroundColor: selectedSize === sz ? 'var(--accent-terracotta)' : 'var(--bg-main)',
                            color: selectedSize === sz ? '#fff' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* HÀNH ĐỘNG MUA HÀNG */}
                <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-sage)' }}>
                  <button
                    onClick={(e) => {
                      const btnRect = e.currentTarget.getBoundingClientRect();
                      const cartBtn = document.getElementById('cart-header-badge');
                      const cartRect = cartBtn ? cartBtn.getBoundingClientRect() : { left: window.innerWidth - 100, top: 20 };

                      const flyingEl = document.createElement('div');
                      flyingEl.className = 'flying-cart-item';
                      flyingEl.style.left = `${btnRect.left + btnRect.width / 2 - 25}px`;
                      flyingEl.style.top = `${btnRect.top - 20}px`;

                      const imgEl = document.createElement('img');
                      imgEl.src = selectedProduct.image;
                      flyingEl.appendChild(imgEl);
                      document.body.appendChild(flyingEl);

                      const startX = btnRect.left + btnRect.width / 2 - 25;
                      const startY = btnRect.top - 20;
                      const endX = cartRect.left + 10;
                      const endY = cartRect.top + 10;

                      const animation = flyingEl.animate([
                        {
                          transform: 'translate(0, 0) scale(1) rotate(0deg)',
                          opacity: 1
                        },
                        {
                          transform: `translate(${(endX - startX) * 0.5}px, ${(endY - startY) * 0.3 - 60}px) scale(0.8) rotate(-15deg)`,
                          opacity: 0.9,
                          offset: 0.4
                        },
                        {
                          transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.15) rotate(20deg)`,
                          opacity: 0.1
                        }
                      ], {
                        duration: 750,
                        easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
                        fill: 'forwards'
                      });

                      animation.onfinish = () => {
                        flyingEl.remove();
                        addToCart(selectedProduct, selectedSize || selectedProduct.sizes[0] || 'S', selectedProduct.colors[selectedColorIndex]?.name || 'Mặc định');
                        setIsCartBouncing(true);
                        setTimeout(() => setIsCartBouncing(false), 500);
                        setToastMessage(`Đã thêm "${selectedProduct.name}" vào giỏ hàng nàng thơ`);
                        setSelectedProduct(null);
                      };
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: 'var(--accent-sage)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '12px',
                      letterSpacing: '0.12em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 20px rgba(91, 110, 93, 0.25)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <ShoppingBag size={16} />
                    THÊM VÀO GIỎ HÀNG NÀNG THƠ
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CỘT BÊN PHẢI: DÀN TREO ÁO VÀ QUẦN (FULL 100% WIDTH BAN ĐẦU, THU LẠI 58% KHI CÓ ITEM ĐƯỢC CHỌN TRÊN DESKTOP) */}
        <div
          className="vyyy-right-column"
          onWheel={handleWheelOnRack}
          style={{
            width: selectedProduct ? '58%' : '100%',
            padding: selectedProduct ? '32px 36px' : '40px 64px',
            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-sage)', paddingBottom: '14px' }}>
            <div>
              <span className="vyyy-subheading" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-sage)', display: 'block' }}>
                {currentRack.title}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Cuộn chuột hoặc nhấn nút ◀ ▶ hai bên để đổi dàn sào treo khác • Click item để xem chi tiết
              </p>
            </div>

            {/* Nút điều hướng chuyển Dàn sào treo ◀ ▶ (Desktop Header Controls) */}
            <div className="rack-header-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => changeRack(currentRackIndex === 0 ? RACK_SETS.length - 1 : currentRackIndex - 1)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sage)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Sào treo trước"
              >
                <ChevronLeft size={16} color="var(--accent-sage)" />
              </button>
              <span style={{ fontSize: '11px', background: 'rgba(91,110,93,0.1)', color: 'var(--accent-sage)', padding: '6px 14px', borderRadius: '16px', fontWeight: 700 }}>
                DÀN SÀO {currentRackIndex + 1}/{RACK_SETS.length} ({productsList.length} MẪU)
              </span>
              <button
                onClick={() => changeRack(currentRackIndex === RACK_SETS.length - 1 ? 0 : currentRackIndex + 1)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sage)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Sào treo tiếp theo"
              >
                <ChevronRight size={16} color="var(--accent-sage)" />
              </button>
            </div>
          </div>

          {/* DÀN TREO QUẦN ÁO SẮT ĐEN CÓ BÁNH XE XOAY (BLACK INDUSTRIAL WHEELED RACK) */}
          <div className={`boutique-rack-container ${rollingAnimClass}`} style={{ padding: selectedProduct ? '40px 24px 60px' : '50px 40px 70px' }}>
            {/* Nút Navigation nổi 2 bên dàn treo cho Mobile swipe & chạm nhanh */}
            <button
              className="rack-side-nav-btn left"
              onClick={() => changeRack(currentRackIndex === 0 ? RACK_SETS.length - 1 : currentRackIndex - 1)}
              title="Dàn sào trước"
            >
              <ChevronLeft size={20} color="#ffffff" />
            </button>
            <button
              className="rack-side-nav-btn right"
              onClick={() => changeRack(currentRackIndex === RACK_SETS.length - 1 ? 0 : currentRackIndex + 1)}
              title="Dàn sào tiếp"
            >
              <ChevronRight size={20} color="#ffffff" />
            </button>

            {/* Thanh sào ngang sắt đen */}
            <div className="metallic-hanger-bar" />

            {/* 2 Cột đứng sắt đen ở 2 bên */}
            <div className="rack-side-pillar left" />
            <div className="rack-side-pillar right" />

            {/* Thanh sắt cân bằng đáy */}
            <div className="rack-base-bar" />

            {/* 2 tầng kệ lưới sắt phía dưới */}
            <div className="rack-shelf upper" />
            <div className="rack-shelf lower" />

            {/* Cụm Bánh Xe Cao Su Chân Sào Bên Trái */}
            <div className="rack-wheel-assembly left">
              <div className="rack-caster-wheel" />
              <div className="rack-caster-wheel" />
            </div>

            {/* Cụm Bánh Xe Cao Su Chân Sào Bên Phải */}
            <div className="rack-wheel-assembly right">
              <div className="rack-caster-wheel" />
              <div className="rack-caster-wheel" />
            </div>

            {/* Các sản phẩm đang treo dọc trên sào */}
            <div className={`rack-clothes-wrapper ${selectedProduct ? 'has-selected' : ''}`}>
              {productsList.map((product, index) => {
                const isSelected = selectedProduct?.id === product.id;
                const look = garmentLook(product.id, index);

                return (
                  <div
                    key={product.id}
                    ref={(el) => { itemRefs.current[product.id] = el; }}
                    className={`hanging-item ${isSelected ? 'selected' : ''}`}
                    style={{
                      '--i': index,
                      '--tilt': `${look.tilt}deg`,
                      '--hue': `${look.hue}deg`,
                      '--sat': look.sat,
                      '--bri': look.bri
                    } as React.CSSProperties}
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedColorIndex(0);
                      setSelectedSize(product.sizes[0] || 'S');
                    }}
                  >
                    {/* Lớp đung đưa nhẹ quanh điểm móc vắt lên sào */}
                    <div className="sway-root">
                      {/* Móc treo lồng trực tiếp với Áo Dài thành 1 khối duy nhất */}
                      <div className="wooden-hanger">
                        <div className="hanger-hook" />
                        <div className="hanger-shoulder" />

                        {/* Áo Dài móc trực tiếp dưới vai gỗ */}
                        <div className="garment-card">
                          <img src={product.image} alt={product.name} draggable={false} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ==========================================
          FOOTER VYYY BOUTIQUE (COMPACT SINGLE LINE FOR MOBILE)
          ========================================== */}
      <footer
        className="vyyy-footer"
        style={{
          flexShrink: 0,
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-sage)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}
      >
        <div className="footer-compact-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="vyyy-heading gold-gradient-text footer-brand-title" style={{ fontSize: '14px', fontWeight: 900 }}>VYYY BOUTIQUE</span>
          <span className="footer-copyright-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>© 2026. ALL RIGHTS RESERVED.</span>
        </div>

        <div className="footer-extra-links" style={{ display: 'flex', gap: '16px' }}>
          <a href="#about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>VỀ CHÚNG TÔI</a>
          <a href="#policy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>CHÍNH SÁCH</a>
          <a href="#contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>LIÊN HỆ</a>
        </div>
      </footer>
    </div>
  );
}

export default App;;
