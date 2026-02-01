// Professional Monochrome Theme for Resonance
export const COLORS = {
  // Core backgrounds (Professional White/Black)
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceLight: '#E9ECEF',
  surfaceGlass: 'rgba(248, 249, 250, 0.9)',

  // Primary (Black accents for depth)
  primary: '#000000',
  secondary: '#333333',
  neonCyan: '#000000',
  neonCyanDim: 'rgba(0, 0, 0, 0.05)',
  electricMagenta: '#000000',
  electricMagentaDim: 'rgba(0, 0, 0, 0.05)',

  // Text
  textPrimary: '#121212',
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',

  // Status
  success: '#2E7D32',
  warning: '#FFA000',
  error: '#D32F2F',

  // Gradients (Monochrome)
  gradientCyan: ['#000000', '#333333'],
  gradientMagenta: ['#000000', '#333333'],
  gradientCyanToMagenta: ['#000000', '#333333'],

  // Frequency Sync (Grey to Black)
  frequencyCold: '#999999',
  frequencyWarm: '#000000',

  // Game Specific
  cordDefault: '#DDDDDD',
  cordActive: '#000000',
  gridTile: '#EEEEEE',
  gridTileActive: '#CCCCCC',
  ripple: 'rgba(0, 0, 0, 0.1)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    display: 48,
  },
};

export const SHADOWS = {
  light: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  // Depth effect for buttons
  neonCyan: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  neonMagenta: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
};

// Animation timing constants
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
};

// Game constants
export const GAME = {
  tugOfWar: {
    milestones: [0.3, 0.6, 0.9],
    hapticPattern: [0, 200, 100, 200] as number[],
  },
  syncGrid: {
    matchWindow: 2000,
    gridSize: 3,
  },
  frequencySync: {
    syncThreshold: 0.05,
    holdDuration: 3000,
  },
  stamina: {
    maxGamesPerDay: 3,
    resetHours: 24,
  },
  proximity: {
    thresholdMeters: 10,
  },
};
