
import React, { useState, useRef, useEffect } from 'react';
import { PaperclipIcon, ArrowUpIcon } from './Icons';

interface ChatInputProps {
    onSendMessage: (text: string, file?: { name: string; type: string; size: string }) => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [text]);
    
    const handleSend = () => {
        if (text.trim() && !disabled) {
            onSendMessage(text);
            setText('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !disabled) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative">
            <div className="flex items-end gap-3 p-3 rounded-[26px] border border-white/80 bg-white/90 shadow-inner focus-within:ring-2 focus-within:ring-black/40 transition-all">
                <button className="p-3 rounded-2xl bg-white shadow-sm hover:-translate-y-0.5 transition disabled:opacity-50" disabled={disabled}>
                    <PaperclipIcon className="w-5 h-5 text-secondary-light" />
                </button>
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send intel to Sylvia"
                    disabled={disabled}
                    className="flex-1 bg-transparent resize-none outline-none max-h-48 text-primary-light placeholder:text-secondary-light disabled:opacity-50"
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || disabled}
                    className="p-3 rounded-2xl bg-black text-white flex-shrink-0 transition disabled:bg-gray-300 hover:-translate-y-0.5"
                >
                    <ArrowUpIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
