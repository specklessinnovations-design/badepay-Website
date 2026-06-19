

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type QrCameraScannerProps = {
  active: boolean;
  onScan: (decodedText: string) => void;
  onError?: (message: string) => void;
};

export function QrCameraScanner({ active, onScan, onError }: QrCameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [starting, setStarting] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!active) {
      handledRef.current = false;
      const stop = async () => {
        if (scannerRef.current?.isScanning) {
          try {
            await scannerRef.current.stop();
          } catch {
            /* ignore */
          }
        }
      };
      stop();
      return;
    }

    const elementId = 'badepay-qr-reader';
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;
    handledRef.current = false;
    setStarting(true);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          onScan(decodedText);
        },
        () => {
          /* scan failures between frames — ignore */
        }
      )
      .catch((err) => {
        onError?.(err?.message || 'Could not start camera');
      })
      .finally(() => setStarting(false));

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [active, onScan, onError]);

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-black">
      <div id="badepay-qr-reader" className="w-full h-full" />
      {starting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-white text-sm font-medium">Starting camera...</p>
        </div>
      )}
    </div>
  );
}
