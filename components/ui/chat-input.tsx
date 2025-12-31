import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

/* --- UTILS --- */
// (Utils removed as file handling is gone)

/* --- COMPONENTS --- */

// (FilePreviewCard and PastedContentCard removed)
// (ModelSelector removed)

// 4. Main Chat Input Component
interface ChatInputProps {
    onSendMessage: (data: {
        message: string;
        files: any[]; // Kept for compatibility but always empty
        pastedContent: any[]; // Kept for compatibility but always empty
        model: string;
        isThinkingEnabled?: boolean;
    }) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
    const [message, setMessage] = useState("");
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 384) + "px";
        }
    }, [message]);

    const handleSend = () => {
        if (!message.trim()) return;
        onSendMessage({
            message,
            files: [],
            pastedContent: [],
            model: "default",
            isThinkingEnabled
        });
        setMessage("");
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasContent = message.trim().length > 0;

    return (
        <div className={`relative w-full max-w-2xl mx-auto transition-all duration-300 font-sans`}>
            {/* Main Container */}
            <div className={`
                !box-content flex flex-col mx-0 md:mx-0 items-stretch transition-all duration-200 relative z-10 rounded-xl cursor-text border border-bg-300 dark:border-transparent 
                shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.08)]
                focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.1)] focus-within:border-accent/40
                bg-white dark:bg-[#30302E] font-sans antialiased scale-100
            `}>

                <div className="flex flex-col px-3 md:px-4 py-0.5 md:py-2 gap-2">
                    {/* Input Area */}
                    <div className="relative flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Qué te duele de Colombia..."
                            className="flex-1 bg-transparent border-0 outline-none text-text-100 text-[16px] placeholder:text-text-400/80 resize-none overflow-hidden py-2.5 md:py-3 pl-3 leading-[1.4] block font-normal antialiased min-h-[44px] max-h-[160px]"
                            rows={1}
                            autoFocus
                        />

                        {/* Send Button */}
                        <div className="pb-1 shrink-0">
                            <button
                                onClick={handleSend}
                                disabled={!hasContent}
                                className={`
                                    inline-flex items-center justify-center relative transition-all duration-200 h-9 w-9 md:h-10 md:w-10 rounded-full
                                    ${hasContent
                                        ? 'bg-accent text-bg-0 hover:scale-105 active:scale-95 shadow-md'
                                        : 'bg-bg-200/50 text-text-300/50 cursor-default'}
                                `}
                                type="button"
                                aria-label="Send message"
                            >
                                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mt-2 md:mt-3">
                <p className="text-[7px] md:text-xs text-text-400">
                    La IA puede cometer errores. Verifica toda la información.
                </p>
            </div>
        </div >
    );
};

export default ChatInput;
