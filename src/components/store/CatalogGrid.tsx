import React from 'react';
import type { Product } from '../../types/product';
import { StarIcon } from '../ProductReviews';
import { formatVND } from '../../lib/format';

interface CatalogGridProps {
  handleCatalogScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoadingProducts: boolean;
  hasLoadError: boolean;
  productsList: Product[];
  retryLoad: () => void;
  setSelectedColorIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  setSelectedSize: React.Dispatch<React.SetStateAction<string>>;
}

export function CatalogGrid({
  handleCatalogScroll,
  hasNextPage,
  isFetchingNextPage,
  isLoadingProducts,
  hasLoadError,
  productsList,
  retryLoad,
  setSelectedColorIndex,
  setSelectedProduct,
  setSelectedSize,
}: CatalogGridProps) {
  return (
    /* CHẾ ĐỘ 2: LƯỚI CATALOGUE (SHOPEE/AMAZON STYLE - INFINITE SCROLL) - ĐÃ XÓA SUB-HEADER THỪA */
    <div
      className="catalog-grid-wrapper"
      onScroll={handleCatalogScroll}
      style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', padding: '16px 24px 60px', backgroundColor: 'var(--bg-main)' }}
    >
      <div className="catalog-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '20px' }}>
        {!isLoadingProducts && productsList.map((product) => (
          <div
            key={product.id}
            onClick={() => {
              setSelectedProduct(product);
              setSelectedColorIndex(0);
              setSelectedSize(product.sizes[0] || 'S');
            }}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-sage)',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              transition: 'all 0.25s ease'
            }}
            className="hover:-translate-y-1"
          >
            <div style={{ position: 'relative', paddingTop: '130%', overflow: 'hidden' }}>
              <img
                src={product.image}
                alt={product.name}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'var(--accent-sage)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '10px' }}>
                {product.tag}
              </span>
            </div>
            <div className="catalog-card-body" style={{ padding: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: '1.4' }}>{product.name}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 6px 0', minHeight: '16px' }}>
                {product.ratingCount ? (
                  <>
                    <StarIcon size={12} />
                    <b style={{ color: 'var(--text-primary)' }}>{product.ratingAvg?.toFixed(1)}</b>
                    <span>({product.ratingCount})</span>
                  </>
                ) : (
                  <span>Chưa có đánh giá</span>
                )}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent-terracotta)' }}>
                {formatVND(product.price)}
              </div>
            </div>
          </div>
        ))}
        {(isLoadingProducts || isFetchingNextPage) && Array.from({ length: isLoadingProducts ? 12 : 4 }, (_, i) => (
          <div key={`sk-${i}`} aria-hidden="true" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-sage)', overflow: 'hidden' }}>
            <div className="skeleton" style={{ paddingTop: '130%', borderRadius: 0 }} />
            <div style={{ padding: '14px', display: 'grid', gap: '8px' }}>
              <div className="skeleton" style={{ height: '13px', width: '85%' }} />
              <div className="skeleton" style={{ height: '11px', width: '45%' }} />
              <div className="skeleton" style={{ height: '14px', width: '35%' }} />
            </div>
          </div>
        ))}
      </div>

      {!isLoadingProducts && hasLoadError && (
        <div className="rack-state-message">
          <p>Không tải được dữ liệu từ cửa hàng.</p>
          <button type="button" onClick={retryLoad}>THỬ LẠI</button>
        </div>
      )}

      {!isLoadingProducts && !hasLoadError && productsList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '12px' }}>Chưa có sản phẩm nào.</div>
      )}

      {!hasNextPage && productsList.length > 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>
          ✨ Bạn đã xem hết tất cả mẫu thiết kế trong bộ sưu tập này ✨
        </div>
      )}
    </div>
  );
}
