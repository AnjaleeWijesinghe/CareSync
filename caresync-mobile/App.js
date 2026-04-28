import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { palette, typography } from './src/theme';

function BootScreen() {
  return (
    <LinearGradient
      colors={[palette.canvasTop, palette.canvasBottom]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.boot}
    >
      <View style={styles.bootHalo} />
      <View style={styles.bootCard}>
        <Text style={styles.bootEyebrow}>CareSync Experience</Text>
        <Text style={styles.bootTitle}>Preparing a calmer, sharper care journey.</Text>
        <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: 18 }} />
      </View>
    </LinearGradient>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) {
    return <BootScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="dark" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  bootHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(11,107,99,0.12)',
    top: 132,
  },
  bootCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: 'rgba(255,253,248,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(228,217,200,0.85)',
    padding: 28,
  },
  bootEyebrow: {
    fontFamily: typography.bodySemiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: palette.primary,
    marginBottom: 12,
  },
  bootTitle: {
    fontFamily: typography.display,
    fontSize: 28,
    lineHeight: 34,
    color: palette.ink,
  },
});
