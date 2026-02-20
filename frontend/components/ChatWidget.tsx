import React, { useState } from 'react';

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-background-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-slideUp flex flex-col h-[500px]">
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

                        {/* Placeholder for user messages */}
                        <div className="text-center py-10 opacity-20 flex flex-col items-center justify-center">
                            <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
                            <p className="text-xs italic">Próximamente estaremos chateando...</p>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border bg-white shrink-0">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Escribe tu mensaje..."
                                disabled
                                className="w-full bg-background-alt border border-border py-3 pl-4 pr-12 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-not-allowed"
                            />
                            <button disabled className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary opacity-50">
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
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
