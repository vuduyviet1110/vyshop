import Link from 'next/link';
import type { Metadata } from 'next';
import { POLICIES } from '../../lib/policies';
import { STORE_INFO } from '../../config/storeInfo';

export const metadata: Metadata = {
    title: 'Chính sách mua hàng - Vyyy Boutique',
    description: 'Chính sách đổi trả, hoàn tiền, hủy đơn và vận chuyển của Vyyy Boutique.',
};

export default function PolicyPage() {
    return (
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 80px', color: 'var(--text-primary)', background: 'var(--bg-main)', minHeight: '100vh' }}>
            {/* HEADER AREA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '1px solid var(--border-sage)', paddingBottom: '20px' }}>
                <div>
                    <Link href="/" style={{ color: 'var(--accent-sage)', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        ← VỀ CỬA HÀNG
                    </Link>
                    <h1 className="vyyy-heading gold-gradient-text" style={{ fontSize: '32px', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>Chính sách mua hàng & Quyền lợi</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        Hỗ trợ nhanh qua Hotline <a href={STORE_INFO.hotlineHref} style={{ color: 'var(--accent-terracotta)', fontWeight: 700, textDecoration: 'none' }}>{STORE_INFO.hotline}</a> ({STORE_INFO.hours})
                    </p>
                </div>

                {/* QUICK NAV PILLS */}
                <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {POLICIES.map((p) => (
                        <a
                            key={p.id}
                            href={`#${p.id}`}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: '1px solid var(--border-sage)',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--accent-sage)',
                                textDecoration: 'none',
                                background: 'rgba(255, 255, 255, 0.6)',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {p.title}
                        </a>
                    ))}
                </nav>
            </div>

            {/* MAIN CONTENT GRID - TẬN DỤNG KHOẢNG TRỐNG 2 BÊN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {POLICIES.map((section) => (
                    <section key={section.id} id={section.id} style={{ scrollMarginTop: '24px' }}>
                        {/* SECTION HEADER */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                {section.title}
                            </h2>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '14px', background: 'rgba(91,110,93,0.12)', color: 'var(--accent-sage)', border: '1px solid rgba(91,110,93,0.2)' }}>
                                {section.badge}
                            </span>
                        </div>

                        {/* CARDS GRID (1 cột ở màn bé, 2 cột ở màn lớn) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                            gap: '20px'
                        }}>
                            {section.items.map((item) => (
                                <div
                                    key={item.title}
                                    style={{
                                        padding: '22px 24px',
                                        borderRadius: '16px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-sage)',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                    }}
                                >
                                    <div>
                                        <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '10px', color: 'var(--accent-sage)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-terracotta)' }}></span>
                                            {item.title}
                                        </h3>
                                        {item.content && (
                                            <p style={{ fontSize: '13px', lineHeight: 1.7, margin: 0, color: 'var(--text-primary)' }}>
                                                {item.content}
                                            </p>
                                        )}
                                    </div>

                                    {item.bullets && (
                                        <ul style={{ margin: '12px 0 0', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                            {item.bullets.map((b) => <li key={b} style={{ marginBottom: '4px' }}>{b}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}
