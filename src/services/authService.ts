/**
 * Frontend-only Auth Service
 * Uses Local Storage as a simulated backend for authentication
 * Structured to mirror real API responses for easy backend integration
 */

import type { MerchantProfile } from '@/types/merchant';

const STORAGE_KEY = 'badepay_users';
const OTP_STORAGE_KEY = 'badepay_otps';
const SESSION_KEY = 'badepay_session';

export interface StoredUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string; // In production, this would be hashed on backend
  userType: 'consumer' | 'merchant';
  createdAt: string;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  balance: number;
  transactionPin?: string;
  kycLevel: 0 | 1 | 2 | 3;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  biometricEnabled?: boolean;
  username?: string;
  twoFactorEnabled?: boolean;
  merchantProfile?: MerchantProfile;
  isActive?: boolean;
  avatar?: string;
  lastLogin?: string;
  bvnVerified?: boolean;
  ninVerified?: boolean;
  kycSubmittedAt?: string;
}

export interface AuthResponse {
  user: StoredUser;
  token: string;
  refreshToken: string;
}

export interface OTPRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const DEMO_USER: StoredUser = {
  id: 'demo_user_001',
  email: 'demo@badepay.com',
  phone: '+2348030000000',
  firstName: 'Oluwarotimi',
  lastName: 'Adeyemi',
  password: 'Demo123',
  userType: 'consumer',
  createdAt: '2026-01-01T00:00:00.000Z',
  balance: 125800,
  accountNumber: '8391534825',
  bankName: 'BadePay Bank',
  accountName: 'Oluwarotimi Adeyemi',
  kycLevel: 2,
  kycStatus: 'approved',
  transactionPin: '1234',
  isActive: true,
  username: 'oluwarotimi',
  lastLogin: new Date().toISOString(),
};

const DEMO_MERCHANT: StoredUser = {
  id: 'demo_merchant_001',
  email: 'merchant@badepay.com',
  phone: '+2348031111111',
  firstName: 'Adaeze',
  lastName: 'Okafor',
  password: 'Merchant123',
  userType: 'merchant',
  createdAt: '2026-01-01T00:00:00.000Z',
  balance: 485200,
  accountNumber: '7263948501',
  bankName: 'BadePay Bank',
  accountName: 'Adaeze Okafor',
  kycLevel: 2,
  kycStatus: 'approved',
  transactionPin: '1234',
  isActive: true,
  lastLogin: new Date().toISOString(),
  merchantProfile: {
    businessType: 'small',
    businessName: 'Adaeze Collections',
    tradingName: 'Adaeze Collections',
    address: '12 Awolowo Road, Ikoyi, Lagos',
    rcNumber: 'RC 7823411',
    taxId: 'TIN-29481022',
    supportPhone: '+2348031111111',
    category: 'Fashion',
    payoutPreference: 'instant',
    payoutAccount: '7263948501',
    verified: true,
    merchantId: 'MID-5432-8901',
    qrSlug: 'adaezecollections',
    onboardingComplete: true,
  },
};

/**
 * Initialize Local Storage with default structure if needed.
 * Always ensures the demo user exists for presentations.
 */
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([DEMO_USER, DEMO_MERCHANT]));
  } else {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let changed = false;
    
    // Ensure demo user is correctly typed as consumer and has correct PIN
    const demoUserIdx = users.findIndex(u => u.id === 'demo_user_001');
    if (demoUserIdx === -1) {
      users.unshift(DEMO_USER);
      changed = true;
    } else if (users[demoUserIdx].userType !== 'consumer' || users[demoUserIdx].transactionPin !== '1234') {
      users[demoUserIdx] = { ...users[demoUserIdx], ...DEMO_USER, transactionPin: '1234' };
      changed = true;
    }

    // Ensure merchant demo is correctly typed as merchant and has correct PIN
    const merchantUserIdx = users.findIndex(u => u.id === 'demo_merchant_001');
    if (merchantUserIdx === -1) {
      users.push(DEMO_MERCHANT);
      changed = true;
    } else if (users[merchantUserIdx].userType !== 'merchant' || users[merchantUserIdx].transactionPin !== '1234') {
      users[merchantUserIdx] = { ...users[merchantUserIdx], ...DEMO_MERCHANT, transactionPin: '1234' };
      changed = true;
    }

    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  if (!localStorage.getItem(OTP_STORAGE_KEY)) {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify([]));
  }
}

