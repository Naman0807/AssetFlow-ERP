'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg',
      type === 'success' && 'bg-green-50 border border-green-200',
      type === 'error' && 'bg-red-50 border border-red-200',
    )}>
      {type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
      {type === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
      <p className={cn('text-sm font-medium', type === 'success' && 'text-green-800', type === 'error' && 'text-red-800')}>
        {message}
      </p>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
