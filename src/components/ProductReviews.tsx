'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
  mine: boolean;
}

interface ReviewsResponse {
  success: boolean;
  pagination: { page: number; hasNextPage: boolean };
  myReview: { id: string; rating: number; comment: string } | null;
  summary: { average: number; count: number; distribution: Record<number, number> };
  reviews: ReviewItem[];
}

export const StarIcon = ({ filled = true, size = 14 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z"
      fill={filled ? 'var(--accent-terracotta)' : 'none'}
      stroke="var(--accent-terracotta)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const Stars = ({ value, size }: { value: number; size?: number }) => (
  <span style={{ display: 'inline-flex', gap: '2px' }} aria-label={`${value} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <StarIcon key={n} filled={n <= Math.round(value)} size={size} />
    ))}
  </span>
);

const PAGE_SIZE = 5;

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '6px',
};

export const ProductReviews: React.FC<{ productId: string }> = ({ productId }) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const queryKey = ['reviews', productId];

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ReviewsResponse>({
    queryKey,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}&page=${pageParam}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('fetch reviews failed');
      return res.json();
    },
    getNextPageParam: (last) => (last.pagination.hasNextPage ? last.pagination.page + 1 : undefined),
  });

  const first = data?.pages[0];
  const summary = first?.summary;
  const reviews = data?.pages.flatMap((p) => p.reviews) ?? [];

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // làm mới cả danh sách đánh giá lẫn điểm sao trên thẻ sào / lưới catalogue
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const mine = first?.myReview ?? null;

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không gửi được đánh giá');
    },
    onSuccess: () => {
      setError(null);
      setRating(0);
      setComment('');
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không xoá được đánh giá');
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const startEdit = (r: { rating: number; comment: string }) => {
    setRating(r.rating);
    setComment(r.comment);
    setError(null);
  };


  return (
    <section style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-sage)' }}>
      <span className="vyyy-subheading" style={labelStyle}>
        ĐÁNH GIÁ TỪ NÀNG THƠ {summary ? `(${summary.count})` : ''}
      </span>

      {isLoading && (
        <div aria-hidden="true" style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
          <div className="skeleton" style={{ height: '46px' }} />
          <div className="skeleton" style={{ height: '12px', width: '90%' }} />
          <div className="skeleton" style={{ height: '12px', width: '65%' }} />
        </div>
      )}
      {isError && <p style={{ fontSize: '12px', color: 'var(--accent-terracotta)' }}>Không tải được đánh giá.</p>}

      {summary && summary.count > 0 && (
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {summary.average.toFixed(1)}
            </div>
            <Stars value={summary.average} size={12} />
          </div>
          <div style={{ flex: 1, display: 'grid', gap: '3px' }}>
            {[5, 4, 3, 2, 1].map((n) => {
              const c = summary.distribution[n] || 0;
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px' }}>{n}</span>
                  <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: 'rgba(91,110,93,0.12)', overflow: 'hidden' }}>
                    <div style={{ width: `${(c / summary.count) * 100}%`, height: '100%', background: 'var(--accent-terracotta)' }} />
                  </div>
                  <span style={{ width: '16px', textAlign: 'right' }}>{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FORM VIẾT / SỬA ĐÁNH GIÁ */}
      {session?.user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rating < 1) return setError('Vui lòng chọn số sao');
            if (comment.trim().length < 5) return setError('Nhận xét cần ít nhất 5 ký tự');
            save.mutate();
          }}
          style={{ marginBottom: '14px', padding: '12px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-sage)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {mine ? 'Cập nhật đánh giá của bạn' : 'Viết đánh giá'}
            </span>
            <span style={{ display: 'inline-flex', gap: '2px' }} onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} sao`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                >
                  <StarIcon filled={n <= (hover || rating)} size={20} />
                </button>
              ))}
            </span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Chất liệu, đường may, form dáng… chia sẻ cảm nhận của nàng nhé"
            style={{
              width: '100%',
              resize: 'vertical',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-sage)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'inherit',
            }}
          />
          {error && <p style={{ fontSize: '11px', color: 'var(--accent-terracotta)', margin: '6px 0 0' }}>{error}</p>}
          <button
            type="submit"
            disabled={save.isPending}
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-sage)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: save.isPending ? 'wait' : 'pointer',
              opacity: save.isPending ? 0.7 : 1,
            }}
          >
            {save.isPending ? 'ĐANG GỬI…' : mine ? 'LƯU THAY ĐỔI' : 'GỬI ĐÁNH GIÁ'}
          </button>
        </form>
      ) : (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          <Link href="/auth/login" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>Đăng nhập</Link> để viết đánh giá.
        </p>
      )}

      {/* DANH SÁCH */}
      {summary && summary.count === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chưa có đánh giá nào. Bóc tem thôi!</p>
      )}
      <div style={{ display: 'grid', gap: '12px' }}>
        {reviews.map((r) => (
          <article key={r.id} style={{ paddingBottom: '12px', borderBottom: '1px dashed var(--border-sage)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Stars value={r.rating} size={12} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.author}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {new Date(r.createdAt).toLocaleDateString('vi-VN')}
              </span>
              {r.mine && (
                <span style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => startEdit(r)} style={linkBtn}>Sửa</button>
                  <button type="button" onClick={() => remove.mutate(r.id)} style={linkBtn}>Xoá</button>
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {r.comment}
            </p>
          </article>
        ))}
      </div>

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '9px',
            borderRadius: '8px',
            border: '1px solid var(--border-sage)',
            background: 'transparent',
            color: 'var(--accent-sage)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: isFetchingNextPage ? 'wait' : 'pointer',
          }}
        >
          {isFetchingNextPage ? 'ĐANG TẢI…' : `XEM THÊM (${summary ? summary.count - reviews.length : ''} ĐÁNH GIÁ)`}
        </button>
      )}
    </section>
  );
};

const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--accent-terracotta)',
  cursor: 'pointer',
};
