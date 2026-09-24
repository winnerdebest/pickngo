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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
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
import { Icon, IconName } from '../../src/components/Icon';

const TIMELINE_STEPS: { status: TaskStatus; label: string; icon: IconName }[] = [
  { status: 'PENDING', label: 'Payment Pending', icon: 'wallet' },
  { status: 'FUNDED', label: 'Finding Runner', icon: 'search' },
  { status: 'ACCEPTED', label: 'Runner Assigned', icon: 'bike' },
  { status: 'IN_PROGRESS', label: 'Errand In Progress', icon: 'flash' },
  { status: 'PICKED_UP', label: 'Items Picked Up', icon: 'package' },
  { status: 'DELIVERED', label: 'Delivered', icon: 'map-pin' },
  { status: 'COMPLETED', label: 'Completed', icon: 'check-circle' },
];

export default function TrackTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { colors, isDark } = useTheme();

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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Live Tracker" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Connecting to live tracker...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="Live Tracker"
        showBack
        rightAction={<LiveIndicator connected={isConnected} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag">
        {/* Status Highlight Banner */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: meta.backgroundColor, borderColor: meta.color },
          ]}
        >
          <View style={styles.bannerHeader}>
            <StatusBadge status={task.status} size="large" />
            <Text style={[styles.taskAmount, { color: colors.textPrimary }]}>
              {formatNaira(task.total_amount)}
            </Text>
          </View>
          <Text style={[styles.statusDescription, { color: meta.textColor }]}>
            {meta.description}
          </Text>
        </View>

        {/* Action Callouts for Special States */}
        {task.status === 'PENDING' && (
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
              Action Required
            </Text>
            <Text style={[styles.actionCardSub, { color: colors.textSecondary }]}>
              Lock funds in escrow so runners can see and accept your request.
            </Text>
            <Button
              title="Fund Task Now"
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
          <View
            style={[
              styles.actionCard,
              {
                backgroundColor: isDark ? colors.cardElevated : colors.successLight,
                borderColor: colors.success,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Icon name="check-circle" size={24} color={colors.success} />
              <Text style={[styles.deliveredTitle, { color: colors.successText }]}>
                Package Delivered!
              </Text>
            </View>
            <Text style={[styles.actionCardSub, { color: colors.textSecondary }]}>
              Please inspect your items and release payment to the runner.
            </Text>
            <Button
              title="Confirm & Rate Runner"
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
            Status Timeline
          </Text>

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
                        {
                          backgroundColor: isCurrent
                            ? colors.coral
                            : isPassed
                            ? colors.coralLight
                            : isDark
                            ? colors.cardSubtle
                            : colors.surfaceSubtle,
                          borderColor: isCurrent
                            ? colors.coralDark
                            : isPassed
                            ? colors.coral
                            : colors.border,
                        },
                      ]}
                    >
                      <Icon
                        name={step.icon}
                        size={14}
                        color={isCurrent ? '#FFFFFF' : isPassed ? colors.coral : colors.textMuted}
                      />
                    </View>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: colors.border },
                          isPassed && index < currentStepIndex && { backgroundColor: colors.coral },
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        { color: colors.textPrimary },
                        isCurrent && { color: colors.coral, fontWeight: '900' },
                        !isPassed && { color: colors.textMuted, fontWeight: '500' },
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={[styles.timelineActiveSub, { color: colors.coral }]}>
                        Current Status
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Runner Information Card (if assigned) */}
        {task.runner && (
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
              Assigned Runner
            </Text>

            <View style={styles.runnerRow}>
              <View style={[styles.runnerAvatar, { backgroundColor: colors.coralLight, borderColor: colors.coral }]}>
                <Icon name="bike" size={26} color={colors.coral} />
              </View>

              <View style={styles.runnerDetails}>
                <Text style={[styles.runnerName, { color: colors.textPrimary }]}>
                  {task.runner.full_name}
                </Text>
                <Text style={[styles.runnerPlate, { color: colors.textSecondary }]}>
                  Bike Plate: <Text style={[styles.plateNumber, { color: colors.textPrimary }]}>{task.runner.bike_plate_number}</Text>
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
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.typeBadge}>
              <Icon
                name={task.type === 'SUPERMARKET_RUN' ? 'cart' : 'package'}
                size={18}
                color={colors.coral}
              />
              <Text style={[styles.typeTitle, { color: colors.textPrimary }]}>
                {typeInfo.title}
              </Text>
            </View>
            <Text style={[styles.createdDate, { color: colors.textMuted }]}>
              {formatDate(task.created_at)}
            </Text>
          </View>

          <Text style={[styles.taskDesc, { color: colors.textSecondary }]}>
            {task.description}
          </Text>

          <View
            style={[
              styles.routeBox,
              { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
            ]}
          >
            <View style={styles.addressRow}>
              <Icon name="map-pin" size={16} color={colors.coral} />
              <View style={styles.addressTextWrapper}>
                <Text style={[styles.addressTag, { color: colors.textMuted }]}>Pickup / Store</Text>
                <Text style={[styles.addressVal, { color: colors.textPrimary }]}>
                  {task.pickup_address}
                </Text>
              </View>
            </View>

            <View style={[styles.addressDivider, { backgroundColor: colors.border }]} />

            <View style={styles.addressRow}>
              <Icon name="map-pin" size={16} color={colors.textMuted} />
              <View style={styles.addressTextWrapper}>
                <Text style={[styles.addressTag, { color: colors.textMuted }]}>Delivery Destination</Text>
                <Text style={[styles.addressVal, { color: colors.textPrimary }]}>
                  {task.delivery_address}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Estimated Goods</Text>
              <Text style={[styles.priceVal, { color: colors.textPrimary }]}>
                {formatNaira(task.estimated_goods_cost)}
              </Text>
            </View>
            <View>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Runner Fee</Text>
              <Text style={[styles.priceVal, { color: colors.textPrimary }]}>
                {formatNaira(task.service_fee)}
              </Text>
            </View>
            <View>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Total Escrow</Text>
              <Text style={[styles.priceVal, { color: colors.coral, fontWeight: '900' }]}>
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? colors.card : colors.white },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Report an Issue</Text>
              <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
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
        </TouchableWithoutFeedback>
      </Modal>
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
  },
  statusDescription: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionCard: {
    borderRadius: 18,
    padding: 18,
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
    fontWeight: '800',
    marginBottom: 4,
  },
  deliveredTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  actionCardSub: {
    fontSize: 13,
    marginBottom: 14,
  },
  actionBtn: {
    marginTop: 4,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 18,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  timelineActiveSub: {
    fontSize: 11,
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
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerDetails: {
    flex: 1,
  },
  runnerName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  runnerPlate: {
    fontSize: 13,
    marginBottom: 6,
  },
  plateNumber: {
    fontWeight: '700',
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
    gap: 8,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  createdDate: {
    fontSize: 12,
  },
  taskDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  routeBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  addressVal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  addressDivider: {
    height: 1,
    marginVertical: 8,
    marginLeft: 26,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bottomActions: {
    gap: 10,
    marginTop: 8,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});
