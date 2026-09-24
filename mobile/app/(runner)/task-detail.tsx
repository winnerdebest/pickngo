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
import { useTheme } from '../../src/hooks/useTheme';
import { Task } from '../../src/api/types';
import { getTask, acceptTask } from '../../src/api/tasks';
import { formatNaira, getTaskTypeInfo } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Icon } from '../../src/components/Icon';

export default function RunnerTaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Task Details" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading task...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Task Details" showBack />
        <View style={styles.centerBox}>
          <ErrorMessage message={error || 'Task not found'} />
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = getTaskTypeInfo(task.type);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Task Details" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag">
        {/* Earnings Card */}
        <View
          style={[
            styles.earningsCard,
            { backgroundColor: isDark ? colors.cardElevated : colors.charcoal },
          ]}
        >
          <Text style={[styles.earningsLabel, { color: colors.textMuted }]}>
            Your Payout (Runner Fee)
          </Text>
          <Text style={[styles.earningsValue, { color: colors.coral }]}>
            {formatNaira(task.service_fee)}
          </Text>
          <Text style={[styles.earningsSub, { color: colors.textSecondary }]}>
            Paid immediately after customer delivery confirmation
          </Text>
        </View>

        {/* Error Banner */}
        <ErrorMessage message={error} onRetry={() => setError(null)} />

        {/* Task Overview */}
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
            <StatusBadge status={task.status} size="small" />
          </View>

          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            Task Description & Items
          </Text>
          <Text style={[styles.description, { color: colors.textPrimary }]}>
            {task.description}
          </Text>

          <View
            style={[
              styles.routeBox,
              { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
            ]}
          >
            <View style={styles.routeStep}>
              <Icon name="map-pin" size={16} color={colors.coral} />
              <View style={styles.stepTextWrapper}>
                <Text style={[styles.stepTag, { color: colors.textMuted }]}>PICKUP LOCATION</Text>
                <Text style={[styles.stepAddress, { color: colors.textPrimary }]}>
                  {task.pickup_address}
                </Text>
              </View>
            </View>

            <View style={[styles.routeLine, { backgroundColor: colors.border }]} />

            <View style={styles.routeStep}>
              <Icon name="map-pin" size={16} color={colors.textMuted} />
              <View style={styles.stepTextWrapper}>
                <Text style={[styles.stepTag, { color: colors.textMuted }]}>
                  DELIVERY DESTINATION
                </Text>
                <Text style={[styles.stepAddress, { color: colors.textPrimary }]}>
                  {task.delivery_address}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Breakdown */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Financial Summary</Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
              Estimated Goods to Purchase
            </Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
              {formatNaira(task.estimated_goods_cost)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
              Delivery Service Fee (Yours)
            </Text>
            <Text style={[styles.rowValue, { color: colors.coral, fontWeight: '900' }]}>
              {formatNaira(task.service_fee)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Escrow Value</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
              {formatNaira(task.total_amount)}
            </Text>
          </View>

          <View style={[styles.escrowStatusBox, { backgroundColor: colors.successLight }]}>
            <Icon name="lock" size={14} color={colors.success} />
            <Text style={[styles.escrowStatusText, { color: colors.successText }]}>
              Payment is secured in PickNGo Escrow
            </Text>
          </View>
        </View>

        {/* Accept Task Action */}
        <Button
          title={accepting ? 'Accepting Task...' : 'Accept This Task'}
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
  },
  earningsCard: {
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  earningsValue: {
    fontSize: 34,
    fontWeight: '900',
    marginVertical: 4,
  },
  earningsSub: {
    fontSize: 12,
    textAlign: 'center',
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
    marginBottom: 14,
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  routeBox: {
    borderRadius: 14,
    padding: 14,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepTextWrapper: {
    flex: 1,
  },
  stepTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepAddress: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 14,
    marginLeft: 7,
    marginVertical: 4,
  },
  cardTitle: {
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
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  escrowStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  escrowStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  acceptBtn: {
    marginBottom: 32,
  },
});
