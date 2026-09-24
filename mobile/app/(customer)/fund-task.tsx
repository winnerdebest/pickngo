import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { Task } from '../../src/api/types';
import { getTask, fundTask } from '../../src/api/tasks';
import { formatNaira, getTaskTypeInfo } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function FundTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();

  const [task, setTask] = useState<Task | null>(null);
  const [fetching, setFetching] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      if (!params.taskId) return;
      try {
        setFetching(true);
        setError(null);
        const data = await getTask(params.taskId);
        setTask(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load task details');
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [params.taskId]);

  const handleFund = async () => {
    if (!task) return;

    try {
      setFunding(true);
      setError(null);

      // Generate simulated mock payment reference
      const paymentRef = `PAY-PKG-${Date.now().toString(36).toUpperCase()}`;

      // Call backend fund endpoint
      const updated = await fundTask(task.id, { payment_reference: paymentRef });
      setTask(updated);
      setPaymentSuccess(true);

      // Delay briefly for user feedback then navigate to live tracking
      setTimeout(() => {
        router.replace({
          pathname: '/(customer)/track-task',
          params: { taskId: updated.id },
        });
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to fund task. Please try again.');
    } finally {
      setFunding(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Fund Escrow" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Loading task summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Fund Escrow" showBack />
        <View style={styles.centerContainer}>
          <ErrorMessage message={error || 'Task not found'} />
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = getTaskTypeInfo(task.type);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Fund Escrow" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Banner if paid */}
        {paymentSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Payment Secured in Escrow!</Text>
            <Text style={styles.successSubtitle}>Finding nearby runners now...</Text>
          </View>
        )}

        {/* Error Banner */}
        <ErrorMessage message={error} onRetry={() => setError(null)} />

        {/* Task Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>{typeInfo.icon}</Text>
              <Text style={styles.typeTitle}>{typeInfo.title}</Text>
            </View>
            <Text style={styles.escrowTag}>🔒 Escrow Locked</Text>
          </View>

          <Text style={styles.description}>{task.description}</Text>

          <View style={styles.routeBox}>
            <Text style={styles.routeLabel}>Route:</Text>
            <Text style={styles.routeItem}>📍 From: {task.pickup_address}</Text>
            <Text style={styles.routeItem}>🏁 To: {task.delivery_address}</Text>
          </View>
        </View>

        {/* Amount Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Escrow Deposit Breakdown</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Estimated Goods Value</Text>
            <Text style={styles.rowValue}>{formatNaira(task.estimated_goods_cost)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Runner Delivery Fee</Text>
            <Text style={styles.rowValue}>{formatNaira(task.service_fee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Escrow Deposit</Text>
              <Text style={styles.totalHint}>100% Protected</Text>
            </View>
            <Text style={styles.totalAmount}>{formatNaira(task.total_amount)}</Text>
          </View>
        </View>

        {/* Trust Guarantee Note */}
        <View style={styles.trustBox}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <View style={styles.trustTextWrapper}>
            <Text style={styles.trustTitle}>PickNGo Escrow Guarantee</Text>
            <Text style={styles.trustDesc}>
              Your funds remain safe in escrow until you verify your items and confirm completion. If any issue arises, you can dispute and get refunded.
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        <Button
          title={
            funding
              ? 'Securing Escrow...'
              : paymentSuccess
              ? 'Funds Locked ✓'
              : `Pay & Lock ${formatNaira(task.total_amount)} 🔒`
          }
          onPress={handleFund}
          loading={funding}
          disabled={paymentSuccess || task.payment_status === 'ESCROW_LOCKED'}
          style={styles.payBtn}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  successBanner: {
    backgroundColor: colors.successLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  successEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.successText,
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.successText,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeEmoji: {
    fontSize: 18,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  escrowTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.coral,
    backgroundColor: colors.coralLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  routeBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  routeItem: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  breakdownCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.charcoal,
  },
  totalHint: {
    fontSize: 11,
    color: colors.successText,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.coral,
  },
  trustBox: {
    flexDirection: 'row',
    backgroundColor: colors.coralLight,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 89, 0.2)',
  },
  shieldIcon: {
    fontSize: 24,
  },
  trustTextWrapper: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.charcoal,
    marginBottom: 4,
  },
  trustDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  payBtn: {
    marginBottom: 24,
  },
});
