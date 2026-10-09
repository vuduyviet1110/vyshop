import React, { useState, useLayoutEffect } from 'react';

const RACK_PALETTE = [
  { hue: 0, sat: 0.9, bri: 1.0 },     // xanh cobalt gốc
  { hue: 28, sat: 0.62, bri: 1.06 },  // xanh tím nhạt
  { hue: 300, sat: 0.34, bri: 1.14 }, // hồng phấn
  { hue: 318, sat: 0.5, bri: 1.0 },   // đỏ đô
  { hue: 205, sat: 0.3, bri: 1.12 },  // be kem
  { hue: 95, sat: 0.42, bri: 0.98 },  // xanh rêu
  { hue: 332, sat: 0.26, bri: 1.16 }, // nude
  { hue: 250, sat: 0.3, bri: 1.05 },  // tím khói
  { hue: 150, sat: 0.36, bri: 1.02 }, // xanh ngọc trầm
  { hue: 345, sat: 0.72, bri: 0.94 }, // đỏ rượu
];

// Mỗi chiếc lệch màu/góc một chút -> dàn áo trông như hàng thật, không phải 30 bản sao.
export const garmentLook = (id: string, index: number) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }

  // lệch pha palette để hai chiếc kề nhau không trùng tông
  const p = RACK_PALETTE[(index * 3 + Math.floor(index / RACK_PALETTE.length)) % RACK_PALETTE.length];

  return {
    hue: (p.hue + (h % 9) - 4).toFixed(0),
    sat: (p.sat + ((h >>> 8) % 12) / 100).toFixed(2),
    bri: (p.bri + ((h >>> 16) % 8) / 100 - 0.04).toFixed(2),
    tilt: (((h >>> 4) % 25) / 10 - 1.2).toFixed(1)
  };
};

// Mắc gỗ + móc dây thép: vai mắc nằm ẩn sau áo, chỉ lộ cổ mắc và móc vắt qua đỉnh sào.
// viewBox 100x46; tâm sào nằm ở y=10 (CSS căn theo con số này).
export const HangerSvg = ({ uid }: { uid: string }) => (
  <svg className="hanger-svg" viewBox="0 0 100 46" aria-hidden="true">
    <defs>
      <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f0d3b2" />
        <stop offset="0.55" stopColor="#d2a074" />
        <stop offset="1" stopColor="#a8754d" />
      </linearGradient>
    </defs>
    {/* hai tay mắc dốc xuống như mắc thật */}
    <path d="M50 28 L11 43" stroke={`url(#wood-${uid})`} strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M50 28 L89 43" stroke={`url(#wood-${uid})`} strokeWidth="5" strokeLinecap="round" fill="none" />
    {/* cổ mắc */}
    <rect x="46.5" y="21" width="7" height="9" rx="2" fill={`url(#wood-${uid})`} />
    {/* móc thép: thân đi lên đè trước sào, uốn vòng qua đỉnh sào rồi rủ xuống phía sau (bị sào che) */}
    <path d="M50 28 V12 C50 3 52 -0.5 55.5 -0.5 C59 -0.5 60.5 1.5 60.5 3.5" stroke="#5d6368" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    <path d="M50 28 V12 C50 3 52 -0.5 55.5 -0.5 C59 -0.5 60.5 1.5 60.5 3.5" stroke="#d9dde1" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

// Giãn cách thông minh: ít áo thì dàn đều hết chiều dài sào, nhiều áo thì chồng lấn
// tới mức tối thiểu rồi mới cuộn ngang.
export const SKELETON_RACK_COUNT = 10;
const MIN_PITCH = 58;
const MAX_PITCH = 240;
export function useRackPitch(
  ref: React.RefObject<HTMLDivElement | null>,
  count: number,
  active: boolean
) {
  const [pitch, setPitch] = useState(MIN_PITCH + 20);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el || count === 0) return;

    const measure = () => {
      const cs = getComputedStyle(el);
      const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const next = Math.min(MAX_PITCH, Math.max(MIN_PITCH, avail / count));
      setPitch((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, count, active]);

  return pitch;
}
