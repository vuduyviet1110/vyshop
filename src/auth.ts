import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
        signIn: '/auth/login',
        error: '/auth/login',
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu!');
                }

                const email = String(credentials.email).toLowerCase().trim();
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    throw new Error('Tài khoản hoặc mật khẩu không chính xác!');
                }

                const isValid = await bcrypt.compare(String(credentials.password), user.password);
                if (!isValid) {
                    throw new Error('Tài khoản hoặc mật khẩu không chính xác!');
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role || 'USER';
            }
            // Nếu đăng nhập qua OAuth (Google/GitHub), đảm bảo User tồn tại trong DB với Role đúng
            if (account && account.provider !== 'credentials' && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                } else {
                    const newUser = await prisma.user.create({
                        data: {
                            email: token.email,
                            name: token.name || 'Nàng Thơ Vyyy',
                            image: token.picture,
                            role: 'USER',
                        },
                    });
                    token.id = newUser.id;
                    token.role = newUser.role;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || 'vyyy-boutique-super-secret-key-2026-secure-jwt-token-key',
});
