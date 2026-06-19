

import { Link } from 'wouter';

export function AuthMobileBrand() {
  return (
    <div className="mb-8 text-center lg:hidden">
      <Link href="/" className="mb-6 inline-flex flex-col items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6fe8d6] shadow-[0_0_32px_rgba(111,232,214,0.3)]"
          style={{ boxShadow: '0 0 32px rgba(111,232,214,0.25), 0 4px 16px rgba(0,0,0,0.2)' }}
        >
          <span className="text-2xl font-bold text-[#1a1a1a]">B</span>
        </div>
        <span className="text-2xl font-light tracking-[0.12em] text-[var(--text-primary)]">BadePay</span>
      </Link>
    </div>
  );
}
