import React, { useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ShieldCheck, X, AlertTriangle, CheckCircle2, Store, UserCircle2, Lock, ChevronRight, Loader2, Image as ImageIcon, Keyboard } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';
import { Scanner } from '@yudiel/react-qr-scanner';

type Step = 'scan' | 'pay' | 'confirm' | 'pin' | 'success';
type RecipientType = 'merchant' | 'personal';

interface ScanResult {
  type: RecipientType;
  merchant?: {
    tradingName: string;
    businessName: string;
    qrSlug: string;
    merchantAccountNumber?: string;
    category?: string;
    address?: string;
    avatarUrl?: string;
    verified?: boolean;
    store?: { name: string };
  };
  user?: {
    displayName: string;
    accountNumber: string;
    avatarUrl?: string;
    firstName: string;
    lastName: string;
  };
  preFilledAmount?: number | null;
  dynamicReference?: string | null;
  isDynamic?: boolean;
  amountLocked?: boolean;
  fee?: number;
  /** What the payer can choose to pay for (tithe, offering, a service…) */
  items?: QrItem[];
}

interface QrItem {
  id: string;
  name: string;
  description?: string;
  type: 'physical' | 'service' | 'donation';
  pricing: 'fixed' | 'open';
  price: number;
  minAmount: number | null;
  imageUrl: string | null;
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
const itemPriceLabel = (i: QrItem) =>
  i.pricing === 'fixed' ? naira(i.price) : i.minAmount ? `Any amount from ${naira(i.minAmount)}` : 'Any amount';

export default function ScanPayPage() {
  const [, navigate] = useLocation();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('scan');
  const [scannedData, setScannedData] = useState<ScanResult | null>(null);
  const [recipientType, setRecipientType] = useState<RecipientType>('merchant');
  const [amount, setAmount] = useState('');
  const [pinError, setPinError] = useState('');
  const [scanError, setScanError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [pin, setPin] = useState('');
  const [itemId, setItemId] = useState<string>('');
  const [note, setNote] = useState('');
  const [scannedCode, setScannedCode] = useState<string | undefined>();
  const scanLockRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const userBalance = user?.balance ?? 0;
  const fee = scannedData?.fee ?? 0;
  const payAmt = parseFloat(amount) || 0;
  const totalDebit = payAmt + fee;
  const isDynamic = scannedData?.isDynamic || !!scannedData?.dynamicReference;
  const items = scannedData?.items ?? [];
  const selectedItem = items.find((i) => i.id === itemId) ?? null;
  const amountLocked = (isDynamic || !!scannedData?.amountLocked) && !!scannedData?.preFilledAmount
    || selectedItem?.pricing === 'fixed';
  const itemMin = selectedItem?.pricing === 'open' ? Math.max(10, selectedItem.minAmount ?? 0) : 10;

  const chooseItem = (id: string) => {
    setItemId(id);
    const item = items.find((i) => i.id === id);
    if (item?.pricing === 'fixed') setAmount(String(item.price));
    else if (item && item.price > 0) setAmount(String(item.price));
    setPinError('');
  };

  const recipientName = recipientType === 'merchant'
    ? (scannedData?.merchant?.tradingName || scannedData?.merchant?.businessName || '')
    : (scannedData?.user?.displayName || '');

  const recipientAccount = recipientType === 'merchant'
    ? (scannedData?.merchant?.merchantAccountNumber || scannedData?.merchant?.qrSlug || '')
    : (scannedData?.user?.accountNumber || '');

  const recipientAvatar = recipientType === 'merchant'
    ? scannedData?.merchant?.avatarUrl
    : scannedData?.user?.avatarUrl;

  const handleScanCode = useCallback(async (rawCode: string) => {
    if (scanLockRef.current || loading || step !== 'scan') return;
    const code = rawCode?.trim();
    if (!code) return;

    scanLockRef.current = true;
    setLoading(true);
    setScanError('');

    try {
      const scanResult: ScanResult = await authService.scanQrCode(code);
      setScannedData(scanResult);
      setScannedCode(/\/payments\/pay\//.test(code) ? code : undefined);
      setItemId('');
      setNote('');
      setRecipientType(scanResult.type);

      if (scanResult.preFilledAmount) {
        setAmount(String(scanResult.preFilledAmount));
      } else {
        setAmount('');
      }

      setStep('pay');
    } catch (err: any) {
      setScanError(err?.message || 'Failed to scan QR code. Please try again.');
      scanLockRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [loading, step]);

  /** Reads a QR code from a photo or screenshot. */
  const handleQrImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const reader = new Html5Qrcode('qr-file-reader');
      const code = await reader.scanFile(file, false);
      await handleScanCode(code);
    } catch {
      setScanError('No QR code found in that image. Try a clearer photo.');
    }
  };

  const handleContinueToConfirm = () => {
    if (!user?.hasPinSet) {
      toast.error('Please set your transaction PIN first');
      navigate('/profile/change-pin');
      return;
    }
    if (items.length && !itemId && itemId !== 'general') {
      setPinError('Choose what you are paying for.');
      return;
    }
    if (payAmt < itemMin) {
      setPinError(`Minimum ${selectedItem ? `for ${selectedItem.name} ` : ''}is ${naira(itemMin)}.`);
      return;
    }
    if (totalDebit > userBalance) {
      setPinError('Insufficient Balance. Please fund your account and try again.');
      return;
    }
    setPinError('');
    setStep('confirm');
  };

  const handleConfirmPayment = () => {
    setPinError('');
    setStep('pin');
  };

  const handlePay = async (enteredPin: string) => {
    if (!user || !scannedData) return;

    if (totalDebit > userBalance) {
      setPinError('Insufficient Balance. Please fund your account and try again.');
      return;
    }
    if (!/^\d{4}$/.test(enteredPin)) {
      setPinError('PIN must be 4 digits.');
      return;
    }

    setLoading(true);
    setPinError('');

    try {
      const merchantSlug = recipientType === 'merchant'
        ? scannedData.merchant!.qrSlug
        : scannedData.user!.accountNumber;

      const result = await authService.payQrCode({
        merchantSlug,
        amount: payAmt,
        pin: enteredPin,
        recipientType,
        dynamicReference: scannedData.dynamicReference || undefined,
        idempotencyKey: scannedData.dynamicReference
          ? `qr-${scannedData.dynamicReference}`
          : undefined,
        payLink: scannedCode,
        productId: selectedItem?.id,
        note: note.trim() || undefined,
      });

      setPaymentRef(result?.reference || result?.data?.reference || '');
      setSuccessMsg(`₦${payAmt.toLocaleString()} ${selectedItem ? `for ${selectedItem.name} ` : ''}sent to ${recipientName} successfully.`);
      setStep('success');
    } catch (err: any) {
      setPinError(err?.message || 'Payment failed. Please check your PIN and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setScannedData(null);
    setAmount('');
    setPinError('');
    setScanError('');
    setSuccessMsg('');
    setPaymentRef('');
    setRecipientType('merchant');
    setPin('');
    setItemId('');
    setNote('');
    setScannedCode(undefined);
    scanLockRef.current = false;
  };

  const showModal = step !== 'scan';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#070707' }}>
      {/* Header */}
      <div className="px-6 pt-2 flex items-center justify-between">
        <Link to="/home" className="h-10 w-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
          <ArrowLeft size={16} />
        </Link>
        <div className="text-sm font-medium text-white">Scan to pay</div>
        <Link
          to="/profile/my-qr"
          className="h-10 px-3 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white text-xs font-medium"
        >
          My QR
        </Link>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {scanError ? (
          <div className="text-center max-w-[280px]">
            <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <p className="text-red-400 text-sm mb-4">{scanError}</p>
            <button
              onClick={() => { setScanError(''); scanLockRef.current = false; }}
              className="rounded-2xl bg-white/10 backdrop-blur px-6 py-3 text-white text-sm font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="relative h-[280px] w-[280px] rounded-3xl overflow-hidden">
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes && detectedCodes.length > 0) {
                    handleScanCode(detectedCodes[0].rawValue);
                  }
                }}
                onError={() => setScanError('Camera access denied. Please allow camera permissions.')}
                constraints={{ facingMode: 'environment' }}
                formats={['qr_code']}
                scanDelay={800}
                paused={step !== 'scan' || loading}
                classNames={{ container: 'w-full h-full' }}
              />
              <div className="absolute inset-0 pointer-events-none">
                {[
                  'top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl',
                  'top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl',
                  'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl',
                  'bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl',
                ].map((c) => (
                  <div key={c} className={`absolute h-12 w-12 border-[#6fe8d6] ${c}`} />
                ))}
              </div>
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={40} className="h-10 w-10 border-4 border-white/30 border-t-[#6fe8d6] rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="mt-10 text-center max-w-[280px]">
              <div className="text-white text-lg font-semibold">
                {loading ? 'Reading QR code…' : 'Hold steady'}
              </div>
              <p className="mt-2 text-white/60 text-sm">
                Point your camera at a BadePay personal or merchant QR code.
              </p>
            </div>

          </>
        )}
        {/* No camera? Read a photo of the code, or type/paste it (same as the mobile app). */}
            <div className="mt-6 grid w-full max-w-[280px] grid-cols-2 gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
                <ImageIcon size={14} /> Upload image
              </button>
              <button type="button" onClick={() => setManualOpen((v) => !v)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-white">
                <Keyboard size={14} /> Enter code
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleQrImage} />
            <div id="qr-file-reader" className="hidden" />
            {manualOpen && (
              <form className="mt-3 flex w-full max-w-[280px] gap-2" onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) void handleScanCode(manualCode); }}>
                <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="QR link or account number" aria-label="QR code or account number"
                  className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40" />
                <button type="submit" className="rounded-xl bg-[#6fe8d6] px-3 text-sm font-semibold text-[#1a1a1a]">Go</button>
              </form>
            )}
      </div>

      <div className="px-6 pb-10">
        <div className="flex items-center justify-center gap-2 text-xs text-white/50">
          <ShieldCheck size={14} /> Encrypted · PIN protected · Verified accounts
        </div>
      </div>

      {/* Step: Enter amount */}
      {showModal && step === 'pay' && scannedData && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[420px] rounded-t-3xl bg-background border border-border-strong overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <p className="text-sm font-semibold">{isDynamic ? 'Review Payment' : 'Send Payment'}</p>
              <button onClick={handleReset} className="h-8 w-8 rounded-full surface-2 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-2 border border-border">
                  <RecipientAvatar type={recipientType} avatarUrl={recipientAvatar} name={recipientName} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {recipientType === 'merchant' ? 'Merchant' : 'Personal Account'}
                    </span>
                    <p className="text-sm font-bold truncate">{recipientName}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{recipientAccount}</p>
                  </div>
                </div>

                {isDynamic && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-primary">
                    Amount pre-set by merchant — review and confirm to pay.
                  </div>
                )}

                {items.length > 0 && (
                  <fieldset>
                    <legend className="text-xs uppercase tracking-widest text-muted-foreground mb-2">What are you paying for?</legend>
                    <div className="flex flex-col gap-2" role="radiogroup">
                      {[...items, { id: 'general', name: 'Something else', pricing: 'open', price: 0, minAmount: null, imageUrl: null, type: 'donation' } as QrItem].map((i) => {
                        const on = itemId === i.id;
                        return (
                          <button
                            key={i.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => chooseItem(i.id)}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${on ? 'border-[#6fe8d6] bg-[#6fe8d6]/10' : 'border-border surface-2'}`}
                          >
                            {i.imageUrl
                              ? <img src={i.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                              : <span className={`h-4 w-4 rounded-full border-2 ${on ? 'border-[#6fe8d6] bg-[#6fe8d6]' : 'border-muted-foreground'}`} />}
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold truncate">{i.name}</span>
                              <span className="block text-xs text-muted-foreground">{i.id === 'general' ? 'Any amount' : itemPriceLabel(i)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                    {isDynamic ? 'Amount' : 'Amount to send'}
                  </label>
                  <div className={`rounded-xl surface-2 flex items-center px-4 gap-2 border border-border ${amountLocked ? 'opacity-70' : ''}`}>
                    <span className="text-sm text-muted-foreground font-semibold">₦</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => !amountLocked && setAmount(e.target.value)}
                      readOnly={amountLocked}
                      placeholder="0.00"
                      className="flex-1 bg-transparent py-3 text-lg font-bold outline-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Available balance: ₦{userBalance.toLocaleString()}
                    {selectedItem?.pricing === 'open' && selectedItem.minAmount ? ` · minimum ${naira(selectedItem.minAmount)}` : ''}
                  </p>
                </div>

                {recipientType === 'merchant' && !isDynamic && (
                  <div>
                    <label htmlFor="pay-note" className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Note <span className="normal-case tracking-normal">(optional)</span></label>
                    <input
                      id="pay-note"
                      value={note}
                      maxLength={140}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. member name or envelope number"
                      className="w-full rounded-xl surface-2 border border-border px-4 py-3 text-sm outline-none"
                    />
                  </div>
                )}

                {pinError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={16} /> {pinError}
                  </div>
                )}

                <button
                  onClick={handleContinueToConfirm}
                  disabled={!amount || payAmt <= 0}
                  className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {showModal && step === 'confirm' && scannedData && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[420px] rounded-t-3xl bg-background border border-border-strong overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <p className="text-sm font-semibold">Confirm Payment</p>
              <button onClick={() => setStep('pay')} className="h-8 w-8 rounded-full surface-2 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl surface-2 border border-border divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground">Recipient</span>
                    <span className="text-sm font-semibold text-right max-w-[180px] truncate">{recipientName}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground">Account</span>
                    <span className="text-sm font-mono">{recipientAccount}</span>
                  </div>
                  {selectedItem && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-muted-foreground">For</span>
                      <span className="text-sm font-semibold text-right max-w-[180px] truncate">{selectedItem.name}</span>
                    </div>
                  )}
                  {note.trim() && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-xs text-muted-foreground">Note</span>
                      <span className="text-sm text-right max-w-[200px] truncate">{note.trim()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground">Amount</span>
                    <span className="text-sm font-semibold">₦{payAmt.toLocaleString()}</span>
                  </div>
                  {fee > 0 && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-muted-foreground">Transaction fee</span>
                      <span className="text-sm font-semibold">₦{fee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                    <span className="text-xs font-semibold">Total debit</span>
                    <span className="text-base font-bold text-primary">₦{totalDebit.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock size={14} /> You will be asked for your transaction PIN next.
                </div>

                <button
                  onClick={handleConfirmPayment}
                  className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground text-sm font-semibold"
                >
                  Confirm & Pay ₦{totalDebit.toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: PIN */}
      {showModal && step === 'pin' && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[420px] rounded-t-3xl bg-background border border-border-strong overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <p className="text-sm font-semibold">Authorize Payment</p>
              <button onClick={() => setStep('confirm')} className="h-8 w-8 rounded-full surface-2 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col gap-4">
                <div className="text-center p-3 rounded-xl surface-2 border border-border">
                  <p className="text-xs text-muted-foreground">Paying</p>
                  <p className="text-lg font-bold text-primary">₦{totalDebit.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">to {recipientName}</p>
                </div>

                {pinError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs text-red-400 flex items-center justify-center gap-1.5">
                    <AlertTriangle size={16} /> {pinError}
                  </div>
                )}

                <PinPad
                  label="Enter Transaction PIN"
                  sublabel="4-digit PIN to authorize this payment"
                  onComplete={handlePay}
                  onCancel={() => setStep('confirm')}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {showModal && step === 'success' && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-[420px] rounded-t-3xl bg-background border border-border-strong overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <p className="text-sm font-semibold">Payment Successful</p>
              <button onClick={handleReset} className="h-8 w-8 rounded-full surface-2 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col items-center justify-center text-center py-6 gap-4">
                <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={36} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Payment completed!</p>
                  <p className="text-xs text-muted-foreground mt-1 px-4">{successMsg}</p>
                  {paymentRef && (
                    <p className="text-xs text-muted-foreground mt-2 font-mono">Ref: {paymentRef}</p>
                  )}
                </div>
                <div className="w-full flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => { handleReset(); navigate('/home'); }}
                    className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground text-sm font-semibold"
                  >
                    Done
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full h-12 rounded-2xl surface-2 text-sm font-medium"
                  >
                    Scan another QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecipientAvatar({ type, avatarUrl, name }: { type: RecipientType; avatarUrl?: string; name: string }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name} className="h-14 w-14 rounded-2xl object-cover border border-border" />
    );
  }
  return (
    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
      {type === 'merchant' ? (
        <Store size={28} className="text-primary" />
      ) : (
        <UserCircle2 size={28} className="text-primary" />
      )}
    </div>
  );
}

function PinPad({
  label, sublabel, onComplete, onCancel, length = 4, loading = false,
}: {
  label: string; sublabel?: string;
  onComplete: (pin: string) => void;
  onCancel: () => void;
  length?: number;
  loading?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>([]);
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  const press = (d: string) => {
    if (loading || digits.length >= length) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === length) {
      setTimeout(() => onComplete(next.join('')), 150);
    }
  };

  const del = () => {
    if (loading) return;
    setDigits(c => c.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-6 pt-2">
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
      </div>
      <div className="flex gap-4">
        {Array.from({ length }).map((_, i) => (
          <div key={i} className={`h-3 w-3 rounded-full transition-all duration-150 ${i < digits.length ? 'bg-primary scale-110' : 'border-2 border-border-strong'}`} />
        ))}
      </div>
      {loading ? (
        <div className="h-14 flex items-center justify-center">
          <Loader2 size={32} className="h-8 w-8 border-4 border-border-strong border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {keys.map((k, i) => (
            <button
              key={i}
              disabled={k === '' || loading}
              onClick={() => k === '⌫' ? del() : k !== '' && press(k)}
              className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95 ${
                k === '' ? 'invisible' :
                k === '⌫' ? 'surface-2 text-muted-foreground text-sm' :
                'surface-2 hover:bg-surface-3 text-foreground'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      )}
      <button onClick={onCancel} disabled={loading} className="text-xs text-muted-foreground underline underline-offset-2 mt-1 disabled:opacity-50">
        Cancel
      </button>
    </div>
  );
}
