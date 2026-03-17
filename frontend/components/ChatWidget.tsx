import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useUser } from '../context/UserContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const ChatWidget: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionId = useRef(Math.random().toString(36).substring(7));
    const { user } = useUser();

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: '¡Hola! Soy tu asistente de IA de Starsano. ¿En qué puedo ayudarte hoy?'
            }]);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (forcedMessage?: string) => {
        const textToSend = forcedMessage || inputText;
        if (!textToSend.trim() || isLoading) return;

        const userMessage = textToSend.trim();
        if (!forcedMessage) setInputText('');
        
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const data = await api.chat(userMessage, sessionId.current, user?.email);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.response
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Lo siento, hubo un error de conexión. Por favor, intenta de nuevo.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = (content: string) => {
        // First, clean up all double asterisks from the text
        const cleanContent = content.replace(/\*\*/g, '');

        // Basic line splitting for bullet points
        const lines = cleanContent.split('\n');
        
        const linkRegex = /\[(.*?)\]\((.*?)\)/g;

        return lines.map((line, lineIdx) => {
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = linkRegex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                }

                const [full, text, url] = match;
                // If it's internal, parse slightly better
                const isInternal = url.startsWith('/') || url.includes('localhost') || url.includes('starsano.com');
                const path = isInternal ? (url.includes('#') ? url.split('#')[1] : url) : url;

                parts.push(
                    <span key={match.index} className="inline-block my-1">
                        {isInternal ? (
                            <button
                                onClick={() => navigate(path)}
                                className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold hover:bg-primary hover:text-white transition-all border border-primary/20"
                            >
                                {text}
                                <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </button>
                        ) : (
                            <a
                                href={url}
                                className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold hover:bg-primary hover:text-white transition-all border border-primary/20 no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {text}
                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                            </a>
                        )}
                    </span>
                );

                lastIndex = match.index + full.length;
            }

            if (lastIndex < line.length) {
                parts.push(line.substring(lastIndex));
            }

            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');

            return (
                <div key={lineIdx} className={`${isBullet ? 'pl-4 relative mb-1' : 'mb-1'}`}>
                    {isBullet && <span className="absolute left-0 top-0 text-primary">•</span>}
                    <span className="leading-relaxed">{parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}</span>
                </div>
            );
        });
    };

    return (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-2 w-full sm:w-96 bg-background-card rounded-2xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden animate-slideUp flex flex-col h-[calc(100vh-7rem)] sm:h-[500px] max-h-[calc(100vh-7rem)] sm:max-h-[500px]">
                    {/* Header */}
                    <div className="bg-cta-gradient p-3 sm:p-4 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <span className="material-symbols-outlined text-white">smart_toy</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Asistente Starsano</h3>
                                <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Online</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-grow p-3 sm:p-4 overflow-y-auto bg-background/30 flex flex-col gap-3 sm:gap-4">
                        {messages.map((msg, i) => (
                            <React.Fragment key={i}>
                                <div className={`flex items-start gap-2 max-w-[92%] sm:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm break-words ${msg.role === 'user'
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-white border border-border text-foreground rounded-tl-none'
                                        }`}>
                                        {renderContent(msg.content)}
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white text-sm animate-pulse">more_horiz</span>
                                </div>
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-border text-sm text-foreground shadow-sm italic text-xs">
                                    Escribiendo...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="p-3 sm:p-4 border-t border-border bg-white shrink-0"
                    >
                        <div className="relative group">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="w-full bg-background-alt border border-border py-3 pl-4 pr-12 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary disabled:opacity-30 transition-opacity"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cta-gradient shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 group relative"
            >
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:hidden"></div>
                <span className={`material-symbols-outlined text-3xl transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
                    chat
                </span>
                <span className={`material-symbols-outlined text-3xl absolute transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-0'}`}>
                    close
                </span>
            </button>
        </div>
    );
};

export default ChatWidget;

