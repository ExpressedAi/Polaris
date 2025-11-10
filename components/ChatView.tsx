
import React, { useRef, useEffect } from 'react';
import Header from './Header';
import ChatInput from './ChatInput';
import Message from './Message';
import { useAppContext } from '../context/AppContext';

const ChatView: React.FC = () => {
    const { messages, isLoading, sendMessage } = useAppContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text: string, file?: { name: string; type: string; size: string }) => {
        if (text.trim() === '') return;
        await sendMessage(text, file);
    };

    return (
        <div className="glass-panel flex-1 flex flex-col h-full rounded-[34px] border border-white/70 dark:border-white/10 shadow-2xl overflow-hidden">
            <Header />
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 chat-canvas soft-scrollbar">
                <div className="max-w-3xl mx-auto w-full relative z-10 space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-secondary-light py-24">
                            <p className="text-sm uppercase tracking-[0.4em]">Sylvia waiting</p>
                            <h2 className="text-3xl font-semibold mt-4">No intel yet</h2>
                            <p className="text-sm max-w-sm mt-2">
                                Kick off a task and we’ll start weaving JIT memories into the Polaris context window.
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <Message key={msg.id} message={msg} />
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 items-center bg-white/70 rounded-2xl p-4 border border-white/80 shadow-inner">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-black text-white">
                                        <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Sylvia</p>
                                        <p className="text-secondary-light">Synthesizing...</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="px-4 sm:px-6 py-5 border-t border-white/70 dark:border-white/10 bg-white/60 backdrop-blur-xl">
                <div className="max-w-3xl mx-auto">
                    <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
                </div>
            </div>
        </div>
    );
};

export default ChatView;
