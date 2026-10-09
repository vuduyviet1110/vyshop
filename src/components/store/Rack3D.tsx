import React, { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, Rack } from '../../types/product';
import { StarIcon } from '../ProductReviews';
import { HangerSvg, garmentLook, SKELETON_RACK_COUNT, useRackPitch } from './rackParts';

interface Rack3DProps {
  changeRack: (newIndex: number) => void;
  currentRack: Rack | null;
  currentRackIndex: number;
  hasLoadError: boolean;
  isRackLoading: boolean;
  itemRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  productsList: Product[];
  rackCount: number;
  retryLoad: () => void;
  rollingAnimClass: string;
  selectedProduct: Product | null;
  setSelectedColorIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  setSelectedSize: React.Dispatch<React.SetStateAction<string>>;
}

export function Rack3D({
  changeRack,
  currentRack,
  currentRackIndex,
  hasLoadError,
  isRackLoading,
  itemRefs,
  productsList,
  rackCount,
  retryLoad,
  rollingAnimClass,
  selectedProduct,
  setSelectedColorIndex,
  setSelectedProduct,
  setSelectedSize,
}: Rack3DProps) {
  const rackWrapperRef = useRef<HTMLDivElement | null>(null);
  const rackPitch = useRackPitch(rackWrapperRef, isRackLoading ? SKELETON_RACK_COUNT : productsList.length, true);

  return (
    <>
      {/* Tiêu đề sub-header chỉ hiển thị khi ở 3D Rack */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-sage)', paddingBottom: '12px' }}>
        <div>
          <span className="vyyy-subheading title-transition" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-sage)', display: 'block' }}>
            {currentRack ? (
              currentRack.subtitle ? currentRack.subtitle.replace(/\(\d+\s*mẫu[^\)]*\)/gi, '').replace(/\d+\s*mẫu\s*•?\s*/gi, '').trim() : ''
            ) : <span className="skeleton" style={{ display: 'block', width: '300px', height: '12px' }} />}
          </span>
          <p className="title-transition" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Cuộn chuột hoặc nhấn nút ◀ ▶ hai bên để đổi dàn sào treo khác • Click item để xem chi tiết
          </p>
        </div>

        <div className="rack-header-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => changeRack(currentRackIndex === 0 ? rackCount - 1 : currentRackIndex - 1)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sage)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sào treo trước"
            aria-label="Sào treo trước"
          >
            <ChevronLeft size={16} color="var(--accent-sage)" />
          </button>
          <span style={{ fontSize: '11px', background: 'rgba(91,110,93,0.1)', color: 'var(--accent-sage)', padding: '6px 14px', borderRadius: '16px', fontWeight: 700 }}>
            DÀN SÀO {rackCount ? currentRackIndex + 1 : 0}/{rackCount} ({currentRack ? currentRack.productCount : 0} MẪU)
          </span>
          <button
            onClick={() => changeRack(currentRackIndex === rackCount - 1 ? 0 : currentRackIndex + 1)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sage)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sào treo tiếp theo"
            aria-label="Sào treo tiếp theo"
          >
            <ChevronRight size={16} color="var(--accent-sage)" />
          </button>
        </div>
      </div>

      <div className={`boutique-rack-container ${rollingAnimClass}`} style={{
        padding: selectedProduct ? '40px 24px 60px' : '50px 40px 70px',
        '--pad-top': selectedProduct ? '40px' : '50px'
      } as React.CSSProperties}>
        <button
          className="rack-side-nav-btn left"
          onClick={() => changeRack(currentRackIndex === 0 ? rackCount - 1 : currentRackIndex - 1)}
          title="Dàn sào trước"
          aria-label="Dàn sào trước"
        >
          <ChevronLeft size={20} color="#ffffff" />
        </button>
        <button
          className="rack-side-nav-btn right"
          onClick={() => changeRack(currentRackIndex === rackCount - 1 ? 0 : currentRackIndex + 1)}
          title="Dàn sào tiếp"
          aria-label="Dàn sào tiếp theo"
        >
          <ChevronRight size={20} color="#ffffff" />
        </button>

        <div className="metallic-hanger-bar" />
        <div className="rack-side-pillar left" />
        <div className="rack-side-pillar right" />
        <div className="rack-base-bar" />
        <div className="rack-shelf upper" />
        <div className="rack-shelf lower" />

        <div className="rack-wheel-assembly left">
          <div className="rack-caster-wheel" />
          <div className="rack-caster-wheel" />
        </div>

        <div className="rack-wheel-assembly right">
          <div className="rack-caster-wheel" />
          <div className="rack-caster-wheel" />
        </div>

        <div
          ref={rackWrapperRef}
          className={`rack-clothes-wrapper ${selectedProduct ? 'has-selected' : ''}`}
          style={{ '--pitch': `${rackPitch}px` } as React.CSSProperties}
        >
          {isRackLoading && Array.from({ length: SKELETON_RACK_COUNT }, (_, index) => (
            <div key={`sk-${index}`} className="hanging-item skeleton-item" style={{ '--i': index } as React.CSSProperties} aria-hidden="true">
              <div className="sway-root">
                <div className="wooden-hanger">
                  <HangerSvg uid={`sk${index}`} />
                  <div className="garment-card">
                    <div className="skeleton skeleton-garment" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!isRackLoading && productsList.map((product, index) => {
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
                <div className="sway-root">
                  <div className="wooden-hanger">
                    <HangerSvg uid={String(index)} />
                    <div className="garment-card">
                      {product.image.startsWith('/') ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 92px, 110px"
                          draggable={false}
                          loading={index < 6 ? 'eager' : 'lazy'}
                          fetchPriority={index < 3 ? 'high' : 'auto'}
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        <img
                          src={product.image}
                          alt={product.name}
                          draggable={false}
                          decoding="async"
                          loading={index < 6 ? 'eager' : 'lazy'}
                          fetchPriority={index < 3 ? 'high' : 'auto'}
                        />
                      )}
                      {!!product.ratingCount && (
                        <span className="rack-rating-pill" title={`${product.ratingAvg}/5 từ ${product.ratingCount} đánh giá`}>
                          <StarIcon size={10} />{product.ratingAvg?.toFixed(1)} <small>({product.ratingCount})</small>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isRackLoading && (hasLoadError || productsList.length === 0) && (
          <div className="rack-state-message">
            <p>{hasLoadError ? 'Không tải được dữ liệu từ cửa hàng.' : 'Dàn sào này chưa có sản phẩm nào.'}</p>
            {hasLoadError && <button type="button" onClick={retryLoad}>THỬ LẠI</button>}
          </div>
        )}
      </div>
    </>
  );
}