/**
 * Get all stored users
 */
function getAllUsers(): StoredUser[] {
  initializeStorage();
  const users = localStorage.getItem(STORAGE_KEY);
  return users ? JSON.parse(users) : [];
}

/**
 * Save users to Local Storage
 */
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

/**
 * Find user by email
 */
function findUserByEmail(email: string): StoredUser | null {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Find user by phone
 */
function findUserByPhone(phone: string): StoredUser | null {
  const users = getAllUsers();
  return users.find((u) => u.phone === phone) || null;
}

/**
 * Generate a simple OTP (in production, send via email/SMS)
 * Demo mode: always returns 123456 so the UI demo code always works.
 */
function generateOTP(): string {
  return '123456';
}

/**
 * Store OTP for later verification
 */
function storeOTP(email: string, code: string) {
  const otps = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '[]') as OTPRecord[];
  
  // Remove old OTP for this email
  const filtered = otps.filter((o) => o.email !== email);
  
  // Add new OTP (valid for 5 minutes)
  filtered.push({
    email,
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });
  
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Verify OTP
 * Demo mode: '123456' is always accepted as a master bypass code.
 */
function verifyOTPCode(email: string, code: string): boolean {
  if (code === '123456') return true;

  const otps = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '[]') as OTPRecord[];
  const otp = otps.find((o) => o.email === email);
  
  if (!otp) return false;
  if (Date.now() > otp.expiresAt) return false;
  if (otp.code !== code) {
    otp.attempts += 1;
    if (otp.attempts >= 3) {
      // Remove OTP after 3 failed attempts
      const filtered = otps.filter((o) => o.email !== email);
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filtered));
    } else {
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    }
    return false;
  }
  
  // Remove used OTP
  const filtered = otps.filter((o) => o.email !== email);
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filtered));
  
  return true;
}

/**
 * Delete a user (for incomplete registrations)
 */
export async function deleteUser(email: string): Promise<void> {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
  saveUsers(filtered);
  
  // Also remove any OTP for this email
  const otps = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '[]') as OTPRecord[];
  const filteredOtps = otps.filter((o) => o.email !== email);
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filteredOtps));
}

/**
 * Resend OTP for an existing user
 */
export async function resendOTP(email: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if user exists
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Generate and store new OTP
  const otp = generateOTP();
  storeOTP(email, otp);

  // In production, send OTP via email
  console.log(`[MOCK] Resent OTP for ${email}: ${otp}`);

  return otp;
}

/**
 * Generate session tokens
 */
function generateTokens() {
  const token = 'token_' + Math.random().toString(36).substr(2, 40);
  const refreshToken = 'refresh_' + Math.random().toString(36).substr(2, 40);
  return { token, refreshToken };
}

/**
 * Register a new user
 */
export async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  userType: 'consumer' | 'merchant';
}): Promise<{ user: StoredUser; otp: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Validate input
  if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.password) {
    throw new Error('All fields are required');
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Invalid email format');
  }

  // Validate phone format (accept any number with 10-13 digits)
  const digitsOnly = data.phone.replace(/[\s\-\+]/g, '').replace(/^234/, '').replace(/^0/, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 13 || !/^\d+$/.test(digitsOnly)) {
    throw new Error('Enter a valid phone number');
  }

  // Validate password strength (demo-friendly: just 6+ chars)
  if (data.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check for duplicate email
  if (findUserByEmail(data.email)) {
    throw new Error('Email already registered');
  }

  // Check for duplicate phone
  if (findUserByPhone(data.phone)) {
    throw new Error('Phone number already registered');
  }

  // Create new user
  const newUser: StoredUser = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email: data.email,
    phone: data.phone,
    firstName: data.firstName,
    lastName: data.lastName,
    password: data.password, // In production, hash this
    userType: data.userType,
    createdAt: new Date().toISOString(),
    balance: 0,
    kycLevel: 0,
    kycStatus: 'pending',
    isActive: true,
  };

  // Generate BadePay account details for all users
  newUser.accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  newUser.bankName = 'BadePay Bank';
  newUser.accountName = `${data.firstName} ${data.lastName}`;

  if (data.userType === 'consumer') {
    newUser.username = data.firstName.toLowerCase().replace(/\s+/g, '');
  }

  // Save user (but not authenticated yet - needs OTP verification)
  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  // Generate and store OTP
  const otp = generateOTP();
  storeOTP(data.email, otp);

  // In production, send OTP via email
  console.log(`[MOCK] OTP for ${data.email}: ${otp}`);

  return { user: newUser, otp };
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.isActive === false) {
    throw new Error('Your account has been suspended. Contact support.');
  }

  const settings = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('badepay_platform_settings') || '{}')
    : {};
  if (settings.maintenanceMode && user.userType !== 'merchant') {
    throw new Error('Platform is under maintenance. Please try again later.');
  }

  // Verify password
  if (user.password !== password) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const { token, refreshToken } = generateTokens();

  // Store session
  const session = {
    userId: user.id,
    token,
    refreshToken,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return {
    user,
    token,
    refreshToken,
  };
}

