import React, { useState, useEffect } from 'react';
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
import { getTrustTierMeta } from '../../../src/utils/formatters';
import { Header } from '../../../src/components/Header';
import { TrustBadge } from '../../../src/components/TrustBadge';
import { Button } from '../../../src/components/Button';
import { Icon } from '../../../src/components/Icon';

export default function RunnerProfileScreen() {
  const router = useRouter();
  const { user, switchRole, refreshProfile, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, []);

  const tierMeta = getTrustTierMeta(user?.trust_tier || 'BRONZE');

  const handleSwitchToCustomer = async () => {
    Alert.alert(
      'Switch Mode',
      'Would you like to switch to Customer mode to post errands and requests?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Customer',
          onPress: async () => {
            try {
              setSwitching(true);
              await switchRole('customer');
              router.replace('/(customer)');
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
      <Header title="Runner Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Runner Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.coralLight, borderColor: colors.coral }]}>
            <Icon name="bike" size={32} color={colors.coral} />
          </View>
          <Text style={[styles.runnerName, { color: colors.textPrimary }]}>
            {user?.full_name || 'Runner'}
          </Text>
          <Text style={[styles.bikePlate, { color: colors.textSecondary }]}>
            Plate: <Text style={[styles.plateText, { color: colors.textPrimary }]}>{user?.bike_plate_number || 'N/A'}</Text>
          </Text>
          <TrustBadge
            tier={user?.trust_tier || 'BRONZE'}
            size="medium"
            style={styles.trustBadge}
          />
        </View>

        {/* Preferences / Dark Mode Card */}
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

        {/* Trust Tier Stats & Cap */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Trust Tier & Capacity
          </Text>

          <View style={styles.statGrid}>
            <View
              style={[
                styles.gridItem,
                { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
              ]}
            >
              <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Current Tier</Text>
              <Text style={[styles.gridValue, { color: tierMeta.badgeColor }]}>
                {tierMeta.name}
              </Text>
            </View>

            <View
              style={[
                styles.gridItem,
                { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
              ]}
            >
              <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Max Task Value</Text>
              <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{tierMeta.maxCap}</Text>
            </View>

            <View
              style={[
                styles.gridItem,
                { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
              ]}
            >
              <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Trust Score</Text>
              <Text style={[styles.gridValue, { color: colors.warningText }]}>
                {(user?.trust_score || 5.0).toFixed(1)} / 5.0 ★
              </Text>
            </View>

            <View
              style={[
                styles.gridItem,
                { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
              ]}
            >
              <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Completed Tasks</Text>
              <Text style={[styles.gridValue, { color: colors.textPrimary }]}>
                {user?.completed_tasks_count || 0}
              </Text>
            </View>
          </View>

          <View style={[styles.tierInfoBox, { backgroundColor: isDark ? colors.cardElevated : colors.coralLight }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Icon name="sparkles" size={16} color={colors.coral} />
              <Text style={[styles.tierInfoTitle, { color: colors.textPrimary }]}>
                How to Level Up:
              </Text>
            </View>
            <Text style={[styles.tierInfoText, { color: colors.textSecondary }]}>
              Complete more tasks successfully and maintain a 4.5+ star rating to unlock Silver (₦50k), Gold (₦100k), and Platinum (₦200k+) high-value errands.
            </Text>
          </View>
        </View>

        {/* Account Details */}
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
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Runner ID</Text>
            </View>
            <Text style={[styles.infoValue, styles.idText, { color: colors.textMuted }]} numberOfLines={1}>
              {user?.id || '—'}
            </Text>
          </View>
        </View>

        {/* Switch to Customer Mode */}
        <View
          style={[
            styles.switchCard,
            { backgroundColor: isDark ? colors.cardElevated : colors.charcoal },
          ]}
        >
          <View style={styles.switchHeader}>
            <View style={[styles.switchIconCircle, { backgroundColor: colors.coralLight }]}>
              <Icon name="cart" size={24} color={colors.coral} />
            </View>
            <View style={styles.switchTextWrapper}>
              <Text style={styles.switchTitle}>Switch to Customer Mode</Text>
              <Text style={styles.switchSub}>
                Post grocery errands, market runs, or parcel delivery requests.
              </Text>
            </View>
          </View>
          <Button
            title={switching ? 'Switching...' : 'Switch to Customer'}
            onPress={handleSwitchToCustomer}
            variant="primary"
            size="medium"
            loading={switching}
            style={styles.switchBtn}
          />
        </View>

        {/* Support & Logout */}
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
            onPress={() => Alert.alert('Runner Support', 'Runner Helpline: support@pickngo.ng')}
          >
            <View style={styles.actionLeft}>
              <Icon name="help-circle" size={20} color={colors.coral} />
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                Runner Support & FAQ
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

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
  heroCard: {
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
  runnerName: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  bikePlate: {
    fontSize: 13,
    marginBottom: 10,
  },
  plateText: {
    fontWeight: '800',
  },
  trustBadge: {
    marginTop: 4,
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
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  gridItem: {
    width: '47%',
    borderRadius: 14,
    padding: 12,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  tierInfoBox: {
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  tierInfoTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  tierInfoText: {
    fontSize: 11,
    lineHeight: 16,
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
