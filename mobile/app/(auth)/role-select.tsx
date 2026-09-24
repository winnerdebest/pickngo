import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/constants/colors';
import { UserRole } from '../../src/api/types';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function RoleSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fullName: string;
    email: string;
    phone: string;
    password?: string;
  }>();

  const { signupCustomerAccount, signupRunnerAccount } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [bikePlate, setBikePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!params.fullName || !params.email || !params.phone) {
      setError('Registration details are missing. Please go back.');
      return;
    }

    if (selectedRole === 'runner' && !bikePlate.trim()) {
      setError('Please enter your bike plate number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (selectedRole === 'customer') {
        await signupCustomerAccount({
          full_name: params.fullName,
          email: params.email,
          phone: params.phone,
          password: params.password,
        });
        router.replace('/(customer)');
      } else {
        await signupRunnerAccount({
          full_name: params.fullName,
          email: params.email,
          phone: params.phone,
          bike_plate_number: bikePlate.trim().toUpperCase(),
          password: params.password,
        });
        router.replace('/(runner)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Choose Your Role</Text>
            <Text style={styles.subtitle}>How do you plan to use PickNGo?</Text>
          </View>

          {/* Error Message */}
          <ErrorMessage message={error} onRetry={() => setError(null)} />

          {/* Role Choice Cards */}
          <View style={styles.cardsContainer}>
            {/* Customer Option Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedRole('customer')}
              style={[
                styles.roleCard,
                selectedRole === 'customer' && styles.roleCardActive,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.emojiBubble}>
                  <Text style={styles.emoji}>🛒</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedRole === 'customer' && styles.radioCircleActive,
                  ]}
                >
                  {selectedRole === 'customer' && <View style={styles.radioDot} />}
                </View>
              </View>

              <Text style={styles.cardTitle}>I'm a Customer</Text>
              <Text style={styles.cardDesc}>
                I want to request supermarket runs, errand pickups, and fast local deliveries.
              </Text>
            </TouchableOpacity>

            {/* Runner Option Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedRole('runner')}
              style={[
                styles.roleCard,
                selectedRole === 'runner' && styles.roleCardActive,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.emojiBubble}>
                  <Text style={styles.emoji}>🛵</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedRole === 'runner' && styles.radioCircleActive,
                  ]}
                >
                  {selectedRole === 'runner' && <View style={styles.radioDot} />}
                </View>
              </View>

              <Text style={styles.cardTitle}>I'm a Runner</Text>
              <Text style={styles.cardDesc}>
                I have a bike and want to accept delivery requests, earn money, and build my Trust Tier.
              </Text>

              {/* Extra input for Runner: Bike Plate Number */}
              {selectedRole === 'runner' && (
                <View style={styles.runnerExtra}>
                  <Input
                    label="Bike Plate Number"
                    placeholder="e.g. KJA-482-XY"
                    value={bikePlate}
                    onChangeText={(text) => {
                      setBikePlate(text);
                      if (error) setError(null);
                    }}
                    autoCapitalize="characters"
                    containerStyle={styles.plateInput}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Complete Button */}
          <Button
            title={loading ? 'Creating Account...' : 'Get Started 🚀'}
            onPress={handleComplete}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: -2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.charcoal,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleCardActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coralLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emojiBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.coral,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.coral,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  runnerExtra: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 111, 89, 0.2)',
  },
  plateInput: {
    marginBottom: 0,
  },
  submitBtn: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});
