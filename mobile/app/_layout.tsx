import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useTheme } from '../src/hooks/useTheme';

function AppNav() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={isDark ? colors.charcoal : colors.background}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(runner)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
