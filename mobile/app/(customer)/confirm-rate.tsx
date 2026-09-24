import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { Task } from '../../src/api/types';
import { getTask, confirmDelivery, rateRunner } from '../../src/api/tasks';
import { formatNaira } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { StarRating } from '../../src/components/StarRating';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Icon } from '../../src/components/Icon';

export default function ConfirmRateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { colors, isDark } = useTheme();

  const [task, setTask] = useState<Task | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState('');
  const [loadingTask, setLoadingTask] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!params.taskId) return;
      try {
        setLoadingTask(true);
        setError(null);
        const data = await getTask(params.taskId);
        setTask(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load task details');
      } finally {
        setLoadingTask(false);
      }
    }

    load();
  }, [params.taskId]);

  const handleSubmit = async () => {
    if (!task) return;

    try {
      setSubmitting(true);
      setError(null);

      if (task.status !== 'COMPLETED') {
        await confirmDelivery(task.id);
      }

      if (rating > 0) {
        await rateRunner(task.id, {
          customer_rating: rating,
          customer_review: review.trim() || undefined,
        });
      }

      setIsCompleted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTask) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header title="Confirm & Rate" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.celebrationCircle, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <Icon name="check-circle" size={48} color={colors.success} />
          </View>
          <Text style={[styles.celebrationTitle, { color: colors.textPrimary }]}>
            Task Completed!
          </Text>
          <Text style={[styles.celebrationSub, { color: colors.textSecondary }]}>
            Thank you for confirming delivery and rating your runner. Funds have been safely released.
          </Text>

          <Button
            title="Return to Home"
            onPress={() => router.replace('/(customer)')}
            variant="primary"
            style={styles.doneBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Confirm & Rate" showBack />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* Header Banner */}
          <View
            style={[
              styles.topCard,
              {
                backgroundColor: isDark ? colors.card : colors.white,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.coralLight }]}>
              <Icon name="bike" size={32} color={colors.coral} />
            </View>
            <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Delivery Completed</Text>
            <Text style={[styles.topDesc, { color: colors.textSecondary }]}>
              Please confirm you have received all items in good condition and rate your runner.
            </Text>
          </View>

          {/* Error Banner */}
          <ErrorMessage message={error} onRetry={() => setError(null)} />

          {/* Runner Summary Card */}
          {task?.runner && (
            <View
              style={[
                styles.runnerCard,
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.runnerAvatar, { backgroundColor: colors.coralLight }]}>
                <Icon name="person" size={24} color={colors.coral} />
              </View>
              <View style={styles.runnerInfo}>
                <Text style={[styles.runnerName, { color: colors.textPrimary }]}>
                  {task.runner.full_name}
                </Text>
                <Text style={[styles.runnerSub, { color: colors.textSecondary }]}>
                  Runner Fee: <Text style={[styles.feeVal, { color: colors.coral }]}>{formatNaira(task.service_fee)}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Interactive Star Rating */}
          <View
            style={[
              styles.ratingCard,
              {
                backgroundColor: isDark ? colors.card : colors.white,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.ratingTitle, { color: colors.textPrimary }]}>
              How was the delivery service?
            </Text>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="large"
              showLabel
            />
          </View>

          {/* Review Text Input */}
          <View style={styles.reviewCard}>
            <Input
              label="Leave a Review (Optional)"
              placeholder="e.g. Prompt arrival, polite communication, items handled with care!"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70, textAlignVertical: 'top' }}
              prefix={<Icon name="document" size={18} color={colors.textMuted} />}
            />
          </View>

          {/* Submit Action */}
          <Button
            title={submitting ? 'Releasing Funds...' : 'Confirm Delivery & Submit Rating'}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
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
  topCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  topDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  runnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    gap: 14,
  },
  runnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerInfo: {
    flex: 1,
  },
  runnerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  runnerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  feeVal: {
    fontWeight: '700',
  },
  ratingCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  reviewCard: {
    marginBottom: 24,
  },
  submitBtn: {
    marginBottom: 24,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  celebrationCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  celebrationSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  doneBtn: {
    minWidth: 200,
  },
});
