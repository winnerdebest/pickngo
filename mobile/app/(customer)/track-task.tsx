import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { TaskStatus } from '../../src/api/types';
import { cancelTask, disputeTask } from '../../src/api/tasks';
import { formatNaira, formatDate, getStatusMeta, getTaskTypeInfo } from '../../src/utils/formatters';
import { useTaskWebSocket } from '../../src/hooks/useTaskWebSocket';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { TrustBadge } from '../../src/components/TrustBadge';
import { LiveIndicator } from '../../src/components/LiveIndicator';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ErrorMessage } from '../../src/components/ErrorMessage';

const TIMELINE_STEPS: { status: TaskStatus; label: string; icon: string }[] = [
  { status: 'PENDING', label: 'Payment Pending', icon: '💳' },
  { status: 'FUNDED', label: 'Finding Runner', icon: '🔍' },
  { status: 'ACCEPTED', label: 'Runner Assigned', icon: '🛵' },
  { status: 'IN_PROGRESS', label: 'Errand In Progress', icon: '🏃' },
  { status: 'PICKED_UP', label: 'Items Picked Up', icon: '📦' },
  { status: 'DELIVERED', label: 'Delivered', icon: '📍' },
  { status: 'COMPLETED', label: 'Completed', icon: '🎉' },
];

