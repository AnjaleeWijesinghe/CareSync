import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radii, shadows, typography } from '../../theme';

export default function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  leftIcon,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const gradientColors = variant === 'ghost'
    ? ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.48)']
    : variant === 'accent'
      ? [palette.accent, '#D85A37']
      : [palette.primary, palette.primaryStrong];

  const textColor = variant === 'ghost' ? palette.ink : palette.white;

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.button, variant === 'ghost' && styles.ghostButton]}>
          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <View style={styles.content}>
              {leftIcon}
              <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    ...shadows.soft,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: 'rgba(11,107,99,0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontFamily: typography.bodyBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
