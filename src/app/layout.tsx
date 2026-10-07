import './globals.css';
import React from 'react';
import { AuthSessionProvider } from '@/components/AuthSessionProvider';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';

export const metadata = {
    title: 'Vyyy Boutique - Nàng Thơ Áo Dài & Thời Trang Thu Đông 2026',
    description: 'Trải nghiệm không gian mua sắm 3D độc đáo, Áo Dài & Trench Coat cao cấp Vyyy Boutique.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
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
