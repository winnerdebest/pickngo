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
import { colors } from '../../src/constants/colors';
import { TaskStatus } from '../../src/api/types';
import { updateTaskStatus } from '../../src/api/tasks';
import { formatNaira, getStatusMeta, getTaskTypeInfo } from '../../src/utils/formatters';
import { useTaskWebSocket } from '../../src/hooks/useTaskWebSocket';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { LiveIndicator } from '../../src/components/LiveIndicator';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function RunnerActiveTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();

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
      <SafeAreaView style={styles.safeArea}>
        <Header title="Active Errand" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Connecting to task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Active Errand"
        showBack
        rightAction={<LiveIndicator connected={isConnected} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Earnings Banner */}
        <View style={styles.topEarnings}>
          <Text style={styles.topEarningsLabel}>Your Earnings</Text>
          <Text style={styles.topEarningsAmount}>{formatNaira(task.service_fee)}</Text>
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
            <Text style={styles.escrowPill}>🔒 Escrow Protected</Text>
          </View>
          <Text style={[styles.statusDesc, { color: meta.textColor }]}>
            {meta.description}
          </Text>
        </View>

        {/* Error Message */}
        <ErrorMessage message={actionError} onRetry={() => setActionError(null)} />

        {/* Action Button Section based on sequential progression */}
        <View style={styles.actionCard}>
          <Text style={styles.actionCardTitle}>Next Step Action</Text>

          {task.status === 'ACCEPTED' && (
            <View>
              <Text style={styles.actionPrompt}>
                Head to the pickup location and start the errand.
              </Text>
              <Button
                title={updating ? 'Updating...' : 'Start Task 🏃'}
                onPress={() => handleStatusTransition('IN_PROGRESS')}
                loading={updating}
                size="large"
              />
            </View>
          )}

          {task.status === 'IN_PROGRESS' && (
            <View>
              <Text style={styles.actionPrompt}>
                Once you have purchased or collected all items, confirm pickup.
              </Text>
              <Button
                title={updating ? 'Updating...' : 'Items Picked Up 📦'}
                onPress={() => handleStatusTransition('PICKED_UP')}
                loading={updating}
                size="large"
              />
            </View>
          )}

          {task.status === 'PICKED_UP' && (
            <View>
              <Text style={styles.actionPrompt}>
                Head to the delivery address and hand over to customer.
              </Text>
              <Button
                title={updating ? 'Updating...' : 'Mark Delivered 📍'}
                onPress={() => handleStatusTransition('DELIVERED')}
                loading={updating}
                size="large"
              />
            </View>
          )}

          {task.status === 'DELIVERED' && (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingEmoji}>⏳</Text>
              <Text style={styles.waitingTitle}>Waiting for Customer Confirmation</Text>
              <Text style={styles.waitingSub}>
                Customer has been notified to inspect and confirm receipt. Funds will be automatically credited to you once confirmed.
              </Text>
              <Button
                title="Refresh Status 🔄"
                onPress={refetch}
                variant="outline"
                size="medium"
                style={{ marginTop: 12 }}
              />
            </View>
          )}

          {task.status === 'COMPLETED' && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedEmoji}>🎉</Text>
              <Text style={styles.completedTitle}>Errand Completed!</Text>
              <Text style={styles.completedSub}>
                Customer confirmed delivery. {formatNaira(task.service_fee)} has been credited!
              </Text>
              {task.customer_rating && (
                <View style={styles.ratingReceived}>
                  <Text style={styles.ratingStars}>
                    Rating Received: {'⭐'.repeat(task.customer_rating)}
                  </Text>
                  {task.customer_review && (
                    <Text style={styles.ratingReview}>"{task.customer_review}"</Text>
                  )}
                </View>
              )}
              <Button
                title="Back to Available Runs 🛵"
                onPress={() => router.replace('/(runner)')}
                variant="primary"
                style={{ marginTop: 16 }}
              />
            </View>
          )}
        </View>

        {/* Task Details & Customer Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>{typeInfo.icon}</Text>
              <Text style={styles.typeTitle}>{typeInfo.title}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Task Items & Notes</Text>
          <Text style={styles.description}>{task.description}</Text>

          {/* Route details */}
          <View style={styles.routeBox}>
            <View style={styles.routeStep}>
              <View style={[styles.dot, { backgroundColor: colors.coral }]} />
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepTag}>PICKUP / SUPERMARKET</Text>
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

        {/* Customer Contact info (if present) */}
        {task.customer && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Customer Details</Text>
            <View style={styles.customerRow}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerEmoji}>🛒</Text>
              </View>
              <View>
                <Text style={styles.customerName}>{task.customer.full_name}</Text>
                <Text style={styles.customerPhone}>📞 {task.customer.phone}</Text>
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
  topEarnings: {
    backgroundColor: colors.charcoal,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  topEarningsLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  topEarningsAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.coral,
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDesc: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.coral,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  actionPrompt: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  waitingEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 4,
  },
  waitingSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  completedEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.successText,
    textAlign: 'center',
    marginBottom: 4,
  },
  completedSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  ratingReceived: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ratingReview: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 4,
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
    backgroundColor: colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerEmoji: {
    fontSize: 20,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: 13,
    color: colors.coral,
    fontWeight: '700',
    marginTop: 2,
  },
});
