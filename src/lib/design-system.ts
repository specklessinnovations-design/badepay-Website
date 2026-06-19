/**
 * BadePay Enterprise Design System
 * Premium banking platform visual language and component tokens
 */

export const COLORS = {
  // Brand Palette
  brand: {
    lime: '#6fe8d6',
    limeDark: '#4dd4c0',
  },

  // Dark Mode (Primary)
  dark: {
    surface: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      elevated: '#333333',
      card: '#111111',
      hover: '#1a1a1a',
    },
    border: {
      primary: '#222222',
      secondary: '#333333',
      light: '#444444',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      tertiary: '#808080',
      muted: '#606060',
    },
  },

  // Light Mode (Secondary)
  light: {
    surface: {
      primary: '#ffffff',
      secondary: '#f8f8f8',
      tertiary: '#f0f0f0',
      elevated: '#ffffff',
      card: '#fafafa',
      hover: '#f5f5f5',
    },
    border: {
      primary: '#e5e5e5',
      secondary: '#d9d9d9',
      light: '#cccccc',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#505050',
      tertiary: '#808080',
      muted: '#a0a0a0',
    },
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    successLight: '#D1FAE5',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },

  // Status Colors
  status: {
    pending: '#F59E0B',
    completed: '#10B981',
    failed: '#EF4444',
    processing: '#3B82F6',
  },
};

export const TYPOGRAPHY = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
    '7xl': '72px',
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
};

export const BORDER_RADIUS = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
};

export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  // Premium banking shadows
  premium: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
  card: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

export const TRANSITIONS = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  notification: 1090,
};

export const COMPONENT_SIZES = {
  button: {
    xs: { padding: '4px 12px', fontSize: '12px', height: '28px' },
    sm: { padding: '6px 16px', fontSize: '14px', height: '32px' },
    md: { padding: '10px 20px', fontSize: '14px', height: '40px' },
    lg: { padding: '12px 24px', fontSize: '16px', height: '48px' },
    xl: { padding: '14px 32px', fontSize: '16px', height: '56px' },
  },

  input: {
    sm: { padding: '6px 12px', fontSize: '14px', height: '32px' },
    md: { padding: '10px 16px', fontSize: '14px', height: '40px' },
    lg: { padding: '12px 20px', fontSize: '16px', height: '48px' },
  },

  card: {
    sm: { padding: '12px', borderRadius: '8px' },
    md: { padding: '16px', borderRadius: '12px' },
    lg: { padding: '24px', borderRadius: '16px' },
  },
};
