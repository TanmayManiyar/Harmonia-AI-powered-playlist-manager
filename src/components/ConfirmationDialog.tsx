import React from 'react';
import { Button } from './ui/button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * ConfirmationDialog — a small editorial confirm/cancel modal.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-5"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-6 text-[0.95rem] leading-relaxed text-ink-soft">{message}</p>
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant="accent" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
