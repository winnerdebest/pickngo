import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { colors } from '../src/constants/colors';

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
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🛵</Text>
        <Text style={styles.logoText}>Pick<Text style={styles.logoAccent}>N</Text>Go</Text>
        <Text style={styles.tagline}>Fast, Reliable Errands & Delivery</Text>
      </View>
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
  logoContainer: {
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1,
  },
  logoAccent: {
    color: colors.coral,
  },
  tagline: {
    fontSize: 14,
    color: colors.mediumGray,
    marginTop: 8,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 36,
  },
});
