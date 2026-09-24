import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { colors } from '../src/constants/colors';
import { Logo } from '../src/components/Logo';

export default function EntryScreen() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (role === 'runner') {
      router.replace('/(runner)');
    } else {
      router.replace('/(customer)');
    }
  }, [user, role, isLoading, router]);

  return (
    <View style={styles.container}>
      <Logo size="hero" showTagline theme="dark" variant="combo" />
      <ActivityIndicator size="large" color={colors.coral} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  spinner: {
    marginTop: 40,
  },
});
