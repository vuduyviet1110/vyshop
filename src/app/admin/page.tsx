'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// BỘ CUSTOM SVG ICONS THỦ CÔNG PHONG CÁCH "NÀNG THƠ" VYYY BOUTIQUE (KHÔNG DÙNG ICON MẶC ĐỊNH LIBRARIES)
const IconCrown = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-5-4 5-6-7z" />
        <circle cx="12" cy="4" r="1" fill="currentColor" />
        <circle cx="4" cy="4" r="1" fill="currentColor" />
        <circle cx="20" cy="4" r="1" fill="currentColor" />
    </svg>
);

const IconSilkBag = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

const IconSparkleStar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
);

const IconCoinDiamond = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 12L2 9z" />
        <path d="M11 3v18" />
        <path d="M2 9h20" />
    </svg>
);

const IconClockHourglass = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
);

const IconSearchLens = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const IconRefreshSync = ({ className }: { className?: string }) => (
    <svg width="15" height="15" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
);

const IconCheckSeal = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const IconBackArrow = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

interface OrderItem {
    id: string;
    productName: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    image: string;
}

interface Order {
    id: string;
    customerName: string;
    phone: string;
    address: string;
    note?: string;
    items: OrderItem[];
    totalPrice: number;
    paymentMethod: 'VIETQR' | 'COD' | 'CREDIT';
    status: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'DANG_GIAO' | 'HOAN_THANH' | 'DA_HUY';
    createdAt: string;
    paidAt?: string;
    paidAmount?: number;
}

interface Stats {
    totalRevenue: number;
    pendingOrders: number;
    paidOrders: number;
    totalOrders: number;
}

