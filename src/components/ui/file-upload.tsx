/**
 * File picker that uploads straight away and hands back the public URL.
 * Click or drag a file in; shows a preview, progress, and Replace/Remove.
 * Works in the customer app and the admin portal (colours fall back between the two themes).
 */
import React, { useRef, useState } from 'react';
import { ImagePlus, Film, Loader2, RefreshCw, Trash2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UPLOAD_RULES, UploadKind, checkFile, uploadFile } from '@/lib/uploads';

const T = {
  border: 'var(--ad-border-strong, var(--border))',
  bg: 'var(--ad-bg-elev, var(--surface-secondary))',
  fg: 'var(--ad-fg-strong, var(--text-primary))',
  muted: 'var(--ad-muted, var(--text-secondary))',
};

export interface FileUploadProps {
  kind: UploadKind;
  /** Current public URL (or empty) */
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Preview shape: 'square' (logos, avatars), 'wide' (banners, covers), 'video' */
  shape?: 'square' | 'wide' | 'video';
  disabled?: boolean;
  /** Called with the upload's busy state, e.g. to disable a Save button meanwhile */
  onBusyChange?: (busy: boolean) => void;
  className?: string;
}

export function FileUpload({ kind, value, onChange, label, shape = 'wide', disabled, onBusyChange, className }: FileUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const rule = UPLOAD_RULES[kind];
  const isVideo = kind === 'content_video';
  const busy = progress !== null;

  const start = async (file: File | undefined) => {
    if (!file || disabled) return;
    const problem = checkFile(kind, file);
    if (problem) { setError(problem); return; }
    setError(null);
    setProgress(0);
    onBusyChange?.(true);
    abort.current = new AbortController();
    try {
      const uploaded = await uploadFile(kind, file, { onProgress: setProgress, signal: abort.current.signal });
      onChange(uploaded.url);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setProgress(null);
      onBusyChange?.(false);
      abort.current = null;
      if (input.current) input.current.value = '';
    }
  };

  const previewBox = cn('relative overflow-hidden rounded-lg', shape === 'square' ? 'h-24 w-24' : 'aspect-video w-full max-w-sm');

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <p className="text-xs font-semibold" style={{ color: T.fg }}>{label}</p>}
      <input
        ref={input}
        type="file"
        accept={rule.accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={(e) => void start(e.target.files?.[0])}
      />

      {value && !busy ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className={previewBox} style={{ border: `1px solid ${T.border}`, background: T.bg }}>
            {isVideo
              ? <video src={value} controls preload="metadata" className="h-full w-full object-contain" />
              : <img src={value} alt="" className="h-full w-full object-cover" />}
          </div>
          {!disabled && (
            <div className="flex gap-1.5">
              <button type="button" onClick={() => input.current?.click()}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold"
                style={{ border: `1px solid ${T.border}`, color: T.fg }}>
                <RefreshCw size={13} /> Replace
              </button>
              <button type="button" onClick={() => { onChange(''); setError(null); }}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-[#b91c1c]"
                style={{ border: `1px solid ${T.border}` }}>
                <Trash2 size={13} /> Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled || busy ? -1 : 0}
          aria-label={`Choose ${label ?? 'a file'} to upload`}
          aria-disabled={disabled || busy}
          onClick={() => !busy && input.current?.click()}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); input.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) void start(e.dataTransfer.files?.[0]); }}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            !busy && !disabled && 'cursor-pointer hover:border-[#0f766e]',
            dragging && 'border-[#0f766e]',
            disabled && 'opacity-50',
          )}
          style={{ borderColor: dragging ? '#0f766e' : T.border, background: T.bg }}
        >
          {busy ? (
            <div className="w-full max-w-xs space-y-2">
              <p className="flex items-center justify-center gap-1.5 text-sm font-medium" style={{ color: T.fg }}>
                <Loader2 size={15} className="animate-spin" /> Uploading… {progress}%
              </p>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: T.border }}>
                <div className="h-full rounded-full bg-[#0f766e] transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); abort.current?.abort(); }}
                className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: T.muted }}>
                <X size={12} /> Cancel
              </button>
            </div>
          ) : (
            <>
              {isVideo ? <Film size={22} style={{ color: T.muted }} /> : kind === 'content_image' || shape === 'wide' ? <ImagePlus size={22} style={{ color: T.muted }} /> : <UploadCloud size={22} style={{ color: T.muted }} />}
              <p className="text-sm font-semibold" style={{ color: T.fg }}>Choose a file <span className="font-normal" style={{ color: T.muted }}>or drag it here</span></p>
              <p className="text-xs" style={{ color: T.muted }}>{rule.label}</p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-[#b91c1c]" role="alert">{error}</p>}
    </div>
  );
}
