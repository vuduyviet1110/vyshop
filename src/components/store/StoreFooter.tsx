import React from 'react';
import Link from 'next/link';
import { POLICIES } from '../../lib/policies';
import { STORE_INFO } from '../../config/storeInfo';

const linkStyle: React.CSSProperties = { color: 'var(--text-secondary)', textDecoration: 'none' };

const POLICY_LINK_LABELS: Record<string, string> = {
  return: 'ĐỔI TRẢ',
  refund: 'HOÀN TIỀN',
  cancel: 'HỦY ĐƠN',
  shipping: 'VẬN CHUYỂN',
};

export function StoreFooter() {
  const { name, hotline, hotlineHref, hours, address, legal, facebookPage, zaloId } = STORE_INFO;

  return (
    <footer
      className="vyyy-footer"
      style={{
        flexShrink: 0,
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-sage)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px 24px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
      }}
    >
      <div className="footer-compact-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span className="vyyy-heading gold-gradient-text footer-brand-title" style={{ fontSize: '14px', fontWeight: 900 }}>{name}</span>
        <span className="footer-copyright-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          © 2026. ALL RIGHTS RESERVED.
          {legal && <> • {legal}</>}
        </span>
      </div>

      <div className="footer-extra-links" style={{ display: 'flex', gap: '8px 18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <a href={hotlineHref} style={{ ...linkStyle, fontWeight: 700 }} title={`Hotline ${hours}`}>
          HOTLINE {hotline}
        </a>
        {address && <span style={{ color: 'var(--text-muted)' }}>{address}</span>}
        {POLICIES.map((p) => (
          <Link key={p.id} href={`/chinh-sach#${p.id}`} style={linkStyle}>
            {POLICY_LINK_LABELS[p.id] ?? p.title.toUpperCase()}
          </Link>
        ))}
        {facebookPage && (
          <a href={`https://m.me/${encodeURIComponent(facebookPage)}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>MESSENGER</a>
        )}
        {zaloId && (
          <a href={`https://zalo.me/${encodeURIComponent(zaloId)}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>ZALO</a>
        )}
      </div>
    </footer>
  );
}
