import React from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, X, Info } from 'lucide-react';
import { LOGO_BASE64 } from '@/lib/assets';

interface BPToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  t: { id: string; visible: boolean };
}

function BPToast({ message, type, t }: BPToastProps) {
  const isSuccess = type === 'success';
  const isError = type === 'error';

  const accent = isSuccess ? '#6fe8d6' : isError ? '#EF4444' : '#6fe8d6';
  const accentBg = isSuccess
    ? 'rgba(111,232,214,0.08)'
    : isError
    ? 'rgba(239,68,68,0.08)'
    : 'rgba(111,232,214,0.08)';

  const Icon = isSuccess ? CheckCircle2 : isError ? XCircle : Info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '360px',
        background: 'var(--card, #161616)',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(111,232,214,0.2)'}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: '16px',
        padding: '12px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        opacity: t.visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'auto',
      }}
    >
      <img
        src={LOGO_BASE64}
        alt="BadePay"
        style={{ height: '24px', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
      />

      <div
        style={{
          width: '1px',
          height: '20px',
          background: 'var(--border, rgba(255,255,255,0.08))',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: accentBg,
            flexShrink: 0,
          }}
        >
          <Icon size={13} style={{ color: accent }} />
        </div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: '1.4',
            color: 'var(--text-primary, #f5f5f5)',
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {message}
        </p>
      </div>

      <button
        onClick={() => toast.dismiss(t.id)}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-tertiary, #525252)',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-secondary, rgba(255,255,255,0.06))';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary, #a3a3a3)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'none';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary, #525252)';
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export const bpToast = {
  success: (message: string) =>
    toast.custom((t) => <BPToast message={message} type="success" t={t} />, {
      duration: 3500,
      position: 'top-right',
    }),

  error: (message: string) =>
    toast.custom((t) => <BPToast message={message} type="error" t={t} />, {
      duration: 4500,
      position: 'top-right',
    }),

  info: (message: string) =>
    toast.custom((t) => <BPToast message={message} type="info" t={t} />, {
      duration: 3500,
      position: 'top-right',
    }),
};
