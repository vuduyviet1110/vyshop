import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { rateLimiter, verifyCsrfOrigin } from '@/lib/security';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

    // 1. CHỐNG DDOS & BRUTE-FORCE RATE LIMITING CHO XÁC THỰC (Bỏ qua GET /api/auth/session để tránh ClientFetchError khi reload/prefetch)
    if ((pathname.startsWith('/api/auth') || pathname.startsWith('/api/register')) && request.method === 'POST') {
        const limitResult = rateLimiter(ip, 15, 60 * 1000); // Tối đa 15 request POST auth/phút
        if (!limitResult.success) {
            return new NextResponse(
                JSON.stringify({ error: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau 1 phút!' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60',
                    },
                }
            );
        }
    }

    // 2. CHỐNG CSRF (Cross-Site Request Forgery)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !pathname.startsWith('/api/auth')) {
        if (!verifyCsrfOrigin(request)) {
            return new NextResponse(
                JSON.stringify({ error: 'CSRF Attack Detected! Yêu cầu truy cập bị từ chối.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // 3. ROLE-BASED ACCESS CONTROL (BẢO VỆ TRANG ADMIN)
    if (pathname.startsWith('/admin')) {
        const session = await auth();

        if (!session || !session.user) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
            return NextResponse.redirect(loginUrl);
        }

        const role = (session.user as { role?: string }).role;
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 4. BẢO MẬT ADVANCED SECURITY HEADERS
    const response = NextResponse.next();

    // Chống Clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    // Chống MIME-type Sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Bật XSS Filter trên trình duyệt cũ
    response.headers.set('X-XSS-Protection', '1; mode=block');
    // Chống Rò rỉ Referrer
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Chống Đọc trộm Permissions
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Bắt buộc HTTPS trong 1 năm (Strict Transport Security)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
