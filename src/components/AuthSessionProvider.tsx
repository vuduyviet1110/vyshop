'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchOnWindowFocus={false} refetchInterval={0} refetchWhenOffline={false}>
            {children}
        </SessionProvider>
    );
}
