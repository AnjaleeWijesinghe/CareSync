export const palette = {
  canvasTop: '#F6F0E6',
  canvasBottom: '#FBF8F1',
  paper: '#FFFDF8',
  paperMuted: '#F3ECDD',
  paperStrong: '#EDE4D1',
  ink: '#182022',
  inkSoft: '#516168',
  inkMuted: '#7B878E',
  line: '#E4D9C8',
  primary: '#0B6B63',
  primaryStrong: '#094E48',
  primarySoft: '#D8F0EA',
  accent: '#E56D4C',
  accentSoft: '#FFE1D6',
  accentWarm: '#F0C48A',
  success: '#3A8F62',
  warning: '#D17B22',
  danger: '#C64E3B',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const typography = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
};

export const shadows = {
  card: {
    shadowColor: '#3A2F22',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  soft: {
    shadowColor: '#3A2F22',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};

export const navTheme = {
  dark: false,
  colors: {
    primary: palette.primary,
    background: palette.canvasBottom,
    card: palette.paper,
    text: palette.ink,
    border: palette.line,
    notification: palette.accent,
  },
};
