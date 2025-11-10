
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ChevronDownIcon, DocumentDuplicateIcon } from './Icons';

const Header: React.FC = () => {
    const { currentThread } = useAppContext();

    return (
        <header className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 px-8 py-6 border-b border-white/60 dark:border-white/10">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {currentThread?.title || 'Sylvia · Polaris Stack'}
                    </h1>
                    <button className="p-1 rounded-full hover:bg-white/60 transition">
                        <ChevronDownIcon className="w-4 h-4 text-secondary-light" />
                    </button>
                </div>
                <p className="text-sm text-secondary-light">
                    {currentThread ? 'Live thread intelligence feed' : 'Create a task to start building Sylvia’s memory'}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black text-white text-xs tracking-wide uppercase">
                    Polaris Alpha · 256k
                </span>
                <button className="p-3 rounded-2xl bg-white/70 hover:bg-white shadow-sm transition">
                    <DocumentDuplicateIcon className="w-5 h-5 text-secondary-light" />
                </button>
            </div>
        </header>
    );
};

export default Header;
