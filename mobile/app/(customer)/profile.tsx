import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/constants/colors';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, switchRole, logout } = useAuth();
  const [switching, setSwitching] = useState(false);

  const handleSwitchToRunner = async () => {
    Alert.alert(
      'Switch Mode',
      'Would you like to switch to Runner mode to accept delivery errands?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Runner',
          onPress: async () => {
            try {
              setSwitching(true);
              await switchRole('runner');
              router.replace('/(runner)');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to switch role');
            } finally {
              setSwitching(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🛒</Text>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Customer'}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Customer Account</Text>
          </View>
        </View>

        {/* Account Info Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account ID</Text>
            <Text style={[styles.infoValue, styles.idText]} numberOfLines={1}>
              {user?.id || '—'}
            </Text>
          </View>
        </View>

        {/* Switch to Runner Mode */}
        <View style={styles.switchCard}>
          <View style={styles.switchHeader}>
            <Text style={styles.switchEmoji}>🛵</Text>
            <View style={styles.switchTextWrapper}>
              <Text style={styles.switchTitle}>Become a Runner</Text>
              <Text style={styles.switchSub}>
                Accept errands, deliver items on your bike, and earn money.
              </Text>
            </View>
          </View>
          <Button
            title={switching ? 'Switching...' : 'Switch to Runner Mode'}
            onPress={handleSwitchToRunner}
            variant="secondary"
            size="medium"
            loading={switching}
            style={styles.switchBtn}
          />
        </View>

        {/* App Info & Logout */}
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Alert.alert('Support', 'Contact PickNGo Support at support@pickngo.ng')}
          >
            <Text style={styles.actionLabel}>Help & Support</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                'About PickNGo',
                'PickNGo v1.0.0\nFast, reliable errands & bike-based deliveries.'
              )
            }
          >
            <Text style={styles.actionLabel}>About App</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          size="medium"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.coral,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.charcoal,
    marginBottom: 6,
  },
  rolePill: {
    backgroundColor: colors.coralLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.coralDark,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  idText: {
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 160,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  switchCard: {
    backgroundColor: colors.charcoal,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  switchHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  switchEmoji: {
    fontSize: 28,
  },
  switchTextWrapper: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  switchSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  switchBtn: {
    backgroundColor: colors.coral,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  logoutBtn: {
    marginBottom: 24,
  },
});
