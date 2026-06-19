import { toast } from 'react-hot-toast';

export function useToast() {
  const showSuccess = (message: string) => {
    toast.success(message, {
      style: {
        borderLeft: '4px solid #10B981',
        padding: '16px',
        color: '#0A1628',
        fontWeight: 600,
        background: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      iconTheme: {
        primary: '#10B981',
        secondary: '#ffffff',
      },
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      style: {
        borderLeft: '4px solid #EF4444',
        padding: '16px',
        color: '#0A1628',
        fontWeight: 600,
        background: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      iconTheme: {
        primary: '#EF4444',
        secondary: '#ffffff',
      },
    });
  };

  return { showSuccess, showError };
}
