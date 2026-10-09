'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Crown,
    ShoppingBag,
    Sparkles,
    Gem,
    Hourglass,
    Search,
    RotateCw,
    ShieldCheck,
    ArrowLeft,
    Package,
    Shirt,
    Pin
} from 'lucide-react';
import { formatVND } from '@/lib/format';



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
    const [activeTab, setActiveTab] = useState<'ORDERS' | 'PRODUCTS' | 'RACKS'>('ORDERS');

    // Admin Products & Racks State
    const [racks, setRacks] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [savingProductRackId, setSavingProductRackId] = useState<string | null>(null);

    // New Rack Form State
    const [newRackId, setNewRackId] = useState('');
    const [newRackTitle, setNewRackTitle] = useState('');
    const [newRackSubtitle, setNewRackSubtitle] = useState('');
    const [creatingRack, setCreatingRack] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchAdminProducts = async () => {
        try {
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            if (data.success) {
                setRacks(data.racks);
                setProducts(data.products);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách sản phẩm quản trị:', err);
        }
    };

    const handleAssignRack = async (productId: string, newRackId: string) => {
        setSavingProductRackId(productId);
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, rackId: newRackId === 'NONE' ? null : newRackId })
            });
            const data = await res.json();
            if (data.success) {
                fetchAdminProducts();
            }
        } catch (err) {
            console.error('Lỗi gắn dàn sào:', err);
        } finally {
            setSavingProductRackId(null);
        }
    };

    const handleCreateRack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRackId || !newRackTitle) return;
        setCreatingRack(true);
        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newRackId,
                    title: newRackTitle,
                    subtitle: newRackSubtitle || 'BST Mới'
                })
            });
            const data = await res.json();
            if (data.success) {
                setNewRackId('');
                setNewRackTitle('');
                setNewRackSubtitle('');
                fetchAdminProducts();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error('Lỗi tạo dàn sào:', err);
        } finally {
            setCreatingRack(false);
        }
    };

    const handleDeleteRack = async (rackId: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa Dàn sào "${rackId}"? Tất cả sản phẩm thuộc dàn sào này sẽ tự động về trạng thái "Chưa gắn sào".`)) return;
        try {
            const res = await fetch(`/api/admin/products?rackId=${rackId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchAdminProducts();
            }
        } catch (err) {
            console.error('Lỗi xóa dàn sào:', err);
        }
    };

    // Editing Rack State
    const [editingRackId, setEditingRackId] = useState<string | null>(null);
    const [editRackTitle, setEditRackTitle] = useState('');
    const [editRackSubtitle, setEditRackSubtitle] = useState('');
    const [updatingRack, setUpdatingRack] = useState(false);

    const handleUpdateRack = async (rackId: string) => {
        if (!editRackTitle.trim()) return;
        setUpdatingRack(true);
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rackId,
                    title: editRackTitle,
                    subtitle: editRackSubtitle
                })
            });
            const data = await res.json();
            if (data.success) {
                setEditingRackId(null);
                fetchAdminProducts();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error('Lỗi cập nhật Dàn sào:', err);
        } finally {
            setUpdatingRack(false);
        }
    };

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
        fetchAdminProducts();
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
        <div suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#fbf9f5', color: '#3d4a3e', fontFamily: "var(--font-body), 'Be Vietnam Pro', sans-serif" }}>

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
                        <ArrowLeft size={14} /> VỀ CỬA HÀNG
                    </Link>

                    <div style={{ height: '28px', width: '1px', backgroundColor: 'rgba(91, 110, 93, 0.2)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "var(--font-body), 'Be Vietnam Pro', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '0.14em', color: '#3d4a3e' }}>
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
                            <Sparkles size={14} /> QUẢN TRỊ VIÊN
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
                            fontWeight: 700,
                            color: '#3d4a3e'
                        }}
                    >
                        <RotateCw size={14} className={loading ? 'animate-spin' : ''} /> LÀM MỚI DỮ LIỆU
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
                            fontWeight: 700,
                            boxShadow: '0 6px 18px rgba(91, 110, 93, 0.28)'
                        }}
                    >
                        <Crown size={15} /> MỞ SEPAY
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
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#657566' }}>
                                Doanh thu thực nhận
                            </span>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(91, 110, 93, 0.15)', color: '#5b6e5d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Gem size={22} />
                            </div>
                        </div>
                        <div style={{ fontSize: '30px', fontWeight: 700, color: '#3d4a3e', marginTop: '14px' }}>
                            {formatVND(stats.totalRevenue)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#5b6e5d', marginTop: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={12} style={{ color: '#b87a5c' }} /> Tự động khớp VietQR SePay
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
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#657566' }}>
                                Đơn đã thanh toán
                            </span>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(184, 122, 92, 0.15)', color: '#b87a5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShoppingBag size={22} />
                            </div>
                        </div>
                        <div style={{ fontSize: '30px', fontWeight: 700, color: '#3d4a3e', marginTop: '14px' }}>
                            {stats.paidOrders} <span style={{ fontSize: '16px', fontWeight: 500, color: '#657566' }}>/ {stats.totalOrders} đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#b87a5c', marginTop: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={12} /> Sẵn sàng xuất kho & đóng gói
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
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#657566' }}>
                                Đơn chờ tiền về
                            </span>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Hourglass size={22} />
                            </div>
                        </div>
                        <div style={{ fontSize: '30px', fontWeight: 700, color: '#D97706', marginTop: '14px' }}>
                            {stats.pendingOrders} <span style={{ fontSize: '16px', fontWeight: 500, color: '#657566' }}>đơn</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#D97706', marginTop: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Hourglass size={12} /> Đang lắng nghe Webhook Ngân hàng
                        </div>
                    </div>

                </div>

                {/* TAB SWITCHER */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid rgba(91, 110, 93, 0.2)', paddingBottom: '12px' }}>
                    <button
                        onClick={() => setActiveTab('ORDERS')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '30px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'ORDERS' ? '#5b6e5d' : 'transparent',
                            color: activeTab === 'ORDERS' ? '#ffffff' : '#657566',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.25s ease'
                        }}
                    >
                        <Package size={16} /> Quản lý đơn hàng ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('PRODUCTS')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '30px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'PRODUCTS' ? '#5b6e5d' : 'transparent',
                            color: activeTab === 'PRODUCTS' ? '#ffffff' : '#657566',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.25s ease'
                        }}
                    >
                        <Shirt size={16} /> Gắn sản phẩm vào dàn sào ({products.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('RACKS')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '30px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'RACKS' ? '#5b6e5d' : 'transparent',
                            color: activeTab === 'RACKS' ? '#ffffff' : '#657566',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.25s ease'
                        }}
                    >
                        <Pin size={16} /> Quản lý Dàn sào / Bộ sưu tập ({racks.length})
                    </button>
                </div>

                {activeTab === 'ORDERS' && (
                    <>
                        {/* SEARCH & FILTER FOR ORDERS */}
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
                                <Search size={18} color="#657566" />
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
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            backgroundColor: statusFilter === st ? '#5b6e5d' : 'transparent',
                                            color: statusFilter === st ? '#ffffff' : '#657566'
                                        }}
                                    >
                                        {st === 'ALL' ? 'Tất cả' : st === 'CHO_THANH_TOAN' ? 'Chờ tiền' : st === 'DA_THANH_TOAN' ? 'Đã tiền' : 'Hoàn thành'}
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
                                        <tr style={{ backgroundColor: 'rgba(91, 110, 93, 0.08)', borderBottom: '1px solid rgba(91, 110, 93, 0.18)', color: '#5b6e5d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                            <th style={{ padding: '20px 24px' }}>Mã Đơn</th>
                                            <th style={{ padding: '20px 24px' }}>Thông Tin Khách</th>
                                            <th style={{ padding: '20px 24px' }}>Sản Phẩm Đặt Mua</th>
                                            <th style={{ padding: '20px 24px' }}>Phương Thức & Tiền</th>
                                            <th style={{ padding: '20px 24px' }}>Trạng Thái</th>
                                            <th style={{ padding: '20px 24px' }}>Hành Động Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a395' }}>
                                                    <div style={{ fontFamily: "var(--font-body), 'Be Vietnam Pro', sans-serif", fontSize: '16px', color: '#3d4a3e' }}>Chưa tìm thấy đơn hàng nào</div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <tr key={order.id} style={{ borderBottom: '1px solid rgba(91, 110, 93, 0.1)' }}>

                                                    <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                        <div style={{ fontFamily: "var(--font-body), 'Be Vietnam Pro', sans-serif", fontWeight: 700, color: '#3d4a3e', fontSize: '15px' }}>{order.id}</div>
                                                        <div style={{ fontSize: '11px', color: '#94a395', marginTop: '6px' }}>
                                                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                        <div style={{ fontWeight: 800, color: '#3d4a3e', fontSize: '14px' }}>{order.customerName}</div>
                                                        <div style={{ fontSize: '12px', color: '#b87a5c', fontWeight: 700, marginTop: '2px' }}>{order.phone}</div>
                                                        <div style={{ fontSize: '11px', color: '#657566', marginTop: '4px', maxWidth: '200px' }}>{order.address}</div>
                                                        {order.note && (
                                                            <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#8c766b', marginTop: '4px' }}>
                                                                " {order.note} "
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <img src={item.image} alt={item.productName} style={{ width: '36px', height: '46px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(91, 110, 93, 0.2)' }} />
                                                                    <div>
                                                                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#3d4a3e' }}>{item.productName}</div>
                                                                        <div style={{ fontSize: '10px', color: '#657566' }}>
                                                                            Size: <strong>{item.size}</strong> • Màu: <strong>{item.color}</strong> • x{item.quantity}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                        <div style={{ fontFamily: "var(--font-body), 'Be Vietnam Pro', sans-serif", fontSize: '16px', fontWeight: 700, color: '#b87a5c' }}>
                                                            {formatVND(order.totalPrice)}
                                                        </div>
                                                        <div style={{ marginTop: '6px' }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(91, 110, 93, 0.12)', color: '#5b6e5d' }}>
                                                                {order.paymentMethod === 'VIETQR' ? 'VIETQR SEPAY' : order.paymentMethod}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                        {order.status === 'CHO_THANH_TOAN' && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 800 }}>
                                                                <Hourglass size={12} /> CHỜ CHUYỂN KHOẢN
                                                            </span>
                                                        )}
                                                        {order.status === 'DA_THANH_TOAN' && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 800 }}>
                                                                <ShieldCheck size={12} /> ĐÃ THANH TOÁN
                                                            </span>
                                                        )}
                                                        {order.status === 'HOAN_THANH' && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 800 }}>
                                                                ✓ HOÀN THÀNH
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td style={{ padding: '20px 24px', verticalAlign: 'top' }}>
                                                        {order.status === 'CHO_THANH_TOAN' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'DA_THANH_TOAN')}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    borderRadius: '20px',
                                                                    border: 'none',
                                                                    backgroundColor: '#5b6e5d',
                                                                    color: '#ffffff',
                                                                    fontSize: '11px',
                                                                    fontWeight: 800,
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 4px 12px rgba(91, 110, 93, 0.25)'
                                                                }}
                                                            >
                                                                Xác nhận đã nhận tiền
                                                            </button>
                                                        )}
                                                        {order.status === 'DA_THANH_TOAN' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(order.id, 'HOAN_THANH')}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    borderRadius: '20px',
                                                                    border: '1px solid rgba(91, 110, 93, 0.3)',
                                                                    backgroundColor: '#f3efe6',
                                                                    color: '#3d4a3e',
                                                                    fontSize: '11px',
                                                                    fontWeight: 800,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Đánh dấu Hoàn thành
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
                    </>
                )}

                {activeTab === 'PRODUCTS' && (
                    <div style={{
                        backgroundColor: '#f3efe6',
                        borderRadius: '24px',
                        border: '1px solid rgba(91, 110, 93, 0.2)',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                    }}>
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(91, 110, 93, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#3d4a3e', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shirt size={20} color="#5b6e5d" /> GẮN SẢN PHẨM VÀO BỘ SƯU TẬP
                                </h3>
                                <p style={{ fontSize: '12px', color: '#657566', marginTop: '4px', margin: 0 }}>
                                    Chọn Dàn sào muốn treo sản phẩm. Nếu chọn "Chưa gắn sào", sản phẩm sẽ không hiển thị trên các Dàn sào 3D ở trang chủ!
                                </p>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'rgba(91, 110, 93, 0.08)', borderBottom: '1px solid rgba(91, 110, 93, 0.18)', color: '#5b6e5d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                        <th style={{ padding: '18px 24px' }}>Hình Ảnh</th>
                                        <th style={{ padding: '18px 24px' }}>Tên Sản Phẩm</th>
                                        <th style={{ padding: '18px 24px' }}>Danh Mục</th>
                                        <th style={{ padding: '18px 24px' }}>Giá Bán</th>
                                        <th style={{ padding: '18px 24px' }}>Dàn Sào Hiện Tại (Treo 3D)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '50px', color: '#94a395' }}>
                                                Chưa có dữ liệu sản phẩm trong Database
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.id} style={{ borderBottom: '1px solid rgba(91, 110, 93, 0.1)' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <img src={product.image} alt={product.name} style={{ width: '44px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(91, 110, 93, 0.2)' }} />
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontWeight: 800, color: '#3d4a3e', fontSize: '14px' }}>{product.name}</div>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: 'rgba(184, 122, 92, 0.15)', color: '#b87a5c', padding: '3px 8px', borderRadius: '10px' }}>
                                                        {product.tag}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', color: '#657566', fontWeight: 600 }}>
                                                    {product.category}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontFamily: "var(--font-body), 'Be Vietnam Pro', sans-serif", fontWeight: 700, color: '#b87a5c' }}>
                                                    {formatVND(product.price)}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <select
                                                        value={product.rackId || 'NONE'}
                                                        disabled={savingProductRackId === product.id}
                                                        onChange={(e) => handleAssignRack(product.id, e.target.value)}
                                                        style={{
                                                            padding: '8px 14px',
                                                            borderRadius: '12px',
                                                            border: '1px solid rgba(91, 110, 93, 0.3)',
                                                            backgroundColor: product.rackId ? '#fbf9f5' : '#fff1f2',
                                                            color: product.rackId ? '#3d4a3e' : '#be123c',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <option value="NONE">-- Chưa gắn Dàn sào --</option>
                                                        {racks.map((r) => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.title} ({r.id})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {savingProductRackId === product.id && (
                                                        <span style={{ fontSize: '11px', color: '#5b6e5d', marginLeft: '8px', fontWeight: 700 }}>
                                                            Đang lưu...
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'RACKS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {/* FORM TẠO RACK MỚI */}
                        <div style={{
                            backgroundColor: '#f3efe6',
                            borderRadius: '24px',
                            border: '1px solid rgba(91, 110, 93, 0.2)',
                            padding: '28px',
                            boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#3d4a3e', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Pin size={20} color="#b87a5c" /> THÊM DÀN SÀO / BỘ SƯU TẬP MỚI
                            </h3>
                            <form onSubmit={handleCreateRack} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#657566', display: 'block', marginBottom: '6px' }}>MÃ DÀN SÀO (RACK ID)</label>
                                    <input
                                        type="text"
                                        placeholder="Vd: rack-3, bst-xuan-2026..."
                                        value={newRackId}
                                        onChange={(e) => setNewRackId(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(91, 110, 93, 0.3)', backgroundColor: '#fbf9f5', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#657566', display: 'block', marginBottom: '6px' }}>TÊN BỘ SƯU TẬP</label>
                                    <input
                                        type="text"
                                        placeholder="Vd: Áo Dài Nàng Thơ..."
                                        value={newRackTitle}
                                        onChange={(e) => setNewRackTitle(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(91, 110, 93, 0.3)', backgroundColor: '#fbf9f5', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#657566', display: 'block', marginBottom: '6px' }}>TÊU ĐỀ PHỤ / SUBTITLE</label>
                                    <input
                                        type="text"
                                        placeholder="Vd: Bộ Sưu Tập Áo Dài Thêu Tay..."
                                        value={newRackSubtitle}
                                        onChange={(e) => setNewRackSubtitle(e.target.value)}
                                        style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(91, 110, 93, 0.3)', backgroundColor: '#fbf9f5', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={creatingRack}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#5b6e5d',
                                        color: '#ffffff',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(91, 110, 93, 0.25)'
                                    }}
                                >
                                    {creatingRack ? 'Đang tạo...' : '+ TẠO DÀN SÀO'}
                                </button>
                            </form>
                        </div>

                        {/* DANH SÁCH RACKS HIỆN CÓ */}
                        <div style={{
                            backgroundColor: '#f3efe6',
                            borderRadius: '24px',
                            border: '1px solid rgba(91, 110, 93, 0.2)',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(61, 74, 62, 0.04)'
                        }}>
                            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(91, 110, 93, 0.15)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#3d4a3e', margin: 0 }}>
                                    DANH SÁCH DÀN SÀO (BỘ SƯU TẬP 3D) HIỆN CÓ
                                </h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'rgba(91, 110, 93, 0.08)', borderBottom: '1px solid rgba(91, 110, 93, 0.18)', color: '#5b6e5d', fontSize: '11px', textTransform: 'uppercase' }}>
                                            <th style={{ padding: '18px 24px' }}>Rack ID</th>
                                            <th style={{ padding: '18px 24px' }}>Tên Bộ Sưu Tập</th>
                                            <th style={{ padding: '18px 24px' }}>Mô Tả Phụ</th>
                                            <th style={{ padding: '18px 24px' }}>Số Sản Phẩm Treo</th>
                                            <th style={{ padding: '18px 24px' }}>Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {racks.map((r) => {
                                            const count = products.filter(p => p.rackId === r.id).length;
                                            const isEditing = editingRackId === r.id;

                                            return (
                                                <tr key={r.id} style={{ borderBottom: '1px solid rgba(91, 110, 93, 0.1)' }}>
                                                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#b87a5c' }}>{r.id}</td>
                                                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#3d4a3e' }}>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editRackTitle}
                                                                onChange={(e) => setEditRackTitle(e.target.value)}
                                                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #5b6e5d', fontSize: '13px', width: '100%', outline: 'none' }}
                                                            />
                                                        ) : r.title}
                                                    </td>
                                                    <td style={{ padding: '16px 24px', color: '#657566' }}>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editRackSubtitle}
                                                                onChange={(e) => setEditRackSubtitle(e.target.value)}
                                                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #5b6e5d', fontSize: '13px', width: '100%', outline: 'none' }}
                                                            />
                                                        ) : r.subtitle}
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(91, 110, 93, 0.15)', color: '#5b6e5d', fontWeight: 800, fontSize: '11px' }}>
                                                            {count} sản phẩm
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        {isEditing ? (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    disabled={updatingRack}
                                                                    onClick={() => handleUpdateRack(r.id)}
                                                                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#5b6e5d', color: '#fff', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                                                                >
                                                                    {updatingRack ? 'Đang lưu...' : 'Lưu Sửa'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingRackId(null)}
                                                                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(91,110,93,0.3)', backgroundColor: '#fff', color: '#657566', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingRackId(r.id);
                                                                        setEditRackTitle(r.title);
                                                                        setEditRackSubtitle(r.subtitle || '');
                                                                    }}
                                                                    style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(91, 110, 93, 0.3)', backgroundColor: '#f3efe6', color: '#3d4a3e', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                                                                >
                                                                    Sửa Tiêu Đề
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRack(r.id)}
                                                                    style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#fecdd3', color: '#be123c', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </main>

        </div>
    );
}
