

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { useToast } from '@/hooks/useToast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuthStore();
  const [, navigate] = useLocation();
  const { showSuccess, showError } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const ok = await login(email, password);
    setIsLoading(false);

    if (ok) {
      showSuccess('Admin authentication successful');
      navigate('/admin/dashboard');
    } else {
      showError('Invalid admin credentials');
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#ffffff' }}>
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 text-black relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.3) 0%,transparent 65%)' }} />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,rgba(111,232,214,0.25) 0%,transparent 65%)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-[#6fe8d6] rounded-xl flex items-center justify-center shadow-lg p-2">
             <img src="/favicon.png" alt="BadePay" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-black tracking-tight text-black">BadePay <span className="text-[#6fe8d6]">Admin</span></span>
        </div>
        <div className="relative z-10 max-w-lg mt-20">
          <ShieldCheck size={72} className="text-[#6fe8d6] mb-8 opacity-80" strokeWidth={1} />
          <h1 className="text-5xl font-black mb-6 leading-tight tracking-tight text-black">Institutional <br />Control Center.</h1>
          <p className="text-lg text-black/70 font-medium leading-relaxed">
            Securely monitor transactions, resolve disputes, and oversee the digital finance platform from one unified command center.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-sm font-bold text-black/30 uppercase tracking-widest">Version 2.0.1</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 rounded-l-[2rem] lg:rounded-l-[3rem] shadow-2xl relative z-20 overflow-y-auto"
        style={{ background: '#f5f5f5' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-black mb-2 tracking-tight">Admin Sign In</h2>
            <p className="text-sm text-black/60 font-medium">Please enter your authorized credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Admin Email"
              type="email"
              icon={<Mail size={20} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="super@badepay.app"
              required
            />
            <Input
              label="Password"
              type="password"
              icon={<Lock size={20} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-4 bg-[#6fe8d6] text-[#1a1a1a]">
              Sign In to Portal
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-black/10 text-center">
            <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <ShieldCheck size={14} /> Unauthorized Access Monitored
            </p>
            <div className="bg-white p-4 rounded-xl border border-black/10 text-left break-words">
              <p className="text-xs text-black/60 font-bold uppercase tracking-wider mb-2">Demo Credentials:</p>
              <p className="text-sm font-bold text-black mb-1 break-all">Super Admin: super@badepay.app / admin123</p>
              <p className="text-sm font-bold text-black break-all">Regular Admin: admin@badepay.app / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
