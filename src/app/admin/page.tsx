'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, CheckCircle2, Clock, RefreshCw, Search, ArrowLeft, ExternalLink, ShieldCheck, Filter, Sparkles } from 'lucide-react';
import Link from 'next/link';

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

    // Hàm tải dữ liệu đơn hàng realtime từ server
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

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f5', color: '#3d4a3e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            {/* HEADER QUẢN TRỊ THEO DESIGN VIBE "NÀNG THƠ" */}
            <header style={{
                backgroundColor: 'rgba(251, 249, 245, 0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(91, 110, 93, 0.18)',
                padding: '20px 40px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link href="/" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#5b6e5d',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backgroundColor: '#f3efe6',
                        border: '1px solid rgba(91, 110, 93, 0.2)',
                        transition: 'all 0.2s'
                    }}>
                        <ArrowLeft size={14} /> QUAY LẠI CỬA HÀNG
                    </Link>

                    <div style={{ height: '28px', width: '1px', backgroundColor: 'rgba(91, 110, 93, 0.2)' }} />

                    <div>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', fontWeight: 700, letterSpacing: '0.12em', color: '#3d4a3e' }}>
                            VYYY BOUTIQUE
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#b87a5c', backgroundColor: 'rgba(184, 122, 92, 0.12)', padding: '3px 10px', borderRadius: '12px', marginLeft: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            ✦ ADMIN DASHBOARD
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
                            padding: '10px 18px',
                            borderRadius: '20px',
                            border: '1px solid rgba(91, 110, 93, 0.25)',
                            backgroundColor: '#f3efe6',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#3d4a3e',
                            letterSpacing: '0.04em'
                        }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> LÀM MỚI DỮ LIỆU
                    </button>

                    <a
                        href="https://my.sepay.vn"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            backgroundColor: '#5b6e5d',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            boxShadow: '0 4px 14px rgba(91, 110, 93, 0.25)'
                        }}
                    >
                        <ExternalLink size={14} /> MỞ SEPAY
                    </a>
                </div>
            </header>

            {/* CONTAINER NỘI DUNG MAIN */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>

                {/* STATS CARDS THEO TÔNG MÀU NÀNG THƠ (SAGE GREEN, TERRACOTTA, CREAM) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>

                    {/* REVENUE CARD */}
                    <div style={{
                        backgroundColor: '#f3efe6',
                        borderRadius: '24px',
                        padding: '28px',
                        border: '1px solid rgba(91, 110, 93, 0.2)',
                        boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#657566' }}>
                                TỔNG DOANH THU THỰC NHẬN
                            </span>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(91, 110, 93, 0.15)', color: '#5b6e5d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarSign size={22} />
                            </div>
                        </div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', fontWeight: 700, color: '#3d4a3e', marginTop: '16px', letterSpacing: '-0.01em' }}>
                            {stats.totalRevenue.toLocaleString('vi-VN')} <span style={{ fontSize: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>đ</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#5b6e5d', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={14} color="#b87a5c" /> Khớp tiền tự động VietQR SePay
                        </div>
                    </div>

                    {/* PAID ORDERS CARD */}
                    <div style={{
                        backgroundColor: '#f3efe6',
                        borderRadius: '24px',
                        padding: '28px',
                        border: '1px solid rgba(91, 110, 93, 0.2)',
                        boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#657566' }}>
                                ĐƠN HÀNG ĐÃ THANH TOÁN
                            </span>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(184, 122, 92, 0.15)', color: '#b87a5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={22} />
                            </div>
                        </div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', fontWeight: 700, color: '#3d4a3e', marginTop: '16px' }}>
                            {stats.paidOrders} <span style={{ fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, color: '#657566' }}>/ {stats.totalOrders} đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#b87a5c', marginTop: '8px', fontWeight: 600 }}>
                            ✦ Đã sẵn sàng đóng gói & giao hàng
                        </div>
                    </div>

                    {/* PENDING CARD */}
                    <div style={{
                        backgroundColor: '#f3efe6',
                        borderRadius: '24px',
                        padding: '28px',
                        border: '1px solid rgba(91, 110, 93, 0.2)',
                        boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#657566' }}>
                                ĐƠN CHỜ CHUYỂN KHOẢN
                            </span>
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={22} />
                            </div>
                        </div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '32px', fontWeight: 700, color: '#D97706', marginTop: '16px' }}>
                            {stats.pendingOrders} <span style={{ fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, color: '#657566' }}>đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#D97706', marginTop: '8px', fontWeight: 600 }}>
                            ⏳ Lắng nghe Webhook MBBank Realtime
                        </div>
                    </div>

                </div>

                {/* TÌM KIẾM & BỘ LỌC ĐƠN HÀNG */}
                <div style={{
                    backgroundColor: '#f3efe6',
                    borderRadius: '20px',
                    border: '1px solid rgba(91, 110, 93, 0.2)',
                    padding: '20px 24px',
                    marginBottom: '28px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    alignItems: 'center',
                    justify: 'space-between'
                }}>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                        minWidth: '300px',
                        backgroundColor: '#fbf9f5',
                        padding: '10px 18px',
                        borderRadius: '30px',
                        border: '1px solid rgba(91, 110, 93, 0.2)'
                    }}>
                        <Search size={18} color="#94a395" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm Mã đơn (VYYY-xxx), Tên nàng thơ, Số điện thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#3d4a3e' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Filter size={15} color="#657566" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#657566', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lọc:</span>
                        {['ALL', 'CHO_THANH_TOAN', 'DA_THANH_TOAN', 'HOAN_THANH'].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    letterSpacing: '0.04em',
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

                {/* BẢNG ĐƠN HÀNG PHONG CÁCH BOUTIQUE KHÁCH HÀNG */}
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
                                <tr style={{ backgroundColor: 'rgba(91, 110, 93, 0.08)', borderBottom: '1px solid rgba(91, 110, 93, 0.15)', color: '#5b6e5d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    <th style={{ padding: '20px 24px' }}>Mã Đơn / Thời Gian</th>
                                    <th style={{ padding: '20px 24px' }}>Thông Tin Nàng Thơ</th>
                                    <th style={{ padding: '20px 24px' }}>Sản Phẩm Đã Chọn</th>
                                    <th style={{ padding: '20px 24px' }}>Phương Thức & Giá</th>
                                    <th style={{ padding: '20px 24px' }}>Trạng Thái Thống Kê</th>
                                    <th style={{ padding: '20px 24px', textAlign: 'center' }}>Hành Động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a395' }}>
                                            <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.4, color: '#5b6e5d' }} />
                                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', color: '#3d4a3e' }}>Chưa tìm thấy đơn hàng nào phù hợp</div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid rgba(91, 110, 93, 0.1)' }}>

                                            {/* Mã đơn */}
                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: '#3d4a3e', fontSize: '15px' }}>{order.id}</div>
                                                <div style={{ fontSize: '11px', color: '#94a395', marginTop: '6px' }}>
                                                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </td>

                                            {/* Thông tin khách */}
                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700, color: '#3d4a3e', fontSize: '14px' }}>{order.customerName}</div>
                                                <div style={{ fontSize: '12px', color: '#b87a5c', fontWeight: 700, marginTop: '2px' }}>{order.phone}</div>
                                                <div style={{ fontSize: '12px', color: '#657566', marginTop: '6px', maxWidth: '240px', lineHeight: '1.4' }}>
                                                    📍 {order.address}
                                                </div>
                                                {order.note && (
                                                    <div style={{ fontSize: '11px', color: '#b87a5c', fontStyle: 'italic', marginTop: '6px', backgroundColor: 'rgba(184, 122, 92, 0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                                                        📝 {order.note}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Sản phẩm */}
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

                                            {/* Tổng tiền */}
                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', fontWeight: 700, color: '#b87a5c' }}>
                                                    {order.totalPrice.toLocaleString('vi-VN')} đ
                                                </div>
                                                <div style={{ marginTop: '6px' }}>
                                                    {order.paymentMethod === 'VIETQR' ? (
                                                        <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(91, 110, 93, 0.15)', color: '#5b6e5d', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                                                            ⚡ VIETQR SEPAY
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(101, 117, 102, 0.15)', color: '#657566', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                                                            💵 THANH TOÁN COD
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Trạng thái */}
                                            <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                {order.status === 'DA_THANH_TOAN' ? (
                                                    <div>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(91, 110, 93, 0.2)', color: '#5b6e5d', padding: '6px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                                                            <ShieldCheck size={14} /> ĐÃ THANH TOÁN
                                                        </span>
                                                        {order.paidAt && (
                                                            <div style={{ fontSize: '10px', color: '#5b6e5d', marginTop: '6px' }}>
                                                                Khớp lúc: {new Date(order.paidAt).toLocaleTimeString('vi-VN')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : order.status === 'CHO_THANH_TOAN' ? (
                                                    <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#D97706', padding: '6px 12px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                                                        <Clock size={14} /> CHỜ CHUYỂN KHOẢN
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#fbf9f5', color: '#657566', padding: '6px 12px', borderRadius: '16px' }}>
                                                        {order.status}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Hành động */}
                                            <td style={{ padding: '20px 24px', verticalAlign: 'top', textAlign: 'center' }}>
                                                {order.status === 'CHO_THANH_TOAN' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'DA_THANH_TOAN')}
                                                        style={{ padding: '8px 14px', borderRadius: '12px', border: 'none', backgroundColor: '#5b6e5d', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}
                                                    >
                                                        Xác nhận đã nhận tiền
                                                    </button>
                                                )}
                                                {order.status === 'DA_THANH_TOAN' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'HOAN_THANH')}
                                                        style={{ padding: '8px 14px', borderRadius: '12px', border: '1px solid rgba(91, 110, 93, 0.3)', backgroundColor: '#fbf9f5', color: '#5b6e5d', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}
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
