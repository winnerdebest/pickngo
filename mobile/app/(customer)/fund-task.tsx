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
import { useTheme } from '../../src/hooks/useTheme';
import { Task } from '../../src/api/types';
import { getTask, fundTask } from '../../src/api/tasks';
import { formatNaira, getTaskTypeInfo } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Icon } from '../../src/components/Icon';

export default function FundTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { colors, isDark } = useTheme();

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
    const targetTaskId = task.id;

    try {
      setFunding(true);
      setError(null);

      const paymentRef = `PAY-PKG-${Date.now().toString(36).toUpperCase()}`;
      await fundTask(targetTaskId, { payment_reference: paymentRef });
      setPaymentSuccess(true);

      setTimeout(() => {
        router.replace({
          pathname: '/(customer)/track-task',
          params: { taskId: targetTaskId },
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Fund Escrow" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading task summary...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Fund Escrow" showBack />
        <View style={styles.centerContainer}>
          <ErrorMessage message={error || 'Task not found'} />
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = getTaskTypeInfo(task.type);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Fund Escrow" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag">
        {/* Success Banner if paid */}
        {paymentSuccess && (
          <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <Icon name="check-circle" size={36} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.successText }]}>
              Payment Secured in Escrow!
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.successText }]}>
              Finding nearby runners now...
            </Text>
          </View>
        )}

        {/* Error Banner */}
        <ErrorMessage message={error} onRetry={() => setError(null)} />

        {/* Task Summary Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Icon
                name={task.type === 'SUPERMARKET_RUN' ? 'cart' : 'package'}
                size={20}
                color={colors.coral}
              />
              <Text style={[styles.typeTitle, { color: colors.textPrimary }]}>
                {typeInfo.title}
              </Text>
            </View>
            <View style={[styles.escrowTag, { backgroundColor: colors.coralLight }]}>
              <Icon name="lock" size={12} color={colors.coral} />
              <Text style={[styles.escrowTagText, { color: colors.coral }]}>Escrow Locked</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {task.description}
          </Text>

          <View
            style={[
              styles.routeBox,
              { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
            ]}
          >
            <Text style={[styles.routeLabel, { color: colors.textPrimary }]}>Route Plan:</Text>
            <View style={styles.routeItemRow}>
              <Icon name="map-pin" size={14} color={colors.coral} />
              <Text style={[styles.routeItem, { color: colors.textSecondary }]}>
                From: {task.pickup_address}
              </Text>
            </View>
            <View style={styles.routeItemRow}>
              <Icon name="map-pin" size={14} color={colors.textMuted} />
              <Text style={[styles.routeItem, { color: colors.textSecondary }]}>
                To: {task.delivery_address}
              </Text>
            </View>
          </View>
        </View>

        {/* Amount Breakdown Card */}
        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>
            Escrow Deposit Breakdown
          </Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
              Estimated Goods Value
            </Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
              {formatNaira(task.estimated_goods_cost)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
              Runner Delivery Fee
            </Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
              {formatNaira(task.service_fee)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
                Total Escrow Deposit
              </Text>
              <Text style={[styles.totalHint, { color: colors.successText }]}>
                100% Protected
              </Text>
            </View>
            <Text style={[styles.totalAmount, { color: colors.coral }]}>
              {formatNaira(task.total_amount)}
            </Text>
          </View>
        </View>

        {/* Trust Guarantee Note */}
        <View
          style={[
            styles.trustBox,
            {
              backgroundColor: isDark ? colors.cardElevated : colors.coralLight,
              borderColor: colors.border,
            },
          ]}
        >
          <Icon name="shield" size={26} color={colors.coral} />
          <View style={styles.trustTextWrapper}>
            <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>
              PickNGo Escrow Guarantee
            </Text>
            <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>
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
              ? 'Funds Locked'
              : `Pay & Lock ${formatNaira(task.total_amount)}`
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
  },
  successBanner: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  successSubtitle: {
    fontSize: 13,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
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
    gap: 8,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  escrowTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  escrowTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  routeBox: {
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  routeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeItem: {
    fontSize: 13,
  },
  breakdownCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '800',
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
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
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
  },
  totalHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  trustBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    gap: 14,
    borderWidth: 1,
  },
  trustTextWrapper: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  payBtn: {
    marginBottom: 24,
  },
});
