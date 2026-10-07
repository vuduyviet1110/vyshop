// 1. IN-MEMORY RATE LIMITER (Chống DDoS & Brute-force Attack)
interface RateLimitStore {
    [ip: string]: {
        count: number;
        resetTime: number;
    };
}

const rateLimitStore: RateLimitStore = {};

// Tự động clear memory leak sau mỗi 10 phút
setInterval(() => {
    const now = Date.now();
    for (const ip in rateLimitStore) {
        if (rateLimitStore[ip].resetTime < now) {
            delete rateLimitStore[ip];
        }
    }
}, 10 * 60 * 1000);

/**
 * Kiểm tra giới hạn request theo IP
 * @param ip Client IP
 * @param limit Số lượng request tối đa (ví dụ: 10 lần)
 * @param windowMs Khoảng thời gian tính bằng ms (ví dụ: 60000ms = 1 phút)
 */
export function rateLimiter(ip: string, limit: number = 10, windowMs: number = 60000): { success: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = rateLimitStore[ip];

    if (!record || record.resetTime < now) {
        rateLimitStore[ip] = {
            count: 1,
            resetTime: now + windowMs,
        };
        return { success: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    if (record.count >= limit) {
        return { success: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count += 1;
    return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
}

// 2. ANTI-XSS SANITIZER (Lọc bỏ thẻ script, HTML độc hại từ input người dùng)
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

// 3. CSRF HEADER VERIFICATION
export function verifyCsrfOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (!origin) return true; // Cho phép Same-Origin GET/Post thông thường không gửi Origin

    try {
        const originHost = new URL(origin).host;
        return originHost === host;
    } catch {
        return false;
    }
}