export default function TrackTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();

  const { task, isConnected, isLoading, error, refetch } = useTaskWebSocket({
    taskId: params.taskId,
  });

  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCancel = () => {
    if (!task) return;
    Alert.alert(
      'Cancel Task',
      'Are you sure you want to cancel this task? Any escrow funds will be refunded.',
      [
        { text: 'No, Keep Task', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await cancelTask(task.id, { reason: 'Cancelled by customer' });
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel task');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDisputeSubmit = async () => {
    if (!task || !disputeReason.trim()) {
      setActionError('Please state the reason for this dispute.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      await disputeTask(task.id, { dispute_reason: disputeReason.trim() });
      setDisputeModalVisible(false);
      setDisputeReason('');
      refetch();
      Alert.alert(
        'Dispute Opened',
        'Our support team has been notified and will investigate immediately.'
      );
    } catch (err: any) {
      setActionError(err.message || 'Failed to open dispute');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && !task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Live Tracker" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Connecting to live tracker...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Live Tracker" showBack />
        <View style={styles.centerBox}>
          <ErrorMessage message={error || 'Task not found'} onRetry={refetch} />
        </View>
      </SafeAreaView>
    );
  }

  const meta = getStatusMeta(task.status);
  const typeInfo = getTaskTypeInfo(task.type);
  const currentStepIndex = meta.stepIndex;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Live Tracker"
        showBack
        rightAction={<LiveIndicator connected={isConnected} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Highlight Banner */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: meta.backgroundColor, borderColor: meta.color },
          ]}
        >
          <View style={styles.bannerHeader}>
            <StatusBadge status={task.status} size="large" />
            <Text style={styles.taskAmount}>{formatNaira(task.total_amount)}</Text>
          </View>
          <Text style={[styles.statusDescription, { color: meta.textColor }]}>
            {meta.description}
          </Text>
        </View>

        {/* Action Callouts for Special States */}
        {task.status === 'PENDING' && (
          <View style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>Action Required</Text>
            <Text style={styles.actionCardSub}>
              Lock funds in escrow so runners can see and accept your request.
            </Text>
            <Button
              title="Fund Task Now 🔒"
              onPress={() =>
                router.push({
                  pathname: '/(customer)/fund-task',
                  params: { taskId: task.id },
                })
              }
              variant="primary"
              size="medium"
              style={styles.actionBtn}
            />
          </View>
        )}

        {task.status === 'DELIVERED' && (
          <View style={[styles.actionCard, styles.deliveredCard]}>
            <Text style={styles.deliveredTitle}>Package Delivered! 🎁</Text>
            <Text style={styles.actionCardSub}>
              Please inspect your items and release payment to the runner.
            </Text>
            <Button
              title="Confirm & Rate Runner ⭐"
              onPress={() =>
                router.push({
                  pathname: '/(customer)/confirm-rate',
                  params: { taskId: task.id },
                })
              }
              variant="primary"
              size="large"
              style={styles.actionBtn}
            />
          </View>
        )}

        {/* Real-Time Status Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Timeline</Text>

          <View style={styles.timelineContainer}>
            {TIMELINE_STEPS.map((step, index) => {
              const isPassed = currentStepIndex >= index;
              const isCurrent = currentStepIndex === index;

              return (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineIndicatorCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        isPassed && styles.timelineDotPassed,
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      <Text style={styles.timelineIcon}>{step.icon}</Text>
                    </View>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPassed && index < currentStepIndex && styles.timelineLinePassed,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        isCurrent && styles.timelineLabelCurrent,
                        !isPassed && styles.timelineLabelInactive,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.timelineActiveSub}>Current Status</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Runner Information Card (if assigned) */}
        {task.runner && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Runner</Text>

            <View style={styles.runnerRow}>
              <View style={styles.runnerAvatar}>
                <Text style={styles.runnerEmoji}>🛵</Text>
              </View>

              <View style={styles.runnerDetails}>
                <Text style={styles.runnerName}>{task.runner.full_name}</Text>
                <Text style={styles.runnerPlate}>
                  Bike Plate: <Text style={styles.plateNumber}>{task.runner.bike_plate_number}</Text>
                </Text>
                <TrustBadge
                  tier={task.runner.trust_tier}
                  size="small"
                  style={styles.runnerBadge}
                />
              </View>
            </View>
          </View>
        )}

        {/* Task Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>{typeInfo.icon}</Text>
              <Text style={styles.typeTitle}>{typeInfo.title}</Text>
            </View>
            <Text style={styles.createdDate}>{formatDate(task.created_at)}</Text>
          </View>

          <Text style={styles.taskDesc}>{task.description}</Text>

          <View style={styles.routeBox}>
            <View style={styles.addressRow}>
              <View style={[styles.dot, { backgroundColor: colors.coral }]} />
              <View style={styles.addressTextWrapper}>
                <Text style={styles.addressTag}>Pickup / Supermarket</Text>
                <Text style={styles.addressVal}>{task.pickup_address}</Text>
              </View>
            </View>

            <View style={styles.addressDivider} />

            <View style={styles.addressRow}>
              <View style={[styles.dot, { backgroundColor: colors.charcoal }]} />
              <View style={styles.addressTextWrapper}>
                <Text style={styles.addressTag}>Delivery Address</Text>
                <Text style={styles.addressVal}>{task.delivery_address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Estimated Goods</Text>
              <Text style={styles.priceVal}>{formatNaira(task.estimated_goods_cost)}</Text>
            </View>
            <View>
              <Text style={styles.priceLabel}>Runner Fee</Text>
              <Text style={styles.priceVal}>{formatNaira(task.service_fee)}</Text>
            </View>
            <View>
              <Text style={styles.priceLabel}>Total Escrow</Text>
              <Text style={[styles.priceVal, styles.coralPrice]}>
                {formatNaira(task.total_amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Dispute & Cancel Secondary Actions */}
        {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
          <View style={styles.bottomActions}>
            <Button
              title="Report an Issue / Dispute"
              onPress={() => setDisputeModalVisible(true)}
              variant="ghost"
              size="medium"
              textStyle={{ color: colors.error }}
            />

            {(task.status === 'PENDING' || task.status === 'FUNDED') && (
              <Button
                title="Cancel Task"
                onPress={handleCancel}
                variant="ghost"
                size="medium"
                loading={actionLoading}
                textStyle={{ color: colors.textSecondary }}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Dispute Modal */}
      <Modal
        visible={disputeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDisputeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <Text style={styles.modalDesc}>
              Please describe the problem. Our support team will pause escrow release and review your case.
            </Text>

            <ErrorMessage message={actionError} />

            <Input
              placeholder="e.g. Runner did not bring items, wrong items bought, etc."
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
              numberOfLines={4}
              style={{ minHeight: 90, textAlignVertical: 'top' }}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Back"
                onPress={() => setDisputeModalVisible(false)}
                variant="ghost"
                size="medium"
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Dispute"
                onPress={handleDisputeSubmit}
                variant="danger"
                size="medium"
                loading={actionLoading}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  statusBanner: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.charcoal,
  },
  statusDescription: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.coral,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  deliveredCard: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  deliveredTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.successText,
    marginBottom: 4,
  },
  actionCardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  actionBtn: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 46,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 32,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  timelineDotPassed: {
    backgroundColor: colors.coralLight,
    borderColor: colors.coral,
  },
  timelineDotCurrent: {
    backgroundColor: colors.coral,
    borderColor: colors.coralDark,
    transform: [{ scale: 1.1 }],
  },
  timelineIcon: {
    fontSize: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 18,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineLinePassed: {
    backgroundColor: colors.coral,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineLabelCurrent: {
    color: colors.coral,
    fontWeight: '800',
  },
  timelineLabelInactive: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  timelineActiveSub: {
    fontSize: 11,
    color: colors.coral,
    fontWeight: '700',
    marginTop: 2,
  },
  runnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  runnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.coralLight,
    borderWidth: 2,
    borderColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerEmoji: {
    fontSize: 26,
  },
  runnerDetails: {
    flex: 1,
  },
  runnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  runnerPlate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  plateNumber: {
    fontWeight: '700',
    color: colors.charcoal,
  },
  runnerBadge: {
    marginTop: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  createdDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  taskDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  routeBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressTag: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  addressVal: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 1,
  },
  addressDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
    marginLeft: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  coralPrice: {
    color: colors.coral,
    fontWeight: '800',
  },
  bottomActions: {
    gap: 10,
    marginTop: 8,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.charcoal,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});
