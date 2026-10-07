'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, User, Mail, Lock, LogIn, Sparkles } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        if (isRegister) {
            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });

                const data = await res.json();
                if (!res.ok) {
                    setErrorMsg(data.error || 'Đăng ký thất bại!');
                } else {
                    setSuccessMsg('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');
                    const result = await signIn('credentials', {
                        email,
                        password,
                        redirect: false,
                    });
                    if (result?.error) {
                        setErrorMsg('Đăng nhập tự động thất bại, vui lòng thử đăng nhập thủ công.');
                    } else {
                        router.push(callbackUrl);
                        router.refresh();
                    }
                }
            } catch (err) {
                setErrorMsg('Không thể kết nối đến máy chủ!');
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const result = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    setErrorMsg('Email hoặc mật khẩu không chính xác!');
                } else {
                    setSuccessMsg('Đăng nhập thành công!');
                    router.push(callbackUrl);
                    router.refresh();
                }
            } catch (err) {
                setErrorMsg('Đã xảy ra lỗi trong quá trình đăng nhập!');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'rgba(251, 249, 245, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            padding: '36px 32px',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 className="vyyy-heading gold-gradient-text" style={{ fontSize: '24px', letterSpacing: '0.16em', fontWeight: 900 }}>
                    VYYY BOUTIQUE
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="var(--accent-terracotta)" />
                    {isRegister ? 'CHÀO ĐẰNG ẤY NHÓA ✌️' : 'WEO CĂM BÁCH 😊'}
                </p>
            </div>

            {errorMsg && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(184, 122, 92, 0.12)',
                    border: '1px solid var(--accent-terracotta)',
                    borderRadius: '12px',
                    color: 'var(--accent-terracotta)',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                }}>
                    <AlertTriangle size={16} /> {errorMsg}
                </div>
            )}

            {successMsg && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(91, 110, 93, 0.12)',
                    border: '1px solid var(--accent-sage)',
                    borderRadius: '12px',
                    color: 'var(--accent-sage)',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                }}>
                    <CheckCircle2 size={16} /> {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isRegister && (
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <User size={13} color="var(--accent-sage)" /> HỌ VÀ TÊN NÀNG THƠ *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ví dụ: Đoàn Hà Vy"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-sage)',
                                backgroundColor: '#ffffff',
                                fontSize: '13px',
                                outline: 'none',
                            }}
                        />
                    </div>
                )}

                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Mail size={13} color="var(--accent-sage)" /> ĐỊA CHỈ EMAIL *
                    </label>
                    <input
                        type="email"
                        required
                        placeholder="nangtho@vyyy.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-sage)',
                            backgroundColor: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Lock size={13} color="var(--accent-sage)" /> MẬT KHẨU *
                    </label>
                    <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-sage)',
                            backgroundColor: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: 'var(--accent-sage)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '12px',
                        letterSpacing: '0.12em',
                        cursor: loading ? 'wait' : 'pointer',
                        boxShadow: '0 8px 20px rgba(91, 110, 93, 0.25)',
                        marginTop: '8px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    {loading ? 'ĐANG XỬ LÝ...' : (
                        <>
                            {isRegister ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP'}
                            <ArrowRight size={15} />
                        </>
                    )}
                </button>
            </form>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-sage)', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: 700 }}>HOẶC ĐĂNG NHẬP NHANH VỚI</p>
                <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl })}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-sage)',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                >
                    <LogIn size={16} color="#db4437" />
                    Đăng nhập bằng tài khoản Google
                </button>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button
                    type="button"
                    onClick={() => {
                        setIsRegister(!isRegister);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-terracotta)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
                </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link href="/" style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowLeft size={13} /> Quay lại trang chủ Vyyy Boutique
                </Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundImage: `linear-gradient(rgba(61, 74, 62, 0.35), rgba(71, 87, 73, 0.50)), url('/images/login-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'var(--font-sans)',
        }}>
            <Suspense fallback={<div style={{ fontSize: '13px', color: '#ffffff' }}>Đang tải trang đăng nhập...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
