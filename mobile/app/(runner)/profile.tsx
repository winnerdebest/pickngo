import React, { useState, useEffect } from 'react';
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
import { getTrustTierMeta } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { TrustBadge } from '../../src/components/TrustBadge';
import { Button } from '../../src/components/Button';

export default function RunnerProfileScreen() {
  const router = useRouter();
  const { user, switchRole, refreshProfile, logout } = useAuth();
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
    <SafeAreaView style={styles.safeArea}>
      <Header title="Runner Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Runner Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🛵</Text>
          </View>
          <Text style={styles.runnerName}>{user?.full_name || 'Runner'}</Text>
          <Text style={styles.bikePlate}>
            Plate: <Text style={styles.plateText}>{user?.bike_plate_number || 'N/A'}</Text>
          </Text>
          <TrustBadge
            tier={user?.trust_tier || 'BRONZE'}
            size="medium"
            style={styles.trustBadge}
          />
        </View>

        {/* Trust Tier Stats & Cap */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trust Tier & Capacity</Text>

          <View style={styles.statGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Current Tier</Text>
              <Text style={[styles.gridValue, { color: tierMeta.badgeColor }]}>
                {tierMeta.name}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Max Task Value</Text>
              <Text style={styles.gridValue}>{tierMeta.maxCap}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Trust Score</Text>
              <Text style={styles.gridValue}>
                {(user?.trust_score || 5.0).toFixed(1)} / 5.0 ⭐
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Completed Tasks</Text>
              <Text style={styles.gridValue}>{user?.completed_tasks_count || 0}</Text>
            </View>
          </View>

          <View style={styles.tierInfoBox}>
            <Text style={styles.tierInfoTitle}>💡 How to Level Up:</Text>
            <Text style={styles.tierInfoText}>
              Complete more tasks successfully and maintain a 4.5+ star rating to unlock Silver (₦50k), Gold (₦100k), and Platinum (₦200k+) high-value errands.
            </Text>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Runner ID</Text>
            <Text style={[styles.infoValue, styles.idText]} numberOfLines={1}>
              {user?.id || '—'}
            </Text>
          </View>
        </View>

        {/* Switch to Customer Mode */}
        <View style={styles.switchCard}>
          <View style={styles.switchHeader}>
            <Text style={styles.switchEmoji}>🛒</Text>
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
            variant="secondary"
            size="medium"
            loading={switching}
            style={styles.switchBtn}
          />
        </View>

        {/* Support & Logout */}
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Alert.alert('Runner Support', 'Runner Helpline: support@pickngo.ng')}
          >
            <Text style={styles.actionLabel}>Runner Support & FAQ</Text>
            <Text style={styles.actionArrow}>›</Text>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.coral,
  },
  avatarEmoji: {
    fontSize: 34,
  },
  runnerName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.charcoal,
    marginBottom: 4,
  },
  bikePlate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  plateText: {
    fontWeight: '800',
    color: colors.charcoal,
  },
  trustBadge: {
    marginTop: 4,
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
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  gridItem: {
    width: '47%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 4,
  },
  tierInfoBox: {
    backgroundColor: colors.coralLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  tierInfoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.charcoal,
    marginBottom: 2,
  },
  tierInfoText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
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
