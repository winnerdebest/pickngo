import React, { useState } from 'react';
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
import { useTheme } from '../../src/hooks/useTheme';
import { TaskStatus } from '../../src/api/types';
import { updateTaskStatus } from '../../src/api/tasks';
import { formatNaira, getStatusMeta, getTaskTypeInfo } from '../../src/utils/formatters';
import { useTaskWebSocket } from '../../src/hooks/useTaskWebSocket';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { LiveIndicator } from '../../src/components/LiveIndicator';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Icon } from '../../src/components/Icon';

export default function RunnerActiveTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { colors, isDark } = useTheme();

  const { task, isConnected, isLoading, error, refetch } = useTaskWebSocket({
    taskId: params.taskId,
  });

  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusTransition = async (nextStatus: TaskStatus) => {
    if (!task) return;

    try {
      setUpdating(true);
      setActionError(null);
      await updateTaskStatus(task.id, { status: nextStatus });
      refetch();
    } catch (err: any) {
      const msg = err.message || 'Failed to update status';
      setActionError(msg);
      Alert.alert('Status Update Failed', msg);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading && !task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Active Errand" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Connecting to task...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Active Errand" showBack />
        <View style={styles.centerBox}>
          <ErrorMessage message={error || 'Task not found'} onRetry={refetch} />
        </View>
      </SafeAreaView>
    );
  }

  const meta = getStatusMeta(task.status);
  const typeInfo = getTaskTypeInfo(task.type);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Active Errand"
        showBack
        rightAction={<LiveIndicator connected={isConnected} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag">
        {/* Earnings Banner */}
        <View
          style={[
            styles.topEarnings,
            { backgroundColor: isDark ? colors.cardElevated : colors.charcoal },
          ]}
        >
          <Text style={[styles.topEarningsLabel, { color: colors.textMuted }]}>
            Your Earnings
          </Text>
          <Text style={[styles.topEarningsAmount, { color: colors.coral }]}>
            {formatNaira(task.service_fee)}
          </Text>
        </View>

        {/* Status Callout Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: meta.backgroundColor, borderColor: meta.color },
          ]}
        >
          <View style={styles.statusHeader}>
            <StatusBadge status={task.status} size="large" />
            <View style={[styles.escrowPill, { backgroundColor: colors.successLight }]}>
              <Icon name="lock" size={12} color={colors.success} />
              <Text style={[styles.escrowPillText, { color: colors.successText }]}>
                Escrow Protected
              </Text>
            </View>
          </View>
          <Text style={[styles.statusDesc, { color: meta.textColor }]}>
            {meta.description}
          </Text>
        </View>

        {/* Error Message */}
        <ErrorMessage message={actionError} onRetry={() => setActionError(null)} />

        {/* Action Button Section based on sequential progression */}
        <View
          style={[
            styles.actionCard,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.coral,
            },
          ]}
        >
          <Text style={[styles.actionCardTitle, { color: colors.textPrimary }]}>
            Next Step Action
          </Text>

          {task.status === 'ACCEPTED' && (
            <View>
              <Text style={[styles.actionPrompt, { color: colors.textSecondary }]}>
                Head to the pickup location and start the errand.
              </Text>
              <Button
                title={updating ? 'Updating...' : 'Start Task'}
                onPress={() => handleStatusTransition('IN_PROGRESS')}
                loading={updating}
                size="large"
              />
            </View>
          )}

          {task.status === 'IN_PROGRESS' && (
            <View>
              <Text style={[styles.actionPrompt, { color: colors.textSecondary }]}>
                Once you have purchased or collected all items, confirm pickup.
              </Text>
              <Button
                title={updating ? 'Updating...' : 'Items Picked Up'}
                onPress={() => handleStatusTransition('PICKED_UP')}
                loading={updating}
                size="large"
              />
            </View>
          )}

          {task.status === 'PICKED_UP' && (
            <View>
              <Text style={[styles.actionPrompt, { color: colors.textSecondary }]}>
                Head to the delivery address and hand over to customer.
              </Text>
              <Button
                title={updating ? 'Updating...' : 'Mark Delivered'}
                onPress={() => handleStatusTransition('DELIVERED')}
                loading={updating}
                size="large"
              />
            </View>
          )}

          {task.status === 'DELIVERED' && (
            <View style={styles.waitingContainer}>
              <Icon name="clock" size={36} color={colors.warning} />
              <Text style={[styles.waitingTitle, { color: colors.textPrimary }]}>
                Waiting for Customer Confirmation
              </Text>
              <Text style={[styles.waitingSub, { color: colors.textSecondary }]}>
                Customer has been notified to inspect and confirm receipt. Funds will be automatically credited once confirmed.
              </Text>
              <Button
                title="Refresh Status"
                onPress={refetch}
                variant="outline"
                size="medium"
                style={{ marginTop: 12 }}
              />
            </View>
          )}

          {task.status === 'COMPLETED' && (
            <View style={styles.completedContainer}>
              <Icon name="check-circle" size={44} color={colors.success} />
              <Text style={[styles.completedTitle, { color: colors.successText }]}>
                Errand Completed!
              </Text>
              <Text style={[styles.completedSub, { color: colors.textSecondary }]}>
                Customer confirmed delivery. {formatNaira(task.service_fee)} has been credited!
              </Text>
              {task.customer_rating && (
                <View style={[styles.ratingReceived, { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle }]}>
                  <Text style={[styles.ratingStars, { color: colors.textPrimary }]}>
                    Rating Received: {'★'.repeat(task.customer_rating)}
                  </Text>
                  {task.customer_review && (
                    <Text style={[styles.ratingReview, { color: colors.textSecondary }]}>
                      "{task.customer_review}"
                    </Text>
                  )}
                </View>
              )}
              <Button
                title="Back to Available Runs"
                onPress={() => router.replace('/(runner)')}
                variant="primary"
                style={{ marginTop: 16 }}
              />
            </View>
          )}
        </View>

        {/* Task Details & Address Card */}
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
          </View>

          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Task Items & Notes</Text>
          <Text style={[styles.description, { color: colors.textPrimary }]}>{task.description}</Text>

          <View
            style={[
              styles.routeBox,
              { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
            ]}
          >
            <View style={styles.routeStep}>
              <Icon name="map-pin" size={16} color={colors.coral} />
              <View style={styles.stepTextWrapper}>
                <Text style={[styles.stepTag, { color: colors.textMuted }]}>PICKUP / STORE</Text>
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

        {/* Customer Contact info */}
        {task.customer && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? colors.card : colors.white,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Customer Details</Text>
            <View style={styles.customerRow}>
              <View style={[styles.customerAvatar, { backgroundColor: colors.coralLight }]}>
                <Icon name="person" size={22} color={colors.coral} />
              </View>
              <View>
                <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                  {task.customer.full_name}
                </Text>
                <Text style={[styles.customerPhone, { color: colors.coral }]}>
                  📞 {task.customer.phone}
                </Text>
              </View>
            </View>
          </View>
        )}
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
  topEarnings: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  topEarningsLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  topEarningsAmount: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
  },
  statusCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  escrowPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusDesc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  actionPrompt: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  waitingSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  completedSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  ratingReceived: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 14,
    fontWeight: '800',
  },
  ratingReview: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
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
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  customerPhone: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
