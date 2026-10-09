import './globals.css';
import React from 'react';
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google';
import { AuthSessionProvider } from '@/components/AuthSessionProvider';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ['vietnamese', 'latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--font-body',
});

const playfair = Playfair_Display({
    subsets: ['vietnamese', 'latin'],
    weight: ['500', '600', '700'],
    display: 'swap',
    variable: '--font-heading',
});

export const metadata = {
    title: 'Vyyy Boutique - Nàng Thơ Áo Dài & Thời Trang Thu Đông 2026',
    description: 'Trải nghiệm không gian mua sắm độc đáo, Áo Dài & Trench Coat cao cấp Vyyy Boutique.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" className={`${beVietnamPro.variable} ${playfair.variable}`} suppressHydrationWarning>
            <head>
            </head>
            <body suppressHydrationWarning>
                <AuthSessionProvider>
                    <ReactQueryProvider>
                        {children}
                    </ReactQueryProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}
