import React from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ title, subtitle, children }) => {
  return (
    <div className="glass-panel flex-1 h-full rounded-[34px] border border-white/70 shadow-2xl overflow-hidden flex flex-col">
      <div className="px-8 py-6 border-b border-white/70 flex-shrink-0">
        <p className="text-xs uppercase tracking-[0.3em] text-secondary-light">Sylvia Workspace</p>
        <h1 className="text-3xl font-semibold mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-secondary-light mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 invisible-scrollbar">
        {children}
      </div>
    </div>
  );
};

export default PageShell;
