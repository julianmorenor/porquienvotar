"use client";

import { useState, useRef, useEffect } from 'react';
import { Candidate } from '@/lib/types';
import ResultsView from './results-view';
import ChatInput from '@/components/ui/chat-input';
import InfiniteGrid from '@/components/ui/infinite-grid-integration';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface Message {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

export default function ChatInterface() {
    // State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¿Tu futuro está en juego? Descubre tu candidato ideal antes de que sea tarde. ¿Qué tema define tu voto hoy?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[] | null>(null);
    const [isDark, setIsDark] = useState(false); // Default to light

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dark Mode Toggle Effect
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length > 1) {
            scrollToBottom();
        }
    }, [messages, isLoading]);

    // Handle Send Message
    const handleSendMessage = async (data: {
        message: string;
        files: any[];
        pastedContent: any[];
        model: string;
        isThinkingEnabled?: boolean;
    }) => {
        const inputContent = data.message;

        if (!inputContent.trim()) return;

        const userMsg: Message = { role: 'user', content: inputContent };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const history = [...messages, userMsg]; // Send full history
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history })
            });

            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error("Has alcanzado el límite diario de consultas.");
                }
                throw new Error('Error de conexión');
            }

            const resData = await res.json();

            const assistantMsg: Message = { role: 'assistant', content: resData.message };
            setMessages(prev => [...prev, assistantMsg]);

            if (resData.is_final_answer && resData.suggested_candidates) {
                setCandidates(resData.suggested_candidates);
            }

        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'system', content: error.message || 'Ocurrió un error inesperado.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Determine View State
    const hasStarted = messages.length > 1;

    if (candidates) {
        return <ResultsView candidates={candidates} />;
    }

    const topics = [
        { name: 'Seguridad' },
        { name: 'Economía' },
        { name: 'Salud' },
        { name: 'Corrupción' },
        { name: 'Democracia' },
        { name: 'Paz' }
    ];

    return (
        <div className="relative w-full h-[100dvh] bg-bg-0 text-text-100 font-sans transition-colors duration-300 overflow-hidden flex flex-col">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <InfiniteGrid />
            </div>

            {/* Dark Mode Toggle - Sticky top right */}
            <button
                onClick={() => setIsDark(!isDark)}
                className="fixed top-4 right-4 z-[60] p-2.5 rounded-full bg-bg-100/80 backdrop-blur-md border border-bg-300 shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center group text-text-300 hover:text-text-100 cursor-pointer"
                aria-label="Toggle Theme"
            >
                {isDark ? (
                    <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                ) : (
                    <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                )}
            </button>

            {/* Logo / Header - Sticky Top */}
            <div className={`fixed top-0 left-0 w-full p-4 z-[50] transition-all duration-500 ${hasStarted ? 'bg-bg-0/80 backdrop-blur border-b border-bg-200' : ''}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 via-orange-400 to-teal-400 rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
                            PV
                        </div>
                        <span className="font-semibold tracking-tight text-lg opacity-100 text-text-100">
                            porquienvotar.co
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 w-full flex-1 flex flex-col overflow-hidden max-w-3xl mx-auto h-full">

                {/* Hero / Welcome View */}
                <AnimatePresence>
                    {!hasStarted && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="flex flex-col items-start justify-center flex-1 w-full px-6 text-left"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="mb-10 w-full"
                            >
                                <h2 className="text-xl md:text-2xl font-sans font-light text-text-300 mb-3">
                                    Hola, elector
                                </h2>
                                <h1 className="text-3xl md:text-5xl font-serif font-medium text-text-100 tracking-tight leading-[1.15] text-balance">
                                    Descubre tu candidato ideal.
                                </h1>
                            </motion.div>

                            <div className="w-full max-w-2xl transform transition-all duration-500 hover:scale-[1.01] hidden md:block mb-12">
                                <ChatInput onSendMessage={handleSendMessage} />
                            </div>

                            {/* Suggested Prompts */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-3xl px-1">
                                {topics.map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => handleSendMessage({ message: t.name, files: [], pastedContent: [], model: 'default' })}
                                        className={clsx(
                                            "flex items-center justify-center px-4 py-2 text-[15px] font-medium rounded-xl transition-all duration-300",
                                            "border border-bg-300/40 backdrop-blur-md shadow-sm",
                                            "bg-bg-100/40 hover:bg-bg-100/80 hover:border-accent/30 hover:shadow-md hover:scale-[1.02]",
                                            "active:scale-95 text-text-200"
                                        )}
                                    >
                                        <span>{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat History View - Desktop & Mobile optimized */}
                {hasStarted && (
                    <div className="flex-1 overflow-y-auto px-4 pt-24 pb-48 w-full no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style jsx>{`
                            ::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        <div className="space-y-6">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={clsx(
                                        "flex w-full",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            "max-w-[90%] md:max-w-[85%] rounded-2xl px-5 py-3 text-[16px] leading-[1.6]",
                                            msg.role === 'user'
                                                ? "bg-bg-100 text-text-100 dark:bg-bg-200 rounded-br-sm shadow-none border-none"
                                                : "bg-transparent text-text-100 font-light pl-0 shadow-none border-none py-0"
                                        )}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mb-2 opacity-100">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-400 via-orange-400 to-teal-400 flex items-center justify-center relative overflow-hidden shrink-0">
                                                    <span className="font-serif font-bold text-[10px] text-white z-10">PV</span>
                                                    <Sparkles size={8} className="text-white/60 absolute top-0.5 right-0.5" />
                                                </div>
                                            </div>
                                        )}
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start w-full pl-0 pt-2">
                                    <div className="flex items-center gap-2 text-text-300">
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-400 via-orange-400 to-teal-400 flex items-center justify-center animate-pulse shrink-0">
                                            <span className="font-serif font-bold text-[10px] text-white">PV</span>
                                        </div>
                                        <span className="text-sm">Escribiendo...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Input - Fixed positioned. Visible on mobile always. Visible on desktop ONLY if chat started. */}
            <div className={clsx(
                "fixed bottom-0 left-0 w-full z-40 px-4 pb-4 pt-4 bg-gradient-to-t from-bg-0 via-bg-0/90 to-transparent",
                !hasStarted && "md:hidden block"
            )}>
                <div className="max-w-3xl mx-auto">
                    <ChatInput onSendMessage={handleSendMessage} />
                </div>
            </div>
        </div>
    );
}
