import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Divider } from '@astryxdesign/core/Divider';
import { useApp } from '../context/AppContext';
import { AlertCircle, Mail, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithFacebook, loginByEmail } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const handleOAuthGoogle = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi đăng nhập Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthFacebook = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signInWithFacebook();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi đăng nhập Facebook.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!clean.includes('@') || !clean.includes('.')) {
      setErrorMessage('Địa chỉ email không hợp lệ (ví dụ: name@gmail.com).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await loginByEmail(clean);
      if (res.success) {
        setEmailInput('');
        onClose();
      } else {
        setErrorMessage(res.error || 'Đăng nhập không thành công.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi đăng nhập bằng email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setErrorMessage('');
          onClose();
        }
      }}
      width={480}
      padding={4}
    >
      <VStack gap={4}>
        <DialogHeader
          title="Đăng nhập"
          subtitle="Kết nối sân cầu lông & cộng đồng đam mê thể thao"
          onOpenChange={(open) => {
            if (!open) {
              setErrorMessage('');
              onClose();
            }
          }}
        />

        {errorMessage && (
          <HStack
            gap={2}
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-element)',
              background: '#fee2e2',
              color: '#991b1b',
              alignItems: 'center',
            }}
          >
            <AlertCircle size={16} />
            <Text type="supporting" style={{ color: '#991b1b' }}>
              {errorMessage}
            </Text>
          </HStack>
        )}

        {/* 1. Direct Email Input Form */}
        <form onSubmit={handleEmailSubmit} style={{ width: '100%' }}>
          <VStack gap={2}>
            <Text weight="medium" style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Đăng nhập bằng Email
            </Text>
            <HStack
              gap={2}
              style={{
                alignItems: 'center',
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderRadius: 'var(--radius-element)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-background-surface)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <Mail size={18} style={{ color: 'var(--color-icon-tertiary)', flexShrink: 0 }} />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Nhập email của bạn (vd: nidhong99@gmail.com)..."
                disabled={isLoading}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '14px',
                  color: 'var(--color-text-primary)',
                }}
              />
            </HStack>

            <button
              type="submit"
              disabled={isLoading || !emailInput.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-2)',
                width: '100%',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-element)',
                border: 'none',
                background: 'var(--color-primary-base, #10b981)',
                color: '#ffffff',
                cursor: isLoading || !emailInput.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '15px',
                opacity: isLoading || !emailInput.trim() ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Text weight="semibold" style={{ color: '#ffffff' }}>
                {isLoading ? 'Đang xử lý...' : 'Tiếp tục với Email'}
              </Text>
              <ArrowRight size={16} color="#ffffff" />
            </button>
          </VStack>
        </form>

        {/* 2. Divider */}
        <Divider label="hoặc tiếp tục với" variant="subtle" />

        {/* 3. OAuth Social Buttons */}
        <VStack gap={3}>
          {/* Google Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleOAuthGoogle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-2)',
              width: '100%',
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-element)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-background-surface)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              transition: 'background 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <Text weight="semibold">Tiếp tục bằng tài khoản Google (Gmail)</Text>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleOAuthFacebook}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-2)',
              width: '100%',
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-element)',
              border: '1px solid #1877F2',
              background: '#1877F2',
              color: '#ffffff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              transition: 'opacity 0.2s',
            }}
          >
            <svg width="20" height="20" fill="#ffffff" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <Text weight="semibold" style={{ color: '#ffffff' }}>Tiếp tục bằng tài khoản Facebook</Text>
          </button>
        </VStack>
      </VStack>
    </Dialog>
  );
};
