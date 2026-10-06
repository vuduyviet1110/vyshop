'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, CheckCircle2, Clock, RefreshCw, Search, ArrowLeft, ExternalLink, ShieldCheck, Filter } from 'lucide-react';
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
        // Tự động làm mới dữ liệu đơn hàng mỗi 8 giây (Realtime Auto-polling)
        const interval = setInterval(fetchOrders, 8000);
        return () => clearInterval(interval);
    }, []);

    // Cập nhật trạng thái đơn hàng thủ công từ Admin
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

    // Lọc đơn hàng theo từ khóa tìm kiếm & Tab trạng thái
    const filteredOrders = orders.filter(o => {
        const matchesQuery = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.phone.includes(searchQuery);
        const matchesFilter = statusFilter === 'ALL' || o.status === statusFilter;
        return matchesQuery && matchesFilter;
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', color: '#2C352E', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* HEADER DASHBOARD */}
            <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5B6E5D', textDecoration: 'none', fontSize: '13px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F1F5F9' }}>
                        <ArrowLeft size={16} /> Quay lại cửa hàng
                    </Link>
                    <div style={{ height: '24px', width: '1px', backgroundColor: '#CBD5E1' }} />
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
                        VYYY BOUTIQUE <span style={{ fontSize: '12px', fontWeight: 600, color: '#B87A5C', backgroundColor: 'rgba(184, 122, 92, 0.1)', padding: '2px 8px', borderRadius: '6px', marginLeft: '6px' }}>ADMIN DASHBOARD</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={fetchOrders}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>
                    <a
                        href="https://my.sepay.vn"
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', backgroundColor: '#0052FF', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}
                    >
                        <ExternalLink size={14} /> Mở SePay Dashboard
                    </a>
                </div>
            </header>

            {/* CONTAINER NỘI DUNG MAIN */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>

                {/* STATS CARDS (THỐNG KÊ DOANH THU & ĐƠN HÀNG) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>

                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TỔNG DOANH THU THỰC NHẬN</span>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarSign size={22} />
                            </div>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginTop: '12px' }}>
                            {stats.totalRevenue.toLocaleString('vi-VN')} đ
                        </div>
                        <div style={{ fontSize: '12px', color: '#10B981', marginTop: '6px', fontWeight: 600 }}>
                            ✓ Khớp tiền tự động VietQR SePay & Tiền mặt
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ĐƠN ĐÃ THANH TOÁN</span>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={22} />
                            </div>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginTop: '12px' }}>
                            {stats.paidOrders} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>/ {stats.totalOrders} đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#3B82F6', marginTop: '6px', fontWeight: 600 }}>
                            ⚡ Đã kích hoạt giao hàng
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ĐƠN CHỜ THANH TOÁN</span>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={22} />
                            </div>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#D97706', marginTop: '12px' }}>
                            {stats.pendingOrders} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '6px', fontWeight: 600 }}>
                            ⏳ Đang lắng nghe Webhook ngân hàng
                        </div>
                    </div>

                </div>

                {/* CÔNG CỤ TÌM KIẾM & BỘ LỌC ĐƠN HÀNG */}
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', backgroundColor: '#F8FAFC', padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <Search size={18} color="#94A3B8" />
                        <input
                            type="text"
                            placeholder="Tìm theo Mã đơn (VYYY-xxx), Tên khách, Số điện thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={16} color="#64748B" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Trạng thái:</span>
                        {['ALL', 'CHO_THANH_TOAN', 'DA_THANH_TOAN', 'HOAN_THANH'].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    backgroundColor: statusFilter === st ? '#5B6E5D' : '#F1F5F9',
                                    color: statusFilter === st ? '#ffffff' : '#475569'
                                }}
                            >
                                {st === 'ALL' ? 'Tất cả' : st === 'CHO_THANH_TOAN' ? 'Chờ thanh toán' : st === 'DA_THANH_TOAN' ? 'Đã thanh toán' : 'Hoàn thành'}
                            </button>
                        ))}
                    </div>

                </div>

                {/* BẢNG DANH SÁCH ĐƠN HÀNG (ORDER TABLE) */}
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '16px 20px' }}>Mã Đơn / Thời Gian</th>
                                    <th style={{ padding: '16px 20px' }}>Thông Tin Khách Hàng</th>
                                    <th style={{ padding: '16px 20px' }}>Sản Phẩm Đặt Mua</th>
                                    <th style={{ padding: '16px 20px' }}>Phương Thức & Tổng Tiền</th>
                                    <th style={{ padding: '16px 20px' }}>Trạng Thái Thống Kê</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Hành Động Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                                            <ShoppingBag size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                            Chưa tìm thấy đơn hàng nào phù hợp
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}>

                                            {/* Mã đơn */}
                                            <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>{order.id}</div>
                                                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                                                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </td>

                                            {/* Thông tin khách hàng */}
                                            <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700, color: '#1E293B' }}>{order.customerName}</div>
                                                <div style={{ fontSize: '12px', color: '#0052FF', fontWeight: 600, marginTop: '2px' }}>{order.phone}</div>
                                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', maxWidth: '220px', lineHeight: '1.4' }}>
                                                    📍 {order.address}
                                                </div>
                                                {order.note && (
                                                    <div style={{ fontSize: '11px', color: '#D97706', fontStyle: 'italic', marginTop: '4px' }}>
                                                        📝 Note: {order.note}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Danh sách sản phẩm */}
                                            <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                        <img src={item.image} alt={item.productName} style={{ width: '36px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '12px', color: '#334155' }}>{item.productName}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                                                                Size: <strong>{item.size}</strong> • Màu: <strong>{item.color}</strong> • x{item.quantity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </td>

                                            {/* Phương thức & Tổng tiền */}
                                            <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                                <div style={{ fontSize: '15px', fontWeight: 900, color: '#B87A5C' }}>
                                                    {order.totalPrice.toLocaleString('vi-VN')} đ
                                                </div>
                                                <div style={{ marginTop: '4px' }}>
                                                    {order.paymentMethod === 'VIETQR' ? (
                                                        <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(0, 82, 255, 0.1)', color: '#0052FF', padding: '3px 8px', borderRadius: '6px' }}>
                                                            ⚡ Chuyển khoản VietQR SePay
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
                                                            💵 Thanh toán COD
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Trạng thái đơn */}
                                            <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                                {order.status === 'DA_THANH_TOAN' ? (
                                                    <div>
                                                        <span style={{ fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <ShieldCheck size={14} /> ĐÃ THANH TOÁN
                                                        </span>
                                                        {order.paidAt && (
                                                            <div style={{ fontSize: '10px', color: '#10B981', marginTop: '4px' }}>
                                                                Khớp Webhook lúc: {new Date(order.paidAt).toLocaleTimeString('vi-VN')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : order.status === 'CHO_THANH_TOAN' ? (
                                                    <span style={{ fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#D97706', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={14} /> CHỜ CHUYỂN KHOẢN
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '12px', fontWeight: 800, backgroundColor: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '8px' }}>
                                                        {order.status}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Nút hành động */}
                                            <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'center' }}>
                                                {order.status === 'CHO_THANH_TOAN' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'DA_THANH_TOAN')}
                                                        style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#10B981', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        Xác nhận đã nhận tiền
                                                    </button>
                                                )}
                                                {order.status === 'DA_THANH_TOAN' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'HOAN_THANH')}
                                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#fff', color: '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        Hoàn thành đơn ➔
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
