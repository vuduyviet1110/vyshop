import React from 'react';
import { ShoppingBag, Heart } from 'lucide-react';
import type { Product } from '../../types/product';
import { ProductReviews } from '../ProductReviews';
import { formatVND } from '../../lib/format';

interface ProductModalProps {
  selectedProduct: Product;
  selectedColorIndex: number;
  selectedSize: string;
  setSelectedColorIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  setSelectedSize: React.Dispatch<React.SetStateAction<string>>;
  addToCart: (product: Product, size: string, color: string) => void;
  setIsCartBouncing: React.Dispatch<React.SetStateAction<boolean>>;
  setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export function ProductModal({
  selectedProduct,
  selectedColorIndex,
  selectedSize,
  setSelectedColorIndex,
  setSelectedProduct,
  setSelectedSize,
  addToCart,
  setIsCartBouncing,
  setToastMessage,
}: ProductModalProps) {
  return (
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
                {formatVND(selectedProduct.price)}
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

              <ProductReviews productId={selectedProduct.id} />
            </div>

            {/* HÀNH ĐỘNG MUA HÀNG VÀ YÊU THÍCH */}
            <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-sage)', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={async () => {
                  const itemToSave = {
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    price: formatVND(selectedProduct.price),
                    image: selectedProduct.image,
                    category: selectedProduct.category || 'Áo Dài Premium'
                  };

                  try {
                    const res = await fetch('/api/wishlist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(itemToSave)
                    });
                    if (res.status === 401) {
                      setToastMessage('Vui lòng đăng nhập để lưu danh sách yêu thích');
                      return;
                    }
                    if (!res.ok) throw new Error('wishlist failed');
                  } catch (e) {
                    console.error('Lỗi lưu wishlist vào Database:', e);
                    setToastMessage('Không lưu được yêu thích, vui lòng thử lại');
                    return;
                  }
                  setToastMessage(`Đã thêm "${selectedProduct.name}" vào Danh Sách Yêu Thích 💖`);
                }}
                style={{
                  padding: '14px',
                  backgroundColor: 'rgba(184, 122, 92, 0.1)',
                  border: '1px solid var(--accent-terracotta)',
                  borderRadius: '12px',
                  color: 'var(--accent-terracotta)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                title="Thêm vào danh sách yêu thích"
              >
                <Heart size={18} />
              </button>

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
                    setToastMessage(`Đã thêm "${selectedProduct.name}" vào giỏ hàng`);
                    setSelectedProduct(null);
                  };
                }}
                style={{
                  flex: 1,
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
  );
}
