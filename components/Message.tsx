
import React, { useMemo } from 'react';
import { Message as MessageType, MessageSender } from '../types';
import { UserIcon, SparklesIcon } from './Icons';
import { renderMarkdown } from '../services/markdown';

const FileAttachmentDisplay: React.FC<{ file: NonNullable<MessageType['file']> }> = ({ file }) => (
    <div className="mt-4 p-3 rounded-2xl border border-white/70 bg-white/60 flex items-center gap-3 shadow-inner">
        <div className="p-2 rounded-xl bg-black text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
        <div>
            <p className="text-sm font-medium text-primary-light">{file.name}</p>
            <p className="text-xs text-secondary-light">{file.type} - {file.size}</p>
        </div>
    </div>
);


const Message: React.FC<{ message: MessageType }> = ({ message }) => {
    const isUser = message.sender === MessageSender.USER;
    const isAI = message.sender === MessageSender.AI;
    const rendered = useMemo(() => renderMarkdown(message.text), [message.text]);

    return (
        <div className="flex gap-4 items-start">
            <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${isUser ? 'bg-white text-primary-light' : 'bg-black text-white'}`}>
                {isUser && <UserIcon className="w-5 h-5" />}
                {isAI && <SparklesIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1">
                <div className={`rounded-[28px] p-5 border shadow-sm transition ${isUser ? 'bg-white text-primary-light border-white/80' : 'bg-black text-white border-black'}`}>
                    <p className="text-sm uppercase tracking-[0.3em] opacity-70">{isUser ? 'You' : 'Sylvia'}</p>
                    <div className="message-content mt-3" dangerouslySetInnerHTML={{ __html: rendered }} />
                    {message.file && <FileAttachmentDisplay file={message.file} />}
                </div>
            </div>
        </div>
    );
};

export default Message;
