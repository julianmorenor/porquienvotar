"use client";

import { useState, useRef, useEffect } from 'react';
import { Candidate } from '@/lib/types';
import ResultsView from './results-view';
import ChatInput from '@/components/ui/chat-input';
import InfiniteGrid from '@/components/ui/infinite-grid-integration';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sun,
    Moon,
    Shield,
    TrendingUp,
    Stethoscope,
    GraduationCap,
    Leaf,
    Scale,
    Heart,
    Sprout,
    Bus,
    ArrowRight,
    Bird
} from 'lucide-react';
import clsx from 'clsx';

interface Message {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

export default function ChatInterface() {
    // State
    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [isDark, setIsDark] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[] | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Hydration Fix
    useEffect(() => {
        setMounted(true);
    }, []);

    // Dark Mode Toggle Effect
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        const assistantMsg: Message = { role: 'assistant', content: '' };

        const currentHistory = [...messages];
        setMessages(prev => [...prev, userMsg, assistantMsg]);
        setIsLoading(true);

        try {
            const history = [...currentHistory, userMsg];
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${res.status}: de conexión`);
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedContent += chunk;

                    try {
                        const messageMatch = accumulatedContent.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"?/);
                        if (messageMatch && messageMatch[1]) {
                            const cleanText = messageMatch[1]
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\/g, '');

                            setMessages(prev => {
                                const newMessages = [...prev];
                                const last = newMessages[newMessages.length - 1];
                                if (last && last.role === 'assistant') {
                                    last.content = cleanText;
                                }
                                return newMessages;
                            });
                        }
                    } catch (e) { }
                }
            }

            try {
                const finalJson = JSON.parse(accumulatedContent);
                if (finalJson.client_response) {
                    const { message, suggested_candidates, is_final_answer } = finalJson.client_response;
                    if (message) {
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const last = newMessages[newMessages.length - 1];
                            if (last && last.role === 'assistant') last.content = message;
                            return newMessages;
                        });
                    }
                    if (is_final_answer && suggested_candidates) {
                        setCandidates(suggested_candidates);
                    }
                }
            } catch (e) { }

        } catch (error: any) {
            console.error("[Chat] Error:", error);
            setMessages(prev => [...prev, { role: 'system', content: error.message || 'Ocurrió un error inesperado al conectar con el servidor.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const topics = [
        { name: 'Seguridad', icon: Shield },
        { name: 'Economía', icon: TrendingUp },
        { name: 'Salud', icon: Stethoscope },
        { name: 'Educación', icon: GraduationCap },
        { name: 'Ambiente', icon: Leaf },
        { name: 'Justicia', icon: Scale },
        { name: 'Derechos Sociales', icon: Heart },
        { name: 'Agro', icon: Sprout },
        { name: 'Movilidad', icon: Bus },
        { name: 'Paz', icon: Bird }
    ];

    const toggleTopic = (topicName: string) => {
        setSelectedTopics(prev => {
            if (prev.includes(topicName)) {
                return prev.filter(t => t !== topicName);
            }
            if (prev.length < 3) {
                return [...prev, topicName];
            }
            return prev;
        });
    };

    const handleStartChat = () => {
        if (selectedTopics.length === 3) {
            const contextMessage = `Mis 3 prioridades para Colombia son: ${selectedTopics.join(', ')}. ¿Cómo se alinean los candidatos con estas preocupaciones?`;
            handleSendMessage({ message: contextMessage, files: [], pastedContent: [], model: 'default' });
        }
    };

    const hasStarted = messages.length > 0;

    if (!mounted) return <div className="h-[100dvh] bg-bg-0" />;

    if (candidates) {
        return <ResultsView candidates={candidates} selectedTopics={selectedTopics} />;
    }

    return (
        <div className="relative w-full h-[100dvh] bg-bg-0 text-text-100 font-sans transition-colors duration-300 overflow-hidden flex flex-col">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <InfiniteGrid />
            </div>

            {/* Dark Mode Toggle */}
            <div className="fixed top-4 right-4 z-[60] pointer-events-auto">
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 ml-2 rounded-full bg-bg-100/80 backdrop-blur-md border border-bg-300 shadow-sm hover:scale-105 active:scale-95 transition-all text-text-300"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>

            {/* Logo / Header */}
            <div className={`fixed top-0 left-0 w-full p-4 z-[50] transition-all duration-500 ${hasStarted ? 'bg-bg-0/80 backdrop-blur shadow-sm' : ''}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <span className="font-semibold tracking-tight text-xl md:text-2xl text-text-100">
                        porquien<span className="bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] bg-clip-text text-transparent">votar</span>.co
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 w-full flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto h-full">
                <AnimatePresence mode="wait">
                    {!hasStarted ? (
                        <motion.div
                            key="onboarding"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center justify-start flex-1 w-full px-6 text-center pt-20 md:pt-28"
                        >
                            <div className="mb-4 md:mb-8 w-full">
                                <h1 className="text-3xl md:text-5xl font-serif font-medium text-text-100 tracking-tight leading-[1.1] mb-2">
                                    Descubre tu candidato <span className="bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] bg-clip-text text-transparent italic">ideal</span>.
                                </h1>
                                <p className="text-text-300 font-light text-base md:text-xl">
                                    Si tuvieras la varita mágica <br className="md:hidden" /> ¿por dónde empezarías?
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 w-full max-w-4xl px-2">
                                {topics.map((t) => {
                                    const isSelected = selectedTopics.includes(t.name);
                                    const Icon = t.icon;
                                    return (
                                        <button
                                            key={t.name}
                                            onClick={() => toggleTopic(t.name)}
                                            className={clsx(
                                                "flex flex-col items-center justify-center p-2 h-16 md:h-28 rounded-2xl transition-all duration-300 relative overflow-hidden group border",
                                                isSelected
                                                    ? "border-transparent shadow-md bg-bg-100"
                                                    : "bg-bg-100/30 border-bg-300/40 hover:bg-bg-100/60 hover:scale-[1.02]"
                                            )}
                                        >
                                            {/* Multicolor Gradient Border when Selected */}
                                            {isSelected && (
                                                <div className="absolute inset-0 p-[1.5px] rounded-2xl bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF]">
                                                    <div className="w-full h-full bg-bg-100 rounded-[14px]" />
                                                </div>
                                            )}
                                            <div className={clsx(
                                                "absolute inset-0 bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] transition-opacity",
                                                isSelected ? "opacity-10" : "opacity-0 group-hover:opacity-5"
                                            )} />
                                            <Icon className={clsx(
                                                "relative z-10 w-5 h-5 md:w-6 md:h-6 mb-1 transition-transform duration-300",
                                                isSelected ? "text-[#007AFF] scale-110" : "text-text-400 group-hover:text-text-200"
                                            )} />
                                            <span className={clsx(
                                                "relative z-10 text-[12px] md:text-sm transition-all leading-tight",
                                                isSelected ? "font-bold text-[#007AFF]" : "font-medium text-text-300"
                                            )}>
                                                {t.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col overflow-hidden w-full"
                        >
                            <div className="flex-1 overflow-y-auto px-4 pt-24 pb-48 no-scrollbar scroll-smooth">
                                <div className="space-y-6">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={clsx("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                            <div className={clsx(
                                                "max-w-[85%] rounded-2xl px-5 py-3 text-[16px] shadow-sm",
                                                msg.role === 'user' ? "bg-bg-100/80 backdrop-blur-sm text-text-100 border border-bg-300/30" : "font-light text-text-200"
                                            )}>
                                                {msg.role === 'assistant' && msg.content.length > 0 && (
                                                    <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center mb-2 shadow-lg">
                                                        <span className="text-[10px] font-bold text-white">PV</span>
                                                    </div>
                                                )}
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && !messages[messages.length - 1]?.content && (
                                        <div className="flex items-center gap-2 text-text-300 ml-2">
                                            <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center animate-pulse shadow-md">
                                                <span className="text-[10px] font-bold text-white">PV</span>
                                            </div>
                                            <span className="text-sm font-medium">Escribiendo...</span>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Panel */}
            <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-6 pt-6 bg-gradient-to-t from-bg-0 via-bg-0/95 to-transparent">
                <div className="max-w-3xl mx-auto flex justify-center">
                    {hasStarted ? (
                        <ChatInput onSendMessage={handleSendMessage} />
                    ) : (
                        <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                width: selectedTopics.length === 3 ? 'auto' : '88px',
                            }}
                            whileHover={selectedTopics.length === 3 ? { scale: 1.02, y: -2 } : {}}
                            whileTap={selectedTopics.length === 3 ? { scale: 0.98 } : {}}
                            onClick={handleStartChat}
                            disabled={selectedTopics.length !== 3}
                            className={clsx(
                                "relative h-14 md:h-16 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl overflow-hidden backdrop-blur-xl",
                                selectedTopics.length === 3
                                    ? "bg-black text-white px-10 shadow-[#007AFF]/30"
                                    : "bg-white/40 dark:bg-black/40 text-text-300 border border-bg-300/30 shadow-none px-6"
                            )}
                        >
                            {/* Master Glow Background */}
                            <AnimatePresence mode="wait">
                                {selectedTopics.length === 3 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] opacity-20"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Progress Visualizers (3 Senior Dots) */}
                            <div className="flex gap-2.5 relative z-10 transition-all duration-500">
                                {[1, 2, 3].map((dot) => (
                                    <div
                                        key={dot}
                                        className={clsx(
                                            "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-500 border",
                                            selectedTopics.length === 3
                                                ? "bg-white border-transparent shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                                : selectedTopics.length >= dot
                                                    ? "bg-gradient-to-br from-[#FF3B30] to-[#007AFF] border-transparent shadow-[0_0_8px_rgba(0,122,255,0.6)]"
                                                    : "bg-transparent border-text-300/20"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Icon Animation - Only visible in Ready Mode */}
                            <AnimatePresence>
                                {selectedTopics.length === 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="relative z-10 flex items-center justify-center ml-4"
                                    >
                                        <ArrowRight className="w-6 h-6 transition-all duration-700 translate-x-1 scale-110" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Refined Pulsing Glow for 'Success' State */}
                            {selectedTopics.length === 3 && (
                                <motion.div
                                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF]"
                                />
                            )}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
