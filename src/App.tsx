'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ShoppingBag, Menu, User, ChevronDown, Settings, LogOut, Shield, Heart, Package, Layers, LayoutGrid } from 'lucide-react';
import type { Product, Rack, CartItem } from './types/product';
import { BANK_CONFIG } from './config/bankConfig';
import { AiChatbot } from './components/AiChatbot';
import { ContactDock } from './components/ContactDock';
import { CartDrawer } from './components/store/CartDrawer';
import { CheckoutModal, type PaymentMethod, type CustomerInfo } from './components/store/CheckoutModal';
import { ProductModal } from './components/store/ProductModal';
import { Rack3D } from './components/store/Rack3D';
import { CatalogGrid } from './components/store/CatalogGrid';
import { StoreFooter } from './components/store/StoreFooter';

export const App: React.FC = () => {
  // State Giỏ hàng & Checkout (Lưu & đọc từ localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Khôi phục giỏ hàng từ LocalStorage, rồi đồng bộ lại giá/tên/ảnh mới nhất từ database:
  // giỏ lưu từ trước có thể mang giá cũ, và số tiền thanh toán/QR lấy từ giá trong giỏ.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const savedCart = localStorage.getItem('vyyy_cart');
        if (!savedCart) return;
        const saved: CartItem[] = JSON.parse(savedCart);
        if (!Array.isArray(saved) || saved.length === 0) return;
        setCartItems(saved);

        const ids = Array.from(new Set(saved.map((i) => i.product.id)));
        const res = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`);
        if (!res.ok) return;
        const { products } = (await res.json()) as { products: Product[] };
        const latest = new Map(products.map((p) => [p.id, p]));

        // Sản phẩm không còn trong DB thì bỏ khỏi giỏ
        const synced = saved
          .filter((i) => latest.has(i.product.id))
          .map((i) => ({ ...i, product: { ...i.product, ...latest.get(i.product.id)! } }));
        if (cancelled) return;
        setCartItems(synced);
        localStorage.setItem('vyyy_cart', JSON.stringify(synced));
      } catch (e) {
        console.error('Lỗi đọc giỏ hàng:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Tự động lưu giỏ hàng khi thay đổi
  const updateCartWithStorage = (newCart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setCartItems(prev => {
      const updated = typeof newCart === 'function' ? newCart(prev) : newCart;
      try {
        localStorage.setItem('vyyy_cart', JSON.stringify(updated));
      } catch (e) {
        console.error('Lỗi lưu giỏ hàng:', e);
      }
      return updated;
    });
  };

  // Form thanh toán & Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VIETQR');
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
    updateCartWithStorage(prev => {
      const existing = prev.find(item => item.id === itemKey);
      if (existing) {
        return prev.map(item => item.id === itemKey ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: itemKey, product, size, color, quantity: 1 }];
    });
  };

  // Cập nhật số lượng sản phẩm trong giỏ
  const updateQuantity = (id: string, delta: number) => {
    updateCartWithStorage(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  // Xóa sản phẩm khỏi giỏ
  const removeCartItem = (id: string) => {
    updateCartWithStorage(prev => prev.filter(item => item.id !== id));
  };

  // State quản lý dàn treo & API sản phẩm
  const [currentRackIndex, setCurrentRackIndex] = useState(0);
  const [rollingAnimClass, setRollingAnimClass] = useState('');
  const isTransitioningRef = useRef(false);

  // API Infinite Scroll với TanStack Query
  const [viewMode, setViewMode] = useState<'3d_rack' | 'grid_catalog'>('3d_rack');
  // Danh sách dàn sào lấy từ database
  const {
    data: racksData,
    isLoading: isLoadingRacks,
    isError: isRacksError,
    refetch: refetchRacks
  } = useQuery<{ racks: Rack[] }>({
    queryKey: ['racks'],
    queryFn: async () => {
      const res = await fetch('/api/racks');
      if (!res.ok) throw new Error('Không tải được danh sách dàn sào');
      return res.json();
    },
    staleTime: 1000 * 60 * 5
  });
  const racks = racksData?.racks ?? [];
  const rackCount = racks.length;
  const currentRack: Rack | null = racks[currentRackIndex] ?? null;

  const targetRackId = viewMode === 'grid_catalog' ? 'all' : currentRack?.id;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingProducts,
    isError: isProductsError,
    refetch: refetchProducts
  } = useInfiniteQuery({
    queryKey: ['products', targetRackId],
    enabled: !!targetRackId,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/products?rackId=${targetRackId}&page=${pageParam}&limit=24`);
      if (!res.ok) throw new Error('Không tải được sản phẩm');
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // Cache dữ liệu sản phẩm trong 5 phút
  });

  // Gộp tất cả các sản phẩm từ các trang đã tải của TanStack Query
  const apiProducts = data ? data.pages.flatMap(p => p.products || []) : [];
  const productsList: Product[] = apiProducts;

  // Đang chờ danh sách dàn / sản phẩm của dàn hiện tại -> hiện skeleton
  const isRackLoading = isLoadingRacks || (!!targetRackId && isLoadingProducts);
  const hasLoadError = isRacksError || isProductsError;
  const retryLoad = () => { refetchRacks(); refetchProducts(); };

  // Dàn sào hiển thị trọn vẹn: tải nốt các trang còn lại (catalogue thì tải dần khi cuộn)
  useEffect(() => {
    if (viewMode === '3d_rack' && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [viewMode, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite scroll handler khi cuộn danh sách catalogue xuống gần đáy
  const handleCatalogScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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

  // Hàm chuyển đổi giữa các Dàn sào treo (Rack 1 <-> Rack 2)
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
      const nextIndex = (currentRackIndex + 1) % rackCount;
      changeRack(nextIndex);
    } else if (e.deltaY < -15 || e.deltaX < -15) {
      // Cuộn lên / sang trái -> Quay lại Dàn sào trước
      const prevIndex = currentRackIndex === 0 ? rackCount - 1 : currentRackIndex - 1;
      changeRack(prevIndex);
    }
  };

  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // AI Chatbot component is now encapsulated in <AiChatbot />

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('vyyy_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div suppressHydrationWarning style={{ height: '100vh', width: '100vw', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '80%',
              maxWidth: '300px',
              height: '100%',
              backgroundColor: 'var(--bg-main)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: '8px 0 30px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-sage)', paddingBottom: '16px' }}>
              <span className="vyyy-heading gold-gradient-text" style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.1em' }}>VYYY BOUTIQUE</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
              >
                ✕
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <a href="#new" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em' }}>HÀNG MỚI VỀ</a>
              <a href="#clothing" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>THỜI TRANG NÀNG THƠ</a>
              <a href="#suiting" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>SUIT & TRENCH COAT</a>
              <Link href="/chinh-sach" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>CHÍNH SÁCH MUA HÀNG</Link>
            </nav>
          </div>
        </div>
      )}

      {/* ==========================================
          HEADER VYYY (RESPONSIVE)
          ========================================== */}
      <header
        style={{
          position: 'relative',
          zIndex: 1000,
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
              {/* <a href="#clothing" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '11px' }}>THỜI TRANG NÀNG THƠ</a> */}
              {/* <a href="#suiting" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '11px' }}>SUIT & TRENCH COAT</a> */}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {session?.user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(91, 110, 93, 0.12)',
                    border: '1px solid var(--accent-sage)',
                    color: 'var(--accent-sage)',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <User size={14} color="var(--accent-sage)" />
                  <span className="vyyy-user-name-text">{(session.user.name || session.user.email || 'NÀNG THƠ').toUpperCase()}</span>
                  <ChevronDown size={13} style={{ transition: 'transform 0.2s ease', transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {isUserMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '210px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-sage)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    padding: '8px',
                    zIndex: 1050,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(91, 110, 93, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <User size={15} color="var(--accent-sage)" /> TRANG CÁ NHÂN & ĐƠN HÀNG
                    </Link>

                    <Link
                      href="/profile?tab=settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(91, 110, 93, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Settings size={15} color="var(--accent-sage)" /> CẤU HÌNH & THEME
                    </Link>

                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: 'var(--accent-terracotta)',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(184, 122, 92, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Shield size={15} color="var(--accent-terracotta)" /> QUẢN TRỊ ADMIN
                      </Link>
                    )}

                    <div style={{ height: '1px', backgroundColor: 'var(--border-sage)', margin: '4px 0' }} />

                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--accent-terracotta)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(184, 122, 92, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={15} color="var(--accent-terracotta)" /> ĐĂNG XUẤT
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/auth/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(184, 122, 92, 0.1)',
                  border: '1px solid var(--accent-terracotta)',
                  textDecoration: 'none',
                  color: 'var(--accent-terracotta)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap'
                }}
              >
                <User size={14} color="var(--accent-terracotta)" />
                <span className="vyyy-btn-text-mobile">ĐĂNG NHẬP</span>
              </a>
            )}

            <div
              id="cart-header-badge"
              className={isCartBouncing ? 'cart-badge-bounce' : ''}
              onClick={() => setIsCartOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'rgba(91, 110, 93, 0.1)',
                border: '1px solid var(--border-sage)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <ShoppingBag size={15} color="var(--accent-sage)" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-sage)' }}>
                GIỎ HÀNG <span className="vyyy-btn-text-mobile">({cartCount})</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          CART DRAWER MODAL (TRƯỢT TỪ BÊN PHẢI)
          ========================================== */}
      {isCartOpen && (
        <CartDrawer
          cartItems={cartItems}
          cartCount={cartCount}
          cartTotalPrice={cartTotalPrice}
          removeCartItem={removeCartItem}
          updateQuantity={updateQuantity}
          setIsCartOpen={setIsCartOpen}
          setIsCheckoutOpen={setIsCheckoutOpen}
        />
      )}

      {/* ==========================================
          CHECKOUT FORM MODAL
          ========================================== */}
      {isCheckoutOpen && (
        <CheckoutModal
          cartItems={cartItems}
          cartCount={cartCount}
          cartTotalPrice={cartTotalPrice}
          checkoutSuccess={checkoutSuccess}
          customerInfo={customerInfo}
          isVerifyingQR={isVerifyingQR}
          paymentBill={paymentBill}
          paymentMethod={paymentMethod}
          setCartItems={setCartItems}
          setCheckoutSuccess={setCheckoutSuccess}
          setCustomerInfo={setCustomerInfo}
          setIsCheckoutOpen={setIsCheckoutOpen}
          setIsVerifyingQR={setIsVerifyingQR}
          setPaymentBill={setPaymentBill}
          setPaymentMethod={setPaymentMethod}
          updateCartWithStorage={updateCartWithStorage}
        />
      )}

      {/* HERO BANNER RESPONSIVE & THANH ĐIỀU HƯỚNG BỘ SƯU TẬP */}
      <section className="vyyy-hero-section" style={{ padding: '10px 24px', borderBottom: '1px solid var(--border-sage)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="vyyy-subheading" style={{ color: 'var(--accent-terracotta)', fontWeight: 700, fontSize: '10px' }}>
            {viewMode === '3d_rack' ? 'BỘ SƯU TẬP THU ĐÔNG 2026' : 'CATALOGUE SẢN PHẨM'}
          </span>
          <h2 className="vyyy-heading gold-gradient-text vyyy-hero-title" style={{ fontSize: '18px', marginTop: '2px' }}>
            {viewMode === '3d_rack' ? (
              currentRack ? (
                currentRack.title.replace(/\(\d+\s*mẫu[^\)]*\)/gi, '').trim()
              ) : <span className="skeleton" style={{ display: 'block', width: 'min(420px, 70vw)', height: '20px' }} />
            ) : (
              'TOÀN BỘ THIẾT KẾ VYYY BOUTIQUE'
            )}
          </h2>
        </div>

        {/* NÚT CHUYỂN ĐỔI GIAO DIỆN & TRANG (PAGINATION) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Nút chuyển giữa 3D Rack & Grid Catalog */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(91,110,93,0.12)', borderRadius: '20px', padding: '3px' }}>
            <button
              onClick={() => setViewMode('3d_rack')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: viewMode === '3d_rack' ? 'var(--accent-sage)' : 'transparent',
                color: viewMode === '3d_rack' ? '#fff' : 'var(--accent-sage)',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={14} /> SÀO 3D
            </button>
            <button
              onClick={() => setViewMode('grid_catalog')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid_catalog' ? 'var(--accent-sage)' : 'transparent',
                color: viewMode === 'grid_catalog' ? '#fff' : 'var(--accent-sage)',
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={14} /> TẤT CẢ MẪU
            </button>
          </div>
        </div>
      </section>

      {/* ==========================================
          MAIN CONTAINER: DÀN TREO FULL MÀN HÌNH BAN ĐẦU & HIỂN THỊ CỘT TRÁI KHI CLICK CHỌN
          ========================================== */}
      <div className="vyyy-main-layout" style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', transition: 'all 0.4s ease', overflow: 'hidden' }}>

        {/* CỘT BÊN TRÁI: BẢNG CHI TIẾT SẢN PHẨM (DESKTOP PANEL & MOBILE POPUP MODAL) */}
        {selectedProduct && (
          <ProductModal
            selectedProduct={selectedProduct}
            selectedColorIndex={selectedColorIndex}
            selectedSize={selectedSize}
            setSelectedColorIndex={setSelectedColorIndex}
            setSelectedProduct={setSelectedProduct}
            setSelectedSize={setSelectedSize}
            addToCart={addToCart}
            setIsCartBouncing={setIsCartBouncing}
            setToastMessage={setToastMessage}
          />
        )}

        {/* CỘT BÊN PHẢI: DÀN TREO ÁO VÀ QUẦN (FULL 100% WIDTH BAN ĐẦU, THU LẠI 58% KHI CÓ ITEM ĐƯỢC CHỌN TRÊN DESKTOP) */}
        <div
          className="vyyy-right-column"
          onWheel={viewMode === '3d_rack' ? handleWheelOnRack : undefined}
          style={{
            width: selectedProduct ? '58%' : '100%',
            padding: selectedProduct ? '32px 36px' : '40px 64px',
            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: viewMode === 'grid_catalog' ? 'hidden' : undefined
          }}
        >
          {/* CHẾ ĐỘ 1: DÀN TREO QUẦN ÁO SẮT ĐEN 3D (3D RACK) */}
          {viewMode === '3d_rack' ? (
            <Rack3D
              changeRack={changeRack}
              currentRack={currentRack}
              currentRackIndex={currentRackIndex}
              hasLoadError={hasLoadError}
              isRackLoading={isRackLoading}
              itemRefs={itemRefs}
              productsList={productsList}
              rackCount={rackCount}
              retryLoad={retryLoad}
              rollingAnimClass={rollingAnimClass}
              selectedProduct={selectedProduct}
              setSelectedColorIndex={setSelectedColorIndex}
              setSelectedProduct={setSelectedProduct}
              setSelectedSize={setSelectedSize}
            />
          ) : (
            <CatalogGrid
              handleCatalogScroll={handleCatalogScroll}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              isLoadingProducts={isLoadingProducts}
              hasLoadError={hasLoadError}
              productsList={productsList}
              retryLoad={retryLoad}
              setSelectedColorIndex={setSelectedColorIndex}
              setSelectedProduct={setSelectedProduct}
              setSelectedSize={setSelectedSize}
            />
          )}
        </div>

      </div>

      {/* ==========================================
          AI CHATBOT CONSULTANT WIDGET (PORTED FROM ECOMMERCE-ANGULAR)
          ========================================== */}
      <AiChatbot />
      <ContactDock />

      {/* ==========================================
          FOOTER VYYY BOUTIQUE (COMPACT SINGLE LINE FOR MOBILE)
          ========================================== */}
      <StoreFooter />
    </div >
  );
}

export default App;;
