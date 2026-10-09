'use client';

import React from 'react';

// Mở thẳng cuộc trò chuyện với shop trên Messenger / Zalo. Chỉ là link nên không cần SDK;
// kênh nào chưa cấu hình biến môi trường thì không hiện.
const FACEBOOK_PAGE = process.env.NEXT_PUBLIC_FACEBOOK_PAGE?.trim();
const ZALO_ID = process.env.NEXT_PUBLIC_ZALO_ID?.trim();

const buttonStyle = (bg: string): React.CSSProperties => ({
  width: '46px',
  height: '46px',
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.22)',
  transition: 'transform 0.2s ease',
});

export const ContactDock: React.FC = () => {
  if (!FACEBOOK_PAGE && !ZALO_ID) return null;

  return (
    <div
      className="contact-dock"
      style={{ position: 'fixed', left: '20px', bottom: '80px', zIndex: 9990, display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      {FACEBOOK_PAGE && (
        <a
          href={`https://m.me/${encodeURIComponent(FACEBOOK_PAGE)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Nhắn tin qua Messenger"
          aria-label="Chat với Vyyy Boutique qua Messenger"
          style={buttonStyle('linear-gradient(135deg, #00b2ff, #006aff 55%, #a334fa)')}
          className="contact-dock-btn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#fff"
              d="M12 2C6.4 2 2 6.2 2 11.6c0 2.9 1.3 5.5 3.4 7.2V22l3.1-1.7c.8.2 1.6.3 2.5.3 5.6 0 10-4.2 10-9.6S17.6 2 12 2zm1 12.9-2.5-2.6-4.9 2.7 5.4-5.7 2.6 2.6 4.8-2.7-5.4 5.7z"
            />
          </svg>
        </a>
      )}
      {ZALO_ID && (
        <a
          href={`https://zalo.me/${encodeURIComponent(ZALO_ID)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Nhắn tin qua Zalo"
          aria-label="Chat với Vyyy Boutique qua Zalo"
          style={buttonStyle('#0068ff')}
          className="contact-dock-btn"
        >
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '13px', letterSpacing: '-0.02em', fontFamily: 'Arial, sans-serif' }}>Zalo</span>
        </a>
      )}
    </div>
  );
};
