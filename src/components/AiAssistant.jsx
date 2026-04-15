import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';

export default function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Nexira Spatial AI initialized. I am monitoring real-time temporal anomaly data. How can I assist your risk assessment?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatTurn, setChatTurn] = useState(1);

    const messagesEndRef = useRef(null);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        const dummyResponses = [
            'Evaluating spatial overlap indices... The current active region exhibits a 45% spatial variance from previous models. Recommend isolating critical infrastructure points in the top right quadrant.',
            'Scanning temporal anomalies... I have cross-referenced historical rainfall data with the current flood vectors. A severe risk escalation is projected in the next 12 hours.',
            'Processing complete. Data packets have been sent to the dashboard panels. Please refer to the Infrastructure widget for live roadblock statuses.',
            'Continuous monitoring engaged. Let me know if you need specific localized reports.'
        ];

        setTimeout(() => {
            setIsTyping(false);
            const aiMessage = {
                role: 'assistant',
                text: dummyResponses[Math.min(chatTurn, dummyResponses.length - 1)]
            };
            setMessages(prev => [...prev, aiMessage]);
            setChatTurn(prev => prev + 1);
        }, 1800);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Open AI Assistant"
                className={`absolute bottom-20 md:bottom-6 right-3 md:right-6 z-[1000] bg-[#00cfbf] text-white p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(0,207,191,0.4)] hover:scale-110 transition-transform ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
            >
                <Sparkles size={20} className="animate-pulse drop-shadow-md" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ ease: "easeOut", duration: 0.2 }}
                        className="absolute bottom-3 md:bottom-6 right-3 md:right-6 z-[1010] w-[280px] md:w-[350px] bg-[#0b1219]/90 backdrop-blur-xl border border-[#00cfbf]/30 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85%]"
                    >
                        {/* Header */}
                        <div className="bg-[#0b1219] p-3 md:p-4 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00cfbf] to-transparent shadow-[0_0_10px_#00cfbf]"></div>
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-[#00cfbf]" />
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white drop-shadow-md">Nexira AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors bg-white/5 rounded p-1">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Chat History */}
                        <div className="flex-1 max-h-[200px] md:max-h-[250px] overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-[10px] md:text-xs leading-relaxed font-medium shadow-sm ${msg.role === 'user' ? 'bg-[#00cfbf]/90 text-black rounded-tr-sm font-bold' : 'bg-white/5 border border-white/10 text-neutral-300 rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 text-neutral-300 px-3 py-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center backdrop-blur-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00cfbf] animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00cfbf] animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00cfbf] animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input form */}
                        <form onSubmit={handleSend} className="p-3 bg-black/40 border-t border-white/10 relative">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isTyping ? "AI is processing..." : "Query spatial trends..."}
                                    disabled={isTyping}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 md:py-2.5 pl-3 pr-10 text-[10px] md:text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00cfbf]/50 transition-colors shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00cfbf] hover:text-white disabled:opacity-50 disabled:hover:text-[#00cfbf] transition-colors p-1">
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
