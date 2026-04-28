import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, radii, typography } from '../../theme';

const toneMap = {
  primary: { backgroundColor: palette.primarySoft, color: palette.primaryStrong },
  accent: { backgroundColor: palette.accentSoft, color: palette.accent },
  success: { backgroundColor: '#E0F3E8', color: palette.success },
  warning: { backgroundColor: '#FDECCF', color: palette.warning },
  danger: { backgroundColor: '#F8D9D3', color: palette.danger },
  neutral: { backgroundColor: '#F1ECE2', color: palette.inkSoft },
};

export default function StatusPill({ label, tone = 'neutral', style }) {
  const colors = toneMap[tone] || toneMap.neutral;

  return (
    <View style={[styles.pill, { backgroundColor: colors.backgroundColor }, style]}>
      <Text style={[styles.text, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  text: {
    fontFamily: typography.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
