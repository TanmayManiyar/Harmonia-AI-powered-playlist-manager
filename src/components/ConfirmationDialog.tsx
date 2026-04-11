import React from 'react';
import './components.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * ConfirmationDialog component - Displays a modal confirmation dialog
 * Shows confirmation message with confirm and cancel buttons
 * Handles user response with callbacks
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-message">{message}</div>
        <div className="dialog-actions">
          <button className="cancel-button" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
