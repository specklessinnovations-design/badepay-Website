

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const [, navigate] = useLocation();
  const { user, updateProfile, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setUsername(user.username ?? user.firstName.toLowerCase().replace(/\s+/g, ''));
  }, [user]);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().replace(/^@/, '').toLowerCase(),
      });
      toast.success('Profile updated');
      navigate('/profile');
    } catch {
      toast.error('Could not update profile');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Field label="First name" value={firstName} onChange={setFirstName} />
      <Field label="Last name" value={lastName} onChange={setLastName} />
      <Field label="Username" value={username} onChange={setUsername} prefix="@" />
      <Field label="Email" value={user.email} onChange={() => {}} disabled />
      <Field label="Phone" value={user.phone || ''} onChange={() => {}} disabled />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-[#6fe8d6] py-3.5 text-sm font-semibold text-[#1a1a1a] disabled:opacity-50"
      >
        {isLoading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  prefix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-[var(--text-secondary)]">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">{prefix}</span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-[var(--text-primary)] focus:border-[#6fe8d6] focus:outline-none disabled:opacity-60 ${prefix ? 'pl-8 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}
