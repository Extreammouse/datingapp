// Midnight Tech-Noir Theme for Resonance
export const COLORS = {
  // Core backgrounds
  background: '#0A0A0A',
  surface: '#141414',
  surfaceLight: '#1E1E1E',
  surfaceGlass: 'rgba(20, 20, 20, 0.8)',

  // Accent colors
  neonCyan: '#00FFFF',
  neonCyanDim: 'rgba(0, 255, 255, 0.3)',
  electricMagenta: '#FF00FF',
  electricMagentaDim: 'rgba(255, 0, 255, 0.3)',

  // Gradients
  gradientCyan: ['#00FFFF', '#0088FF'],
  gradientMagenta: ['#FF00FF', '#FF0088'],
  gradientCyanToMagenta: ['#00FFFF', '#FF00FF'],

  // Frequency Sync gradient (cold blue to warm rose)
  frequencyCold: '#0066FF',
  frequencyWarm: '#FF6B9D',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',

  // Status
  success: '#00FF88',
  warning: '#FFAA00',
  error: '#FF4466',

  // Game specific
  cordDefault: '#444444',
  cordActive: '#00FFFF',
  gridTile: '#1A1A2E',
  gridTileActive: '#2A2A4E',
  ripple: 'rgba(0, 255, 255, 0.5)',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
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
  neonCyan: {
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  neonMagenta: {
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    matchWindow: 2000, // 2 seconds
    gridSize: 3,
  },
  frequencySync: {
    syncThreshold: 0.05,
    holdDuration: 3000, // 3 seconds
  },
  stamina: {
    maxGamesPerDay: 3,
    resetHours: 24,
  },
  proximity: {
    thresholdMeters: 10,
  },
};
