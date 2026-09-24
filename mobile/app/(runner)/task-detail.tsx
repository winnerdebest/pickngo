import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/constants/colors';
import { Task } from '../../src/api/types';
import { getTask, acceptTask } from '../../src/api/tasks';
import { formatNaira, formatDate, getTaskTypeInfo } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function RunnerTaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!params.taskId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getTask(params.taskId);
        setTask(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load task details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.taskId]);

  const handleAccept = async () => {
    if (!task || !user) return;

    try {
      setAccepting(true);
      setError(null);
      const updated = await acceptTask(task.id, { runner_id: user.id });

      // Navigate to active task runner screen
      router.replace({
        pathname: '/(runner)/active-task',
        params: { taskId: updated.id },
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to accept task';
      setError(msg);
      Alert.alert('Cannot Accept Task', msg);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Task Details" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Task Details" showBack />
        <View style={styles.centerBox}>
          <ErrorMessage message={error || 'Task not found'} />
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = getTaskTypeInfo(task.type);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Task Details" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Your Payout (Runner Fee)</Text>
          <Text style={styles.earningsValue}>{formatNaira(task.service_fee)}</Text>
          <Text style={styles.earningsSub}>Paid immediately after customer delivery confirmation</Text>
        </View>

        {/* Error Banner */}
        <ErrorMessage message={error} onRetry={() => setError(null)} />

        {/* Task Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>{typeInfo.icon}</Text>
              <Text style={styles.typeTitle}>{typeInfo.title}</Text>
            </View>
            <StatusBadge status={task.status} size="small" />
          </View>

          <Text style={styles.sectionHeader}>Task Description & Items</Text>
          <Text style={styles.description}>{task.description}</Text>

          <View style={styles.routeBox}>
            <View style={styles.routeStep}>
              <View style={[styles.dot, { backgroundColor: colors.coral }]} />
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepTag}>PICKUP LOCATION</Text>
                <Text style={styles.stepAddress}>{task.pickup_address}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeStep}>
              <View style={[styles.dot, { backgroundColor: colors.charcoal }]} />
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepTag}>DELIVERY DESTINATION</Text>
                <Text style={styles.stepAddress}>{task.delivery_address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Estimated Goods to Purchase</Text>
            <Text style={styles.rowValue}>{formatNaira(task.estimated_goods_cost)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Delivery Service Fee (Yours)</Text>
            <Text style={[styles.rowValue, styles.coralFee]}>{formatNaira(task.service_fee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Escrow Value</Text>
            <Text style={styles.totalValue}>{formatNaira(task.total_amount)}</Text>
          </View>

          <View style={styles.escrowStatusBox}>
            <Text style={styles.escrowStatusText}>
              🔒 Payment is secured in PickNGo Escrow
            </Text>
          </View>
        </View>

        {/* Accept Task Action */}
        <Button
          title={accepting ? 'Accepting Task...' : 'Accept This Task 🛵'}
          onPress={handleAccept}
          loading={accepting}
          disabled={task.status !== 'FUNDED'}
          style={styles.acceptBtn}
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
  centerBox: {
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
  earningsCard: {
    backgroundColor: colors.charcoal,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  earningsLabel: {
    fontSize: 13,
    color: colors.mediumGray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.coral,
    marginVertical: 4,
  },
  earningsSub: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
    opacity: 0.8,
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
    marginBottom: 14,
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 16,
  },
  routeBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  stepTextWrapper: {
    flex: 1,
  },
  stepTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  stepAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.borderDark,
    marginLeft: 4,
    marginVertical: 4,
  },
  cardTitle: {
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
  coralFee: {
    color: colors.coral,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.charcoal,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.charcoal,
  },
  escrowStatusBox: {
    backgroundColor: colors.successLight,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  escrowStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
  },
  acceptBtn: {
    marginBottom: 32,
  },
});
