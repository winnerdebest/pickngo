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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { UserRole } from '../../src/api/types';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Logo } from '../../src/components/Logo';
import { Icon } from '../../src/components/Icon';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), role, password);

      if (role === 'runner') {
        router.replace('/(runner)');
      } else {
        router.replace('/(customer)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your email.');
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
          {/* Top Theme Switch Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleTheme}
              style={[
                styles.themeBtn,
                { backgroundColor: isDark ? colors.cardElevated : colors.surfaceSubtle },
              ]}
            >
              <Icon
                name={isDark ? 'sun' : 'moon'}
                size={18}
                color={isDark ? colors.warning : colors.charcoal}
              />
            </TouchableOpacity>
          </View>

          {/* Header & Official Logo */}
          <View style={styles.header}>
            <Logo size="large" showTagline theme={isDark ? 'dark' : 'light'} variant="combo" />
          </View>

          {/* Role Switcher Pill */}
          <View
            style={[
              styles.roleContainer,
              {
                backgroundColor: isDark ? colors.card : colors.surfaceSubtle,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRole('customer')}
              style={[
                styles.roleOption,
                role === 'customer' && [
                  styles.roleOptionActive,
                  { backgroundColor: isDark ? colors.cardElevated : colors.white },
                ],
              ]}
            >
              <Icon
                name="cart"
                size={18}
                color={role === 'customer' ? colors.coral : colors.textMuted}
              />
              <Text
                style={[
                  styles.roleText,
                  { color: role === 'customer' ? colors.coral : colors.textSecondary },
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRole('runner')}
              style={[
                styles.roleOption,
                role === 'runner' && [
                  styles.roleOptionActive,
                  { backgroundColor: isDark ? colors.cardElevated : colors.white },
                ],
              ]}
            >
              <Icon
                name="bike"
                size={20}
                color={role === 'runner' ? colors.coral : colors.textMuted}
              />
              <Text
                style={[
                  styles.roleText,
                  { color: role === 'runner' ? colors.coral : colors.textSecondary },
                ]}
              >
                Runner
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          <ErrorMessage message={error} onRetry={() => setError(null)} />

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="e.g. user@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              prefix={<Icon name="mail" size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              prefix={<Icon name="lock" size={18} color={colors.textMuted} />}
            />

            <Button
              title={loading ? 'Signing in...' : `Sign In as ${role === 'customer' ? 'Customer' : 'Runner'}`}
              onPress={handleLogin}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={[styles.signupLink, { color: colors.coral }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 20,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  roleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1.5,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  roleOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
