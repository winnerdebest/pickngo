import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { UserRole } from '../../src/api/types';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Icon } from '../../src/components/Icon';

export default function RoleSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fullName: string;
    email: string;
    phone: string;
    password?: string;
  }>();

  const { signupCustomerAccount, signupRunnerAccount } = useAuth();
  const { colors, isDark } = useTheme();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                { backgroundColor: isDark ? colors.cardElevated : colors.surfaceSubtle },
              ]}
            >
              <Icon name="arrow-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Choose Your Role</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              How do you plan to use PickNGo?
            </Text>
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
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: selectedRole === 'customer' ? colors.coral : colors.border,
                },
                selectedRole === 'customer' && { backgroundColor: isDark ? colors.cardElevated : colors.coralLight },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: selectedRole === 'customer' ? colors.coral : (isDark ? colors.cardSubtle : colors.surfaceSubtle) },
                  ]}
                >
                  <Icon
                    name="cart"
                    size={24}
                    color={selectedRole === 'customer' ? '#FFFFFF' : colors.textMuted}
                  />
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: selectedRole === 'customer' ? colors.coral : colors.borderDark },
                  ]}
                >
                  {selectedRole === 'customer' && (
                    <View style={[styles.radioDot, { backgroundColor: colors.coral }]} />
                  )}
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>I'm a Customer</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                I want to request supermarket runs, errand pickups, and fast local deliveries.
              </Text>
            </TouchableOpacity>

            {/* Runner Option Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedRole('runner')}
              style={[
                styles.roleCard,
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: selectedRole === 'runner' ? colors.coral : colors.border,
                },
                selectedRole === 'runner' && { backgroundColor: isDark ? colors.cardElevated : colors.coralLight },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: selectedRole === 'runner' ? colors.coral : (isDark ? colors.cardSubtle : colors.surfaceSubtle) },
                  ]}
                >
                  <Icon
                    name="bike"
                    size={26}
                    color={selectedRole === 'runner' ? '#FFFFFF' : colors.textMuted}
                  />
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: selectedRole === 'runner' ? colors.coral : colors.borderDark },
                  ]}
                >
                  {selectedRole === 'runner' && (
                    <View style={[styles.radioDot, { backgroundColor: colors.coral }]} />
                  )}
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>I'm a Runner</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                I have a bike and want to accept delivery requests, earn money, and build my Trust Tier.
              </Text>

              {selectedRole === 'runner' && (
                <View style={[styles.runnerExtra, { borderTopColor: colors.border }]}>
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
                    prefix={<Icon name="map-pin" size={18} color={colors.textMuted} />}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Complete Button */}
          <Button
            title={loading ? 'Creating Account...' : 'Get Started'}
            onPress={handleComplete}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  roleCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  runnerExtra: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  plateInput: {
    marginBottom: 0,
  },
  submitBtn: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});
