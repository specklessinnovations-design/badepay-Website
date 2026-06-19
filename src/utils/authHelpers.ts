/**
 * Authentication Helper Functions
 * Reusable utilities for auth validation and formatting
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate Nigerian phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Accept formats like: +2348012345678, 08012345678, 2348012345678
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+234|234|0)[0-9]{10}$/.test(cleaned);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate 4-digit PIN
 */
export const validatePIN = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

/**
 * Validate 6-digit OTP
 */
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

/**
 * Mask email for display (e.g., u***@example.com)
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
};

/**
 * Generate a random session ID
 */
export const generateSessionId = (): string => {
  return 'session_' + Math.random().toString(36).substr(2, 40);
};

/**
 * Check if a session has expired (24 hours)
 */
export const isSessionExpired = (loginTime: string): boolean => {
  const loginDate = new Date(loginTime).getTime();
  const now = new Date().getTime();
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  return now - loginDate > sessionDuration;
};

/**
 * Format time remaining for OTP expiry
 */
export const formatTimeRemaining = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get password strength indicator
 */
export const getPasswordStrengthIndicator = (
  password: string
): { strength: 'weak' | 'medium' | 'strong'; color: string } => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  if (score <= 2) return { strength: 'weak', color: '#EF4444' };
  if (score <= 3) return { strength: 'medium', color: '#F59E0B' };
  return { strength: 'strong', color: '#10B981' };
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Check if user is authenticated and session is valid
 */
export const isUserSessionValid = (lastLoginTime: string | undefined): boolean => {
  if (!lastLoginTime) return false;
  return !isSessionExpired(lastLoginTime);
};
