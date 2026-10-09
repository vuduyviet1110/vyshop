'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Shield, Palette, LogOut, ArrowLeft, Check, Sparkles, Heart, Package, ShoppingBag, Trash2, ExternalLink } from 'lucide-react';
import { formatVND } from '@/lib/format';

function ProfileContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'orders';

    const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'settings'>(
        (initialTab as any) || 'orders'
    );

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [theme, setTheme] = useState<'sage' | 'rose' | 'terracotta' | 'dark'>('sage');
    const [savedMsg, setSavedMsg] = useState(false);

    const [wishlist, setWishlist] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || '');
            setEmail(session.user.email || '');
        }
        const currentTheme = (localStorage.getItem('vyyy_theme') as any) || 'sage';
        setTheme(currentTheme);

        if (activeTab === 'wishlist') {
            const fetchWishlist = async () => {
                try {
                    const res = await fetch('/api/wishlist');
                    const data = await res.json();
                    if (data.success && Array.isArray(data.wishlist)) {
                        setWishlist(data.wishlist);
                    }
                } catch (e) {
                    console.error('Lỗi đọc wishlist từ Database:', e);
                }
            };
            fetchWishlist();
        }

        if (activeTab === 'orders') {
            const fetchRealOrders = async () => {
                setIsLoadingOrders(true);
                try {
                    const res = await fetch('/api/orders');
                    const data = await res.json();
                    if (data.success && Array.isArray(data.orders)) {
                        setOrders(data.orders);
                    }
                } catch (err) {
                    console.error('Lỗi tải danh sách đơn hàng thực tế:', err);
                } finally {
                    setIsLoadingOrders(false);
                }
            };
            fetchRealOrders();
        }

        if (status === 'unauthenticated') {
            router.push('/auth/login?callbackUrl=/profile');
        }
    }, [session, status, router, activeTab]);

    if (status === 'loading' || status === 'unauthenticated') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                {status === 'loading' ? 'Đang tải thông tin cá nhân...' : 'Đang chuyển hướng đến trang đăng nhập...'}
            </div>
        );
    }

    const handleThemeChange = (newTheme: 'sage' | 'rose' | 'terracotta' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('vyyy_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
    };

    const removeWishlistItem = async (id: string) => {
        setWishlist(prev => prev.filter(item => item.id !== id));
        try {
            await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Lỗi xóa wishlist khỏi Database:', e);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            padding: '36px 24px 64px',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            justifyContent: 'center',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1240px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Header Profile Top Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border-sage)',
                    padding: '20px 28px',
                    boxShadow: '0 8px 30px rgba(91, 110, 93, 0.06)',
                }}>
                    <div>
                        <Link href="/" style={{ fontSize: '12px', color: 'var(--accent-sage)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                            <ArrowLeft size={14} /> QUAY LẠI SHOWROOM
                        </Link>
                        <h1 className="vyyy-heading gold-gradient-text" style={{ fontSize: '24px', letterSpacing: '0.08em', margin: 0 }}>
                            TÀI KHOẢN NÀNG THƠ
                        </h1>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(184, 122, 92, 0.1)',
                            border: '1px solid var(--accent-terracotta)',
                            color: 'var(--accent-terracotta)',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <LogOut size={14} /> ĐĂNG XUẤT
                    </button>
                </div>

                {/* DASHBOARD GRID: 2 CỘT TẬN DỤNG RỘNG 2 BÊN */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '320px 1fr',
                    gap: '24px',
                    alignItems: 'start'
                }}>
                    {/* CỘT TRÁI: THẺ THÀNH VIÊN & DASHBOARD NAV */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Member Card Component */}
                        <div style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-sage)',
                            padding: '24px',
                            boxShadow: '0 8px 30px rgba(91, 110, 93, 0.06)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-sage) 0%, var(--accent-terracotta) 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                fontWeight: 900,
                                margin: '0 auto 14px',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                            }}>
                                {(name || 'N').charAt(0).toUpperCase()}
                            </div>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>{name || 'Nàng Thơ'}</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px' }}>{email}</p>

                            <div style={{
                                padding: '8px 12px',
                                borderRadius: '12px',
                                background: 'rgba(91, 110, 93, 0.08)',
                                border: '1px solid rgba(91, 110, 93, 0.18)',
                                fontSize: '11px',
                                fontWeight: 800,
                                color: 'var(--accent-sage)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Sparkles size={13} color="var(--accent-terracotta)" />
                                {(session?.user as any)?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN (ADMIN)' : 'THÀNH VIÊN VYYY VIP'}
                            </div>
                        </div>

                        {/* Navigation Tabs Bar Vertical */}
                        <div style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-sage)',
                            padding: '12px',
                            boxShadow: '0 8px 30px rgba(91, 110, 93, 0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setActiveTab('orders')}
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: activeTab === 'orders' ? 'rgba(91, 110, 93, 0.12)' : 'transparent',
                                    color: activeTab === 'orders' ? 'var(--accent-sage)' : 'var(--text-muted)',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                            >
                                <Package size={18} /> LỊCH SỬ ĐƠN HÀNG
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('wishlist')}
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: activeTab === 'wishlist' ? 'rgba(184, 122, 92, 0.12)' : 'transparent',
                                    color: activeTab === 'wishlist' ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                            >
                                <Heart size={18} /> YÊU THÍCH ({wishlist.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('settings')}
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: activeTab === 'settings' ? 'rgba(91, 110, 93, 0.12)' : 'transparent',
                                    color: activeTab === 'settings' ? 'var(--accent-sage)' : 'var(--text-muted)',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                            >
                                <Palette size={18} /> CẤU HÌNH & THEME
                            </button>
                        </div>
                    </div>

                    {/* CỘT PHẢI: NỘI DUNG CHI TIẾT */}
                    <div style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: '20px',
                        border: '1px solid var(--border-sage)',
                        padding: '32px',
                        boxShadow: '0 8px 30px rgba(91, 110, 93, 0.06)',
                        minHeight: '480px'
                    }}>

                        {/* TAB 1: LỊCH SỬ ĐƠN HÀNG */}
                        {activeTab === 'orders' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-sage)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Package size={16} /> Đơn Hàng Đã Đặt
                                </h3>
                                {isLoadingOrders ? (
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>Đang tải lịch sử đơn hàng từ hệ thống...</p>
                                ) : orders.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Nàng chưa có đơn hàng nào trong lịch sử.</p>
                                ) : (
                                    orders.map((order) => {
                                        const formattedPrice = typeof order.totalPrice === 'number'
                                            ? formatVND(order.totalPrice)
                                            : order.totalPrice || '0 đ';
                                        const itemSummary = Array.isArray(order.items)
                                            ? order.items.map((i: any) => `${i.productName || i.name} (${i.size}/${i.color})`).join(', ')
                                            : (order.items || 'Sản phẩm Vyyy Boutique');
                                        const statusLabel = order.status === 'DA_THANH_TOAN' || order.status === 'HOAN_THANH'
                                            ? 'Đã hoàn tất'
                                            : order.status === 'CHO_THANH_TOAN'
                                                ? 'Chờ thanh toán / Vận chuyển'
                                                : (order.status || 'Đã ghi nhận');

                                        return (
                                            <div key={order.id} style={{
                                                padding: '20px',
                                                borderRadius: '16px',
                                                border: '1px solid var(--border-sage)',
                                                backgroundColor: '#ffffff',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{order.id}</span>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 800,
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            backgroundColor: statusLabel === 'Đã hoàn tất' ? 'rgba(91, 110, 93, 0.15)' : 'rgba(184, 122, 92, 0.15)',
                                                            color: statusLabel === 'Đã hoàn tất' ? 'var(--accent-sage)' : 'var(--accent-terracotta)',
                                                        }}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>{itemSummary}</p>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        Ngày đặt: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : order.date || 'Hôm nay'}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-terracotta)', display: 'block' }}>{formattedPrice}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* TAB 2: DANH SÁCH YÊU THÍCH (WISHLIST) */}
                        {activeTab === 'wishlist' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-terracotta)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Heart size={16} /> Bộ Sưu Tập Yêu Thích Của Nàng
                                </h3>
                                {wishlist.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Danh sách yêu thích đang trống.</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        {wishlist.map((item) => (
                                            <div key={item.id} style={{
                                                padding: '16px',
                                                borderRadius: '16px',
                                                border: '1px solid var(--border-sage)',
                                                backgroundColor: '#ffffff',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                            }}>
                                                <div>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase' }}>{item.category}</span>
                                                    <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '4px 0 8px 0', fontWeight: 700 }}>{item.name}</h4>
                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-terracotta)' }}>{item.price}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                    <Link href="/" style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        borderRadius: '10px',
                                                        backgroundColor: 'var(--accent-sage)',
                                                        color: '#ffffff',
                                                        textDecoration: 'none',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        textAlign: 'center',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                    }}>
                                                        <ShoppingBag size={12} /> XEM MẪU
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWishlistItem(item.id)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '10px',
                                                            border: '1px solid var(--accent-terracotta)',
                                                            backgroundColor: 'transparent',
                                                            color: 'var(--accent-terracotta)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: CẤU HÌNH & THEME */}
                        {activeTab === 'settings' && (
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                {savedMsg && (
                                    <div style={{ padding: '12px 16px', backgroundColor: 'rgba(91, 110, 93, 0.15)', border: '1px solid var(--accent-sage)', borderRadius: '12px', color: 'var(--accent-sage)', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Check size={16} /> Đã cập nhật Cấu hình & Giao diện thành công!
                                    </div>
                                )}

                                {/* Thông tin cá nhân */}
                                <div>
                                    <h3 style={{ fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-sage)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <User size={16} /> Thông Tin Cá Nhân
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>HỌ VÀ TÊN</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-sage)', backgroundColor: '#ffffff', fontSize: '13px', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>EMAIL</label>
                                            <input
                                                type="email"
                                                disabled
                                                value={email}
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-sage)', backgroundColor: 'rgba(0,0,0,0.04)', fontSize: '13px', color: 'var(--text-muted)' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Phân quyền Role */}
                                <div>
                                    <h3 style={{ fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-sage)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={16} /> Cấp Độ Tài Khoản
                                    </h3>
                                    <div style={{ padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-sage)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                {(session?.user as any)?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN (ADMIN)' : 'NÀNG THƠ BOUTIQUE (MEMBER)'}
                                            </span>
                                        </div>
                                        <Sparkles size={18} color="var(--accent-terracotta)" />
                                    </div>
                                </div>

                                {/* Tùy chỉnh Theme */}
                                <div>
                                    <h3 style={{ fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-sage)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Palette size={16} /> Tùy Chỉnh Màu Sắc Giao Diện (Theme)
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {[
                                            { id: 'sage', name: 'Xanh Rêu Sage', color: '#5b6e5d' },
                                            { id: 'rose', name: 'Hồng Nàng Thơ', color: '#b87a5c' },
                                            { id: 'terracotta', name: 'Đất Nung Terracotta', color: '#a65233' },
                                            { id: 'dark', name: 'Đêm Luxury Dark', color: '#2a352b' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleThemeChange(item.id as any)}
                                                style={{
                                                    padding: '16px 12px',
                                                    borderRadius: '16px',
                                                    border: theme === item.id ? `2px solid ${item.color}` : '1px solid var(--border-sage)',
                                                    backgroundColor: '#ffffff',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: theme === item.id ? `0 6px 16px ${item.color}33` : 'none',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: item.color, margin: '0 auto 8px auto' }} />
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>{item.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    style={{
                                        padding: '16px',
                                        backgroundColor: 'var(--accent-sage)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: 800,
                                        fontSize: '13px',
                                        letterSpacing: '0.12em',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 20px rgba(91, 110, 93, 0.25)',
                                        marginTop: '12px',
                                    }}
                                >
                                    LƯU CẤU HÌNH THAY ĐỔI
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải trang cá nhân...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