export default function AdminDashboardPage() {
    const [mounted, setMounted] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalRevenue: 0,
        pendingOrders: 0,
        paidOrders: 0,
        totalOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách đơn hàng:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 8000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                fetchOrders();
            }
        } catch (err) {
            console.error('Lỗi cập nhật trạng thái:', err);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesQuery = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.phone.includes(searchQuery);
        const matchesFilter = statusFilter === 'ALL' || o.status === statusFilter;
        return matchesQuery && matchesFilter;
    });

    if (!mounted) {
        return <div suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#fbf9f5' }} />;
    }

    return (
        <div suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#fbf9f5', color: '#3d4a3e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            {/* HEADER BOUTIQUE */}
            <header style={{
                backgroundColor: 'rgba(251, 249, 245, 0.94)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(91, 110, 93, 0.18)',
                padding: '20px 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link href="/" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#5b6e5d',
                        textDecoration: 'none',
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        padding: '8px 18px',
                        borderRadius: '30px',
                        backgroundColor: '#f3efe6',
                        border: '1px solid rgba(91, 110, 93, 0.25)',
                        boxShadow: '0 2px 8px rgba(61, 74, 62, 0.04)'
                    }}>
                        <IconBackArrow /> VỀ CỬA HÀNG
                    </Link>

                    <div style={{ height: '28px', width: '1px', backgroundColor: 'rgba(91, 110, 93, 0.2)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: 700, letterSpacing: '0.14em', color: '#3d4a3e' }}>
                            VYYY BOUTIQUE
                        </span>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#b87a5c',
                            backgroundColor: 'rgba(184, 122, 92, 0.12)',
                            border: '1px solid rgba(184, 122, 92, 0.25)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            letterSpacing: '0.1em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <IconSparkleStar /> QUẢN TRỊ VIÊN
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={fetchOrders}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '30px',
                            border: '1px solid rgba(91, 110, 93, 0.3)',
                            backgroundColor: '#f3efe6',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#3d4a3e',
                            letterSpacing: '0.08em'
                        }}
                    >
                        <IconRefreshSync className={loading ? 'animate-spin' : ''} /> LÀM MỚI DỮ LIỆU
                    </button>

                    <a
                        href="https://my.sepay.vn"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 22px',
                            borderRadius: '30px',
                            backgroundColor: '#5b6e5d',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            boxShadow: '0 6px 18px rgba(91, 110, 93, 0.28)'
                        }}
                    >
                        <IconCrown /> MỞ SEPAY
                    </a>
                </div>
            </header>

            {/* CONTAINER NỘI DUNG MAIN */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>

                {/* STATS CARDS CHUẨN BOUTIQUE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>

                    {/* REVENUE CARD */}
                    <div style={{
                        backgroundColor: '#f3efe6',
                        borderRadius: '24px',
                        padding: '28px',
                        border: '1px solid rgba(91, 110, 93, 0.22)',
                        boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#657566' }}>
                                DOANH THU THỰC NHẬN
                            </span>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(91, 110, 93, 0.15)', color: '#5b6e5d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconCoinDiamond />
                            </div>
                        </div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', fontWeight: 700, color: '#3d4a3e', marginTop: '18px', letterSpacing: '-0.01em' }}>
                            {stats.totalRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '18px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>đ</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#5b6e5d', marginTop: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#b87a5c' }}>✦</span> Tự động khớp VietQR SePay
                        </div>
                    </div>

                    {/* PAID ORDERS CARD */}
                    <div style={{
                        backgroundColor: '#f3efe6',
                        borderRadius: '24px',
                        padding: '28px',
                        border: '1px solid rgba(91, 110, 93, 0.22)',
                        boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#657566' }}>
                                ĐƠN ĐÃ THANH TOÁN
                            </span>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(184, 122, 92, 0.15)', color: '#b87a5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconSilkBag />
                            </div>
                        </div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', fontWeight: 700, color: '#3d4a3e', marginTop: '18px' }}>
                            {stats.paidOrders} <span style={{ fontSize: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, color: '#657566' }}>/ {stats.totalOrders} đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#b87a5c', marginTop: '10px', fontWeight: 700 }}>
                            ✦ Sẵn sàng xuất kho & đóng gói
                        </div>
                    </div>

                    {/* PENDING CARD */}
                    <div style={{
                        backgroundColor: '#f3efe6',
                        borderRadius: '24px',
                        padding: '28px',
                        border: '1px solid rgba(91, 110, 93, 0.22)',
                        boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#657566' }}>
                                ĐƠN CHỜ TIỀN VỀ
                            </span>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconClockHourglass />
                            </div>
                        </div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', fontWeight: 700, color: '#D97706', marginTop: '18px' }}>
                            {stats.pendingOrders} <span style={{ fontSize: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, color: '#657566' }}>đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#D97706', marginTop: '10px', fontWeight: 700 }}>
                            ⏳ Đang lắng nghe Webhook Ngân hàng
                        </div>
                    </div>

                </div>

                {/* SEARCH & FILTER */}
                <div style={{
                    backgroundColor: '#f3efe6',
                    borderRadius: '20px',
                    border: '1px solid rgba(91, 110, 93, 0.2)',
                    padding: '20px 28px',
                    marginBottom: '28px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                        minWidth: '320px',
                        backgroundColor: '#fbf9f5',
                        padding: '10px 20px',
                        borderRadius: '30px',
                        border: '1px solid rgba(91, 110, 93, 0.22)'
                    }}>
                        <IconSearchLens />
                        <input
                            type="text"
                            placeholder="Tìm theo Mã đơn (VYYY-xxx), Tên nàng thơ, Số điện thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#3d4a3e' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {['ALL', 'CHO_THANH_TOAN', 'DA_THANH_TOAN', 'HOAN_THANH'].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    letterSpacing: '0.06em',
                                    transition: 'all 0.2s',
                                    backgroundColor: statusFilter === st ? '#5b6e5d' : 'transparent',
                                    color: statusFilter === st ? '#ffffff' : '#657566'
                                }}
                            >
                                {st === 'ALL' ? 'TẤT CẢ' : st === 'CHO_THANH_TOAN' ? 'CHỜ TIỀN' : st === 'DA_THANH_TOAN' ? 'ĐÃ TIỀN' : 'HOÀN THÀNH'}
                            </button>
                        ))}
                    </div>

                </div>

                {/* BẢNG ĐƠN HÀNG */}
                <div style={{
                    backgroundColor: '#f3efe6',
                    borderRadius: '24px',
                    border: '1px solid rgba(91, 110, 93, 0.2)',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'rgba(91, 110, 93, 0.08)', borderBottom: '1px solid rgba(91, 110, 93, 0.18)', color: '#5b6e5d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                    <th style={{ padding: '20px 24px' }}>Mã Đơn</th>
                                    <th style={{ padding: '20px 24px' }}>Thông Tin Khách</th>
                                    <th style={{ padding: '20px 24px' }}>Sản Phẩm Đặt Mua</th>
                                    <th style={{ padding: '20px 24px' }}>Phương Thức & Tiền</th>
                                    <th style={{ padding: '20px 24px' }}>Trạng Thái</th>
                                    <th style={{ padding: '20px 24px', textAlign: 'center' }}>Hành Động Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a395' }}>
                                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', color: '#3d4a3e' }}>Chưa tìm thấy đơn hàng nào</div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid rgba(91, 110, 93, 0.1)' }}>

                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: '#3d4a3e', fontSize: '15px' }}>{order.id}</div>
                                                <div style={{ fontSize: '11px', color: '#94a395', marginTop: '6px' }}>
                                                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </td>

                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 800, color: '#3d4a3e', fontSize: '14px' }}>{order.customerName}</div>
                                                <div style={{ fontSize: '12px', color: '#b87a5c', fontWeight: 800, marginTop: '2px' }}>{order.phone}</div>
                                                <div style={{ fontSize: '12px', color: '#657566', marginTop: '6px', maxWidth: '240px', lineHeight: '1.4' }}>
                                                    📍 {order.address}
                                                </div>
                                                {order.note && (
                                                    <div style={{ fontSize: '11px', color: '#b87a5c', fontStyle: 'italic', marginTop: '6px', backgroundColor: 'rgba(184, 122, 92, 0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                                                        📝 {order.note}
                                                    </div>
                                                )}
                                            </td>

                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                                        <img src={item.image} alt={item.productName} style={{ width: '40px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(91, 110, 93, 0.2)' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '12px', color: '#3d4a3e' }}>{item.productName}</div>
                                                            <div style={{ fontSize: '11px', color: '#657566', marginTop: '2px' }}>
                                                                Size: <strong style={{ color: '#3d4a3e' }}>{item.size}</strong> • Màu: <strong style={{ color: '#3d4a3e' }}>{item.color}</strong> • x{item.quantity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </td>

                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', fontWeight: 700, color: '#b87a5c' }}>
                                                    {order.totalPrice.toLocaleString('vi-VN')} đ
                                                </div>
                                                <div style={{ marginTop: '6px' }}>
                                                    {order.paymentMethod === 'VIETQR' ? (
                                                        <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: 'rgba(91, 110, 93, 0.15)', color: '#5b6e5d', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                                                            ⚡ VIETQR SEPAY
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: 'rgba(101, 117, 102, 0.15)', color: '#657566', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                                                            💵 THANH TOÁN COD
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                {order.status === 'DA_THANH_TOAN' ? (
                                                    <div>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(91, 110, 93, 0.2)', color: '#5b6e5d', padding: '6px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                                                            <IconCheckSeal /> ĐÃ THANH TOÁN
                                                        </span>
                                                        {order.paidAt && (
                                                            <div style={{ fontSize: '10px', color: '#5b6e5d', marginTop: '6px' }}>
                                                                Khớp lúc: {new Date(order.paidAt).toLocaleTimeString('vi-VN')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : order.status === 'CHO_THANH_TOAN' ? (
                                                    <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#D97706', padding: '6px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                                                        <IconClockHourglass /> CHỜ CHUYỂN KHOẢN
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#fbf9f5', color: '#657566', padding: '6px 12px', borderRadius: '16px' }}>
                                                        {order.status}
                                                    </span>
                                                )}
                                            </td>

                                            <td style={{ padding: '20px 24px', verticalAlign: 'top', textAlign: 'center' }}>
                                                {order.status === 'CHO_THANH_TOAN' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'DA_THANH_TOAN')}
                                                        style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: '#5b6e5d', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em' }}
                                                    >
                                                        Xác nhận đã nhận tiền
                                                    </button>
                                                )}
                                                {order.status === 'DA_THANH_TOAN' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'HOAN_THANH')}
                                                        style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(91, 110, 93, 0.3)', backgroundColor: '#fbf9f5', color: '#5b6e5d', fontSize: '11px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em' }}
                                                    >
                                                        Hoàn thành ➔
                                                    </button>
                                                )}
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>

        </div>
    );
}
