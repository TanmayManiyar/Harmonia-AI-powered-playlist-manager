import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmationDialog
        isOpen={false}
        message="Test message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render message when isOpen is true', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Are you sure?')).toBeDefined();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        message="Test"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        message="Test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('should use custom button text', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        message="Test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmText="Yes"
        cancelText="No"
      />
    );
    
    expect(screen.getByText('Yes')).toBeDefined();
    expect(screen.getByText('No')).toBeDefined();
  });
});
