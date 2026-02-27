import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionId = useRef(Math.random().toString(36).substring(7));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage = inputText.trim();
        setInputText('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const data = await api.chat(userMessage, sessionId.current);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
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
        const linkRegex = /\[(.*?)\]\((.*?)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            // Text before match
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }

            // The link as a button
            const [full, text, url] = match;
            parts.push(
                <a
                    key={match.index}
                    href={url}
                    className="inline-flex items-center gap-1 bg-brand-soft text-white px-3 py-1.5 rounded-lg text-xs font-bold my-1 hover:bg-primary transition-colors shadow-sm no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    {text}
                </a>
            );

            lastIndex = match.index + full.length;
        }

        // Remaining text
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-2 w-80 sm:w-96 bg-background-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-slideUp flex flex-col h-[500px]">
                    {/* Header */}
                    <div className="bg-cta-gradient p-4 text-white flex justify-between items-center shrink-0">
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
                    <div className="flex-grow p-4 overflow-y-auto bg-background/30 flex flex-col gap-4">
                        <div className="flex items-start gap-2 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                            </div>
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-border text-sm text-foreground shadow-sm">
                                ¡Hola! Soy tu asistente de IA de Starsano. ¿En qué puedo ayudarte hoy?
                            </div>
                        </div>

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                                    </div>
                                )}
                                <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white border border-border text-foreground rounded-tl-none'
                                    }`}>
                                    {renderContent(msg.content)}
                                </div>
                            </div>
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
                        className="p-4 border-t border-border bg-white shrink-0"
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
                className="w-16 h-16 rounded-full bg-cta-gradient shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 group relative"
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