/**
 * Verify OTP after registration
 */
export async function verifyOTP(email: string, otp: string): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate input
  if (!email || !otp) {
    throw new Error('Email and OTP are required');
  }

  if (otp.length !== 6) {
    throw new Error('OTP must be 6 digits');
  }

  // Verify OTP
  if (!verifyOTPCode(email, otp)) {
    throw new Error('Invalid or expired OTP');
  }

  // Find user
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Update user KYC level
  user.kycLevel = 1;

  // Save updated user
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
    saveUsers(users);
  }

  // Generate tokens
  const { token, refreshToken } = generateTokens();

  // Store session
  const session = {
    userId: user.id,
    token,
    refreshToken,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return {
    user,
    token,
    refreshToken,
  };
}

/**
 * Send OTP for password reset
 */
export async function sendPasswordResetOTP(email: string): Promise<{ otp: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate email
  if (!email) {
    throw new Error('Email is required');
  }

  // Check if user exists
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Email not found');
  }

  // Generate and store OTP
  const otp = generateOTP();
  storeOTP(email, otp);

  // In production, send OTP via email
  console.log(`[MOCK] Password reset OTP for ${email}: ${otp}`);

  return { otp };
}

/**
 * Reset password with OTP
 */
export async function resetPassword(email: string, newPassword: string, otp: string): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 700));

  // Validate input
  if (!email || !newPassword || !otp) {
    throw new Error('All fields are required');
  }

  // Validate password strength (demo-friendly)
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Verify OTP
  if (!verifyOTPCode(email, otp)) {
    throw new Error('Invalid or expired OTP');
  }

  // Find and update user
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  user.password = newPassword;

  // Save updated user
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
    saveUsers(users);
  }
}

/**
 * Set transaction PIN
 */
export async function setTransactionPIN(userId: string, pin: string): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate PIN
  if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
    throw new Error('PIN must be 4 digits');
  }

  // Find and update user
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.transactionPin = pin;
  saveUsers(users);
}

/**
 * Verify transaction PIN
 */
export async function verifyTransactionPIN(userId: string, pin: string): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Validate PIN format
  if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
    throw new Error('PIN must be 4 digits');
  }

  // Find user
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify PIN
  if (!user.transactionPin) {
    throw new Error('Transaction PIN not set');
  }

  return user.transactionPin === pin;
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Get current session
 */
export function getSession() {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): StoredUser | null {
  const users = getAllUsers();
  return users.find((u) => u.id === userId) || null;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<StoredUser>): Promise<StoredUser> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Don't allow updating certain fields
  const { id, email, phone, password, createdAt, ...allowedUpdates } = updates;

  const updatedUser = { ...user, ...allowedUpdates };
  const index = users.findIndex((u) => u.id === userId);
  users[index] = updatedUser;
  saveUsers(users);

  return updatedUser;
}

/**
 * Update user balance
 */
export async function updateUserBalance(userId: string, amount: number): Promise<void> {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.balance += amount;
  const index = users.findIndex((u) => u.id === userId);
  users[index] = user;
  saveUsers(users);
}

/**
 * Get all stored users (for merchant lookup)
 */
export function listUsers(): StoredUser[] {
  return getAllUsers();
}

/**
 * Export for backward compatibility
 */
export const authService = {
  register,
  login,
  logout,
  verifyOTP,
  sendPasswordResetOTP,
  resetPassword,
  setTransactionPIN: setTransactionPIN,
  verifyTransactionPIN: verifyTransactionPIN,
  getSession,
  getUserById,
  updateUserProfile,
  updateUserBalance,
  listUsers,
};
