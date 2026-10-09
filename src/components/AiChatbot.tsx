'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, X, Send, Bot, Trash2, Sparkles, RefreshCw, Package, Truck, Shirt, BarChart2, Users, ClipboardList } from 'lucide-react';
import { marked } from 'marked';
import { normalizeRole, hasPermission } from '@/lib/roles';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    formattedHtml?: string;
    timestamp: Date;
    outOfScope?: boolean;
}

export const AiChatbot: React.FC = () => {
    const { data: session } = useSession();

    const userRole = useMemo(() => {
        const raw = (session?.user as { role?: string })?.role;
        return normalizeRole(raw);
    }, [session]);

    const isAdmin = userRole === 'admin';
    const isOrderManager = userRole === 'order_manager';
    const isStaff = userRole === 'staff' || userRole === 'employee';
    const isSystemUser = isAdmin || isOrderManager || isStaff;

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Drag State
    const [bubbleBottom, setBubbleBottom] = useState(28);
    const [bubbleRight, setBubbleRight] = useState(28);
    const [isDragging, setIsDragging] = useState(false);
    const [panelSide, setPanelSide] = useState<'left' | 'right'>('right');
    const [panelVertical, setPanelVertical] = useState<'above' | 'below'>('above');

    const dragStartY = useRef(0);
    const dragStartX = useRef(0);
    const dragStartBottom = useRef(0);
    const dragStartRight = useRef(0);
    const dragDistance = useRef(0);
    const DRAG_THRESHOLD = 5;

    // Quick Action options based on Role & Permissions
    const CUSTOMER_QUICK_ACTIONS = [
        { icon: Package, label: 'Đơn hàng của tôi', text: 'Cho tôi xem thông tin đơn hàng của tôi' },
        { icon: Truck, label: 'Phí ship & Giao hàng', text: 'Chính sách freeship và thời gian giao hàng như thế nào?' },
        { icon: Shirt, label: 'Tư vấn chọn Size', text: 'Bảng size chuẩn của Vyyy Boutique cho Áo dài?' },
        { icon: RefreshCw, label: 'Quy định đổi trả', text: 'Chính sách đổi trả sản phẩm 7 ngày như thế nào?' },
    ];

    const ADMIN_QUICK_ACTIONS = [
        { icon: BarChart2, label: 'Doanh thu hệ thống', text: 'Thống kê tổng doanh thu và đơn hàng hôm nay' },
        { icon: Users, label: 'Người dùng mới', text: 'Cho tôi xem danh sách người dùng mới đăng ký' },
        { icon: Shirt, label: 'Sản phẩm Catalogue', text: 'Số lượng sản phẩm trong catalogue hiện tại?' },
        { icon: ClipboardList, label: 'Đơn hàng gần đây', text: 'Danh sách 10 đơn hàng gần đây toàn hệ thống' },
    ];

    const ORDER_MANAGER_QUICK_ACTIONS = [
        { icon: BarChart2, label: 'Doanh thu & Đơn hàng', text: 'Thống kê tổng doanh thu và số lượng đơn hàng' },
        { icon: Truck, label: 'Đơn hàng cần giao', text: 'Danh sách các đơn hàng gần đây' },
        { icon: Shirt, label: 'Sản phẩm bán chạy', text: 'Các mẫu Áo dài và trang phục hot nhất?' },
        { icon: RefreshCw, label: 'Quy trình xử lý', text: 'Quy trình xử lý đơn hàng và hoàn tiền?' },
    ];

    const STAFF_QUICK_ACTIONS = [
        { icon: Package, label: 'Đơn hàng cần xử lý', text: 'Xem danh sách đơn hàng gần đây' },
        { icon: Truck, label: 'Thời gian vận chuyển', text: 'Thời gian giao hàng theo từng khu vực?' },
        { icon: Shirt, label: 'Bảng Size tư vấn', text: 'Bảng size chuẩn để tư vấn cho khách?' },
        { icon: RefreshCw, label: 'Điều kiện đổi trả', text: 'Điều kiện được đổi trả sản phẩm?' },
    ];

    const quickActions = useMemo(() => {
        if (!isSystemUser) return CUSTOMER_QUICK_ACTIONS;
        if (isAdmin) return ADMIN_QUICK_ACTIONS;
        if (isOrderManager) return ORDER_MANAGER_QUICK_ACTIONS;
        return STAFF_QUICK_ACTIONS;
    }, [isSystemUser, isAdmin, isOrderManager]);

    const inputPlaceholder = useMemo(() => {
        if (!isSystemUser) return 'Hỏi AI tư vấn phối đồ, chọn size, đơn hàng...';
        if (isAdmin) return 'Hỏi AI tra cứu doanh thu, nhân sự, đơn hàng...';
        if (isOrderManager) return 'Hỏi AI tra cứu doanh thu, đơn hàng, catalogue...';
        return 'Hỏi AI tra cứu đơn hàng, tư vấn sản phẩm...';
    }, [isSystemUser, isAdmin, isOrderManager]);

    const footerHint = useMemo(() => {
        if (!isSystemUser) return 'Hỗ trợ Nàng Thơ 24/7 • Đơn hàng & Phối đồ';
        if (isAdmin) return 'Quyền Admin • Quản trị toàn hệ thống';
        if (isOrderManager) return 'Quyền Order Manager • Quản lý đơn & Doanh thu';
        return 'Quyền Staff • Xử lý đơn hàng & CSKH';
    }, [isSystemUser, isAdmin, isOrderManager]);

    // Push Welcome Message
    useEffect(() => {
        let welcomeText = '';
        if (!isSystemUser) {
            welcomeText = 'Xin chào Nàng Thơ! Em là trợ lý AI Vyyy Boutique. Nàng cần em tư vấn phối đồ, chọn size hay kiểm tra đơn hàng ạ?';
        } else if (isAdmin) {
            welcomeText = 'Xin chào Admin! Em là trợ lý AI quản trị hệ thống Vyyy Boutique. Em có thể hỗ trợ tra cứu doanh thu, nhân sự, sản phẩm và đơn hàng toàn hệ thống.';
        } else if (isOrderManager) {
            welcomeText = 'Xin chào Quản lý! Em có thể giúp anh/chị tra cứu thống kê doanh thu, danh sách đơn hàng và thông tin sản phẩm.';
        } else {
            welcomeText = 'Xin chào Chuyên viên Vyyy Boutique! Em có thể hỗ trợ tra cứu đơn hàng gần đây và chính sách tư vấn khách hàng.';
        }

        setMessages([
            {
                role: 'assistant',
                content: welcomeText,
                formattedHtml: formatMessageContent(welcomeText),
                timestamp: new Date(),
            },
        ]);
    }, [userRole]);

    // Load Drag Position
    useEffect(() => {
        try {
            const saved = localStorage.getItem('chatbot-position');
            if (saved) {
                const { bottom, right } = JSON.parse(saved);
                const maxBottom = window.innerHeight - 60;
                const maxRight = window.innerWidth - 60;
                setBubbleBottom(Math.max(16, Math.min(bottom, maxBottom)));
                setBubbleRight(Math.max(16, Math.min(right, maxRight)));

                const midX = window.innerWidth / 2;
                const bubbleCenterX = window.innerWidth - right - 30;
                setPanelSide(bubbleCenterX < midX ? 'left' : 'right');
                setPanelVertical(bottom > window.innerHeight / 2 ? 'below' : 'above');
            }
        } catch (e) {
            // Ignore
        }
    }, []);

    const savePosition = (b: number, r: number) => {
        try {
            localStorage.setItem('chatbot-position', JSON.stringify({ bottom: b, right: r }));
        } catch (e) { }
    };

    // Auto Scroll
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Drag Events (Mouse)
    const onBubbleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(false);
        dragDistance.current = 0;
        dragStartY.current = e.clientY;
        dragStartX.current = e.clientX;
        dragStartBottom.current = bubbleBottom;
        dragStartRight.current = bubbleRight;

        document.addEventListener('mousemove', onBubbleMouseMove);
        document.addEventListener('mouseup', onBubbleMouseUp);
    };

    const onBubbleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - dragStartY.current;
        const deltaX = e.clientX - dragStartX.current;
        dragDistance.current = Math.sqrt(deltaY * deltaY + deltaX * deltaX);

        if (dragDistance.current >= DRAG_THRESHOLD) {
            setIsDragging(true);
            const newBottom = dragStartBottom.current - deltaY;
            const newRight = dragStartRight.current - deltaX;
            const maxBottom = window.innerHeight - 60;
            const maxRight = window.innerWidth - 60;

            setBubbleBottom(Math.max(16, Math.min(newBottom, maxBottom)));
            setBubbleRight(Math.max(16, Math.min(newRight, maxRight)));
        }
    };

    const onBubbleMouseUp = () => {
        document.removeEventListener('mousemove', onBubbleMouseMove);
        document.removeEventListener('mouseup', onBubbleMouseUp);

        if (dragDistance.current >= DRAG_THRESHOLD) {
            setBubbleRight(prevRight => {
                const midX = window.innerWidth / 2;
                const bubbleCenterX = window.innerWidth - prevRight - 30;
                let finalRight = prevRight;
                if (bubbleCenterX < midX) {
                    finalRight = window.innerWidth - 60 - 16;
                    setPanelSide('left');
                } else {
                    finalRight = 16;
                    setPanelSide('right');
                }
                setBubbleBottom(prevBottom => {
                    setPanelVertical(prevBottom > window.innerHeight / 2 ? 'below' : 'above');
                    savePosition(prevBottom, finalRight);
                    return prevBottom;
                });
                return finalRight;
            });
        } else {
            toggleChat();
        }
        setIsDragging(false);
    };

    const toggleChat = () => {
        setIsOpen(prev => !prev);
        setHasNewMessage(false);
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    };

    const formatMessageContent = (content: string): string => {
        if (!content) return '';
        try {
            let parsed = marked.parse(content) as string;
            parsed = parsed.replace(/<table>/g, '<div style="overflow-x:auto; margin: 8px 0;"><table style="width:100%; border-collapse:collapse; font-size:11px;">');
            parsed = parsed.replace(/<\/table>/g, '</table></div>');
            return parsed;
        } catch {
            return content;
        }
    };

    const sendMessage = async (textToSend?: string) => {
        const query = (textToSend || inputText).trim();
        if (!query || isLoading) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: query,
            formattedHtml: formatMessageContent(query),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInputText('');
        setIsLoading(true);

        // Placeholder assistant message for streaming tokens
        const assistantMsgPlaceholder: ChatMessage = {
            role: 'assistant',
            content: '',
            formattedHtml: '',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsgPlaceholder]);

        try {
            const response = await fetch('/api/ai-chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query }),
            });

            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                const json = await response.json();
                const replyText = json.reply || json.message || 'Có lỗi xảy ra, vui lòng thử lại.';
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: replyText,
                        formattedHtml: formatMessageContent(replyText),
                        outOfScope: json.outOfScope,
                    };
                    return updated;
                });
                setIsLoading(false);
                return;
            }

            if (!response.body) {
                throw new Error('Không thể đọc luồng phản hồi từ server');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ''; // Giữ lại phần chưa trọn vẹn trong buffer

                for (const lineGroup of lines) {
                    const line = lineGroup.trim();
                    if (!line || !line.startsWith('data: ')) continue;
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.token) {
                            accumulatedContent += parsed.token;
                            setMessages(prev => {
                                const updated = [...prev];
                                const lastIdx = updated.length - 1;
                                updated[lastIdx] = {
                                    ...updated[lastIdx],
                                    content: accumulatedContent,
                                    formattedHtml: formatMessageContent(accumulatedContent),
                                };
                                return updated;
                            });
                        }
                    } catch (e) {
                        // Ignore parse error for incomplete JSON
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi nhận luồng AI Chat:', error);
            setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                const errText = 'Hệ thống AI đang quá tải hoặc gặp gián đoạn. Nàng vui lòng thử lại sau nhé!';
                updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: errText,
                    formattedHtml: formatMessageContent(errText),
                };
                return updated;
            });
        } finally {
            setIsLoading(false);
            if (!isOpen) setHasNewMessage(true);
        }
    };

    const clearSession = async () => {
        try {
            await fetch('/api/ai-chat/session', { method: 'DELETE' });
        } catch (e) { }
        setMessages([
            {
                role: 'assistant',
                content: 'Em đã làm sạch lịch sử trò chuyện rồi ạ! Nàng cần hỗ trợ thông tin gì mới không ạ?',
                formattedHtml: formatMessageContent('Em đã làm sạch lịch sử trò chuyện rồi ạ! Nàng cần hỗ trợ thông tin gì mới không ạ?'),
                timestamp: new Date(),
            },
        ]);
    };

    return (
        <div style={{ position: 'fixed', zIndex: 99999, bottom: `${bubbleBottom}px`, right: `${bubbleRight}px` }}>
            {/* Floating Bubble Button */}
            {!isOpen && (
                <button
                    type="button"
                    onMouseDown={onBubbleMouseDown}
                    onClick={(e) => {
                        if (dragDistance.current < DRAG_THRESHOLD) {
                            toggleChat();
                        }
                    }}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-sage)',
                        color: '#ffffff',
                        border: '2px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 8px 24px rgba(91, 110, 93, 0.45)',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        transition: isDragging ? 'none' : 'transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.transform = 'scale(1)'; }}
                    title="Tư vấn Nàng Thơ AI (Kéo thả để di chuyển)"
                >
                    <Bot size={28} />
                    {hasNewMessage && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-terracotta)',
                                border: '2px solid #fff',
                            }}
                        />
                    )}
                </button>
            )}

            {/* Main Chat Panel Window */}
            {isOpen && (
                <div
                    style={{
                        width: '370px',
                        height: '520px',
                        maxWidth: 'calc(100vw - 32px)',
                        maxHeight: 'calc(100vh - 80px)',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: '24px',
                        border: '1px solid var(--border-sage)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'absolute',
                        ...(panelVertical === 'above' ? { bottom: '66px' } : { top: '66px' }),
                        ...(panelSide === 'right' ? { right: 0 } : { left: 0 }),
                        animation: 'fadeIn 0.25s ease-out',
                    }}
                >
                    {/* Header Bar */}
                    <div
                        style={{
                            padding: '14px 18px',
                            backgroundColor: 'var(--accent-sage)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Bot size={20} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}>TƯ VẤN AI NÀNG THƠ</h4>
                                <span style={{ fontSize: '10px', opacity: 0.9 }}>{footerHint}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                type="button"
                                onClick={clearSession}
                                title="Xóa lịch sử hội thoại"
                                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '50%', opacity: 0.85 }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={toggleChat}
                                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '50%', opacity: 0.85 }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div
                        style={{
                            flex: 1,
                            padding: '14px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            backgroundColor: 'rgba(255,255,255,0.45)',
                        }}
                    >
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    padding: '10px 14px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                    backgroundColor: msg.role === 'user' ? 'var(--accent-sage)' : '#ffffff',
                                    color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                                    fontSize: '12px',
                                    lineHeight: '1.55',
                                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-sage)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                }}
                            >
                                {msg.formattedHtml ? (
                                    <div dangerouslySetInnerHTML={{ __html: msg.formattedHtml }} />
                                ) : (
                                    msg.content || (isLoading && index === messages.length - 1 ? 'Đang suy nghĩ...' : '')
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Action Pills */}
                    <div
                        style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-card)',
                            borderTop: '1px solid var(--border-sage)',
                            display: 'flex',
                            gap: '6px',
                            overflowX: 'auto',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {quickActions.map((qa, i) => {
                            const IconComponent = qa.icon;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => sendMessage(qa.text)}
                                    disabled={isLoading}
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        padding: '5px 10px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-sage)',
                                        backgroundColor: 'rgba(91, 110, 93, 0.08)',
                                        color: 'var(--accent-sage)',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        flexShrink: 0,
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                    }}
                                    onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = 'rgba(91, 110, 93, 0.18)'; }}
                                    onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = 'rgba(91, 110, 93, 0.08)'; }}
                                >
                                    <IconComponent size={12} />
                                    <span>{qa.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Input Footer */}
                    <div
                        style={{
                            padding: '10px 12px',
                            borderTop: '1px solid var(--border-sage)',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={inputPlaceholder}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '9px 12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-sage)',
                                fontSize: '12px',
                                outline: 'none',
                                backgroundColor: 'var(--bg-main)',
                                color: 'var(--text-primary)',
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => sendMessage()}
                            disabled={isLoading || !inputText.trim()}
                            style={{
                                padding: '9px 14px',
                                borderRadius: '12px',
                                backgroundColor: isLoading || !inputText.trim() ? '#ccc' : 'var(--accent-sage)',
                                color: '#ffffff',
                                border: 'none',
                                cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s ease',
                            }}
                        >
                            {isLoading ? <RefreshCw size={15} className="spin-icon" /> : <Send size={15} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiChatbot;
