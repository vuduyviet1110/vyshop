import React from 'react';
import { ShoppingBag, ChevronRight, X, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../../types/product';
import { formatVND } from '../../lib/format';

interface CartDrawerProps {
  cartItems: CartItem[];
  cartCount: number;
  cartTotalPrice: number;
  removeCartItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CartDrawer({
  cartItems,
  cartCount,
  cartTotalPrice,
  removeCartItem,
  updateQuantity,
  setIsCartOpen,
  setIsCheckoutOpen,
}: CartDrawerProps) {
  return (
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
              <span className="vyyy-heading gold-gradient-text" style={{ fontSize: '16px', fontWeight: 900 }}>GIỎ HÀNG CỦA NÀNG</span>
              <span style={{ fontSize: '11px', background: 'rgba(91,110,93,0.1)', color: 'var(--accent-sage)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                {cartCount} món
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
            >
              <X size={20} />
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
                      {formatVND(item.product.price)}
                    </div>

                    {/* Tăng giảm số lượng */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-sage)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={13} color="var(--text-primary)" />
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: 700, width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-sage)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={13} color="var(--text-primary)" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeCartItem(item.id)}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
                    title="Xóa sản phẩm"
                  >
                    <X size={18} />
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
                  {formatVND(cartTotalPrice)}
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
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>TIẾN HÀNH ĐẶT HÀNG / CHECKOUT</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
  );
}
