import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: 'text-red-600',
      bg: 'bg-red-50',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'text-orange-600',
      bg: 'bg-orange-50',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    info: {
      icon: 'text-blue-600',
      bg: 'bg-blue-50',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const style = variants[variant];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className="glass-panel rounded-3xl border-2 border-white/70 shadow-2xl max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-white/70">
          <div className={`${style.bg} p-3 rounded-2xl`}>
            <AlertTriangle className={`w-6 h-6 ${style.icon}`} />
          </div>
          <div className="flex-1">
            <h2 id="dialog-title" className="text-xl font-semibold text-primary-light">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-border-light dark:hover:bg-border-dark rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-secondary-light leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/70">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/70 hover:bg-white/90 border border-white/70 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${style.button} transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
