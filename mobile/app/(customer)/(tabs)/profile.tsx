import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useTheme } from '../../../src/hooks/useTheme';
import { Header } from '../../../src/components/Header';
import { Button } from '../../../src/components/Button';
import { Icon } from '../../../src/components/Icon';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, switchRole, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="My Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.coralLight, borderColor: colors.coral }]}>
            <Icon name="person" size={32} color={colors.coral} />
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.full_name || 'Customer'}
          </Text>
          <View style={[styles.rolePill, { backgroundColor: colors.coralLight }]}>
            <Text style={[styles.rolePillText, { color: colors.coral }]}>Customer Account</Text>
          </View>
        </View>

        {/* Preferences & Appearance Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Appearance</Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Icon name={isDark ? 'moon' : 'sun'} size={20} color={colors.coral} />
              <View>
                <Text style={[styles.preferenceLabel, { color: colors.textPrimary }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.preferenceSub, { color: colors.textSecondary }]}>
                  {isDark ? 'Matte charcoal theme' : 'Bright clean theme'}
                </Text>
              </View>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: colors.coral }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account Info Details */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account Details</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconLabel}>
              <Icon name="mail" size={16} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.email || '—'}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconLabel}>
              <Icon name="phone" size={16} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.phone || '—'}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconLabel}>
              <Icon name="document" size={16} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>User ID</Text>
            </View>
            <Text style={[styles.infoValue, styles.idText, { color: colors.textMuted }]} numberOfLines={1}>
              {user?.id || '—'}
            </Text>
          </View>
        </View>

        {/* Switch to Runner Mode */}
        <View
          style={[
            styles.switchCard,
            {
              backgroundColor: isDark ? colors.cardElevated : colors.white,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.switchHeader}>
            <View style={[styles.switchIconCircle, { backgroundColor: colors.coralLight }]}>
              <Icon name="bike" size={24} color={colors.coral} />
            </View>
            <View style={styles.switchTextWrapper}>
              <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>Become a Runner</Text>
              <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                Accept errands, deliver items on your bike, and earn money.
              </Text>
            </View>
          </View>
          <Button
            title={switching ? 'Switching...' : 'Switch to Runner Mode'}
            onPress={handleSwitchToRunner}
            variant="primary"
            size="medium"
            loading={switching}
            style={styles.switchBtn}
          />
        </View>

        {/* App Info & Help */}
        <View
          style={[
            styles.actionCard,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Alert.alert('Support', 'Contact PickNGo Support at support@pickngo.ng')}
          >
            <View style={styles.actionLeft}>
              <Icon name="help-circle" size={20} color={colors.coral} />
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Help & Support</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                'About PickNGo',
                'PickNGo v1.0.0\nFast, reliable errands & bike-based deliveries.'
              )
            }
          >
            <View style={styles.actionLeft}>
              <Icon name="info" size={20} color={colors.coral} />
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>About PickNGo</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
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
  },
  scrollContent: {
    padding: 20,
  },
  userCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  preferenceSub: {
    fontSize: 12,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  idText: {
    fontSize: 12,
    maxWidth: 160,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  switchCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  switchHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  switchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTextWrapper: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  switchSub: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 16,
  },
  switchBtn: {
    marginTop: 4,
  },
  actionCard: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 24,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    marginBottom: 24,
  },
});
