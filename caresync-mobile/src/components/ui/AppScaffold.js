import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, typography } from '../../theme';

function FloatingBackdrop() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [drift]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[palette.canvasTop, palette.canvasBottom]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbOne,
          {
            transform: [
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -16],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbTwo,
          {
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
            ],
          },
        ]}
      />
      <View style={[styles.orb, styles.orbThree]} />
      <View style={styles.mesh} />
    </View>
  );
}

export function PageHeader({ eyebrow, title, subtitle, rightSlot, align = 'left' }) {
  const centered = align === 'center';

  return (
    <View style={[styles.header, centered && styles.headerCentered]}>
      <View style={[styles.headerCopy, centered && styles.headerCopyCentered]}>
        {eyebrow ? <Text style={[styles.eyebrow, centered && styles.textCentered]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, centered && styles.textCentered]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, centered && styles.textCentered]}>{subtitle}</Text> : null}
      </View>
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );
}

export default function AppScaffold({
  children,
  scroll = true,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  style,
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      <FloatingBackdrop />
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvasBottom,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerCentered: {
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerCopyCentered: {
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: typography.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: palette.primary,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 30,
    lineHeight: 34,
    color: palette.ink,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 23,
    color: palette.inkSoft,
  },
  rightSlot: {
    marginTop: spacing.xs,
  },
  textCentered: {
    textAlign: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbOne: {
    width: 180,
    height: 180,
    top: -52,
    right: -36,
    backgroundColor: 'rgba(229,109,76,0.14)',
  },
  orbTwo: {
    width: 132,
    height: 132,
    top: 120,
    left: -44,
    backgroundColor: 'rgba(11,107,99,0.10)',
  },
  orbThree: {
    width: 96,
    height: 96,
    bottom: 140,
    right: 20,
    backgroundColor: 'rgba(240,196,138,0.16)',
  },
  mesh: {
    position: 'absolute',
    top: 220,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(11,107,99,0.08)',
    transform: [{ rotate: '18deg' }],
  },
});
