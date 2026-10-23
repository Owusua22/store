// src/components/auth/AuthModal.tsx
'use client';

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Icons } from '@/components/icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'register' | 'login';
}

export function AuthModal({ isOpen, onClose, defaultView = 'register' }: AuthModalProps) {
  const [view, setView] = useState<'register' | 'login'>(defaultView);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <Icons.close className="w-5 h-5" />
          </button>

          {view === 'login' ? (
            <LoginForm 
              onSuccess={onClose}
              onSwitchToRegister={() => setView('register')}
            />
          ) : (
            <RegisterForm 
              onSuccess={onClose}
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}