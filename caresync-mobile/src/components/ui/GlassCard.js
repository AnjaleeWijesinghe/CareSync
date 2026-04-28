import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radii, shadows } from '../../theme';

export default function GlassCard({ children, style, tint = 'neutral' }) {
  const tintColors = tint === 'primary'
    ? ['rgba(255,255,255,0.96)', 'rgba(216,240,234,0.92)']
    : tint === 'accent'
      ? ['rgba(255,255,255,0.96)', 'rgba(255,225,214,0.9)']
      : ['rgba(255,255,255,0.96)', 'rgba(243,236,221,0.92)'];

  return (
    <LinearGradient colors={tintColors} style={[styles.card, style]}>
      <View style={styles.borderOverlay} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
    ...shadows.card,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(228,217,200,0.9)',
    backgroundColor: 'transparent',
  },
});
