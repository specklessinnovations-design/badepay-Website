

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeButton?: boolean;
  backdrop?: boolean;
}

export const PremiumModal = React.forwardRef<HTMLDivElement, PremiumModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      subtitle,
      children,
      footer,
      size = 'md',
      closeButton = true,
      backdrop = true,
    },
    ref
  ) => {
    const contentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        // Reset scroll to top when modal opens
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.scrollTop = 0;
          }
        }, 0);
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'w-full h-full max-w-none max-h-none rounded-none',
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {backdrop && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
                aria-hidden="true"
              />
            )}

            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              className={`relative z-10 w-full ${size === 'full' ? 'h-full max-h-none' : 'max-h-[90vh]'} ${sizeClasses[size]} overflow-hidden ${size === 'full' ? '' : 'rounded-2xl'} border ${size === 'full' ? 'border-0' : 'border-[var(--border]'} bg-[var(--card)] ${size === 'full' ? '' : 'shadow-[var(--shadow-lg)]'} flex flex-col`}
              role="dialog"
              aria-modal="true"
            >
              {(title || closeButton) && (
                <div className="flex items-start justify-between border-b border-[var(--border)] p-6 shrink-0">
                  <div>
                    {title && (
                      <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
                    )}
                  </div>
                  {closeButton && (
                    <button
                      onClick={onClose}
                      className="ml-4 rounded-xl p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)]"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              <div ref={contentRef} className="p-6 overflow-y-auto flex-1 custom-scrollbar">{children}</div>

              {footer && (
                <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-primary)] px-6 py-4 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);

PremiumModal.displayName = 'PremiumModal';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export const ConfirmationDialog = React.forwardRef<HTMLDivElement, ConfirmationDialogProps>(
  (
    {
      isOpen,
      onClose,
      onConfirm,
      title,
      description,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDangerous = false,
      isLoading = false,
    },
    ref
  ) => {
    const [loading, setLoading] = React.useState(false);

    const handleConfirm = async () => {
      setLoading(true);
      try {
        await onConfirm();
        onClose();
      } finally {
        setLoading(false);
      }
    };

    return (
      <PremiumModal
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="sm"
        footer={
          <>
            <button
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)]"
              disabled={loading || isLoading}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                isDangerous
                  ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                  : 'bg-[#6fe8d6] text-[#1a1a1a] shadow-[0_2px_12px_rgba(111,232,214,0.25)] hover:bg-[#4dd4c0]'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={loading || isLoading}
            >
              {loading || isLoading ? 'Processing...' : confirmText}
            </button>
          </>
        }
      >
        {description && <p className="text-[var(--text-secondary)]">{description}</p>}
      </PremiumModal>
    );
  }
);

ConfirmationDialog.displayName = 'ConfirmationDialog';
