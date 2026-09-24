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
import { useTheme } from '../../src/hooks/useTheme';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Logo } from '../../src/components/Logo';
import { Icon } from '../../src/components/Icon';

export default function SignupScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    setError(null);
    router.push({
      pathname: '/(auth)/role-select',
      params: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password,
      },
    });
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
          {/* Top Bar with Back Button and Logo */}
          <View style={styles.topRow}>
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
            <Logo size="small" theme={isDark ? 'dark' : 'light'} variant="combo" />
            <View style={{ width: 38 }} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join PickNGo in seconds
            </Text>
          </View>

          {/* Error Banner */}
          <ErrorMessage message={error} onRetry={() => setError(null)} />

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="e.g. Tunde Balogun"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (error) setError(null);
              }}
              autoCapitalize="words"
              prefix={<Icon name="person" size={18} color={colors.textMuted} />}
            />

            <Input
              label="Email Address"
              placeholder="e.g. tunde@example.com"
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
              label="Phone Number"
              placeholder="e.g. 08012345678"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (error) setError(null);
              }}
              keyboardType="phone-pad"
              prefix={<Icon name="phone" size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password (Optional for testing)"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              prefix={<Icon name="lock" size={18} color={colors.textMuted} />}
            />

            <Button
              title="Continue"
              onPress={handleNext}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[styles.loginLink, { color: colors.coral }]}>Sign In</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
