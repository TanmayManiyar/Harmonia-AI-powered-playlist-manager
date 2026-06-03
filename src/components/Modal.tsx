import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './layout.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Visual width preset */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Modal — centered glass card over a blurred backdrop.
 * Closes on overlay click, Esc, or the close button. Locks body scroll.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-card modal-card--${size} glass ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="modal-head">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button className="modal-close modal-close--floating" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
