import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrustedDevice {
  id: string;
  name: string;
  isCurrent: boolean;
  lastActive: string;
}

export interface LoginHistoryEntry {
  id: string;
  device: string;
  location: string;
  timestamp: string;
  success: boolean;
}

interface PreferencesState {
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  trustedDevices: TrustedDevice[];
  loginHistory: LoginHistoryEntry[];
  setPushNotifications: (enabled: boolean) => void;
  setSmsNotifications: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  ensureCurrentDevice: () => void;
  removeDevice: (id: string) => void;
  recordLogin: (device: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      pushNotifications: true,
      smsNotifications: true,
      emailNotifications: true,
      trustedDevices: [],
      loginHistory: [],

      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
      setSmsNotifications: (enabled) => set({ smsNotifications: enabled }),
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),

      ensureCurrentDevice: () => {
        const devices = get().trustedDevices;
        if (devices.some((d) => d.isCurrent)) return;
        set({
          trustedDevices: [
            {
              id: 'device_current',
              name: typeof navigator !== 'undefined' ? getDeviceName() : 'This device',
              isCurrent: true,
              lastActive: new Date().toISOString(),
            },
            ...devices,
          ],
        });
      },

      removeDevice: (id) => {
        set((state) => ({
          trustedDevices: state.trustedDevices.filter((d) => d.id !== id || d.isCurrent),
        }));
      },

      recordLogin: (device) => {
        const entry: LoginHistoryEntry = {
          id: `login_${Date.now()}`,
          device,
          location: 'Nigeria',
          timestamp: new Date().toISOString(),
          success: true,
        };
        set((state) => ({
          loginHistory: [entry, ...state.loginHistory].slice(0, 20),
        }));
      },
    }),
    { name: 'badepay_preferences' }
  )
);

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android device';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  return 'This device';
}
