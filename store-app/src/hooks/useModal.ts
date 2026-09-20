import { useState } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const useModal = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = (options: Partial<ModalState>) => {
    setModal({
      isOpen: true,
      title: options.title || '',
      message: options.message || '',
      type: options.type || 'info',
      onConfirm: options.onConfirm,
      confirmText: options.confirmText || 'تأیید',
      cancelText: options.cancelText || 'انصراف',
      showCancel: options.showCancel || false
    });
  };

  const hideModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Helper functions for different types
  const showSuccess = (title: string, message: string) => {
    showModal({ title, message, type: 'success' });
  };

  const showError = (title: string, message: string) => {
    showModal({ title, message, type: 'error' });
  };

  const showWarning = (title: string, message: string) => {
    showModal({ title, message, type: 'warning' });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'تأیید',
    cancelText: string = 'انصراف'
  ) => {
    showModal({ 
      title, 
      message, 
      type: 'warning', 
      onConfirm, 
      confirmText, 
      cancelText, 
      showCancel: true 
    });
  };

  return {
    modal,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showConfirm
  };
};