import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { Task } from '../../src/api/types';
import { getTask, confirmDelivery, rateRunner } from '../../src/api/tasks';
import { formatNaira } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { StarRating } from '../../src/components/StarRating';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function ConfirmRateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();

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

      // Step 1: If not yet confirmed, confirm delivery (releases escrow)
      if (task.status !== 'COMPLETED') {
        await confirmDelivery(task.id);
      }

      // Step 2: Submit customer rating & review
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
      <SafeAreaView style={styles.safeArea}>
        <Header title="Confirm & Rate" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.celebrationCircle}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </View>
          <Text style={styles.celebrationTitle}>Task Completed!</Text>
          <Text style={styles.celebrationSub}>
            Thank you for confirming delivery and rating your runner. Funds have been safely released.
          </Text>

          <Button
            title="Return to Home 🏠"
            onPress={() => router.replace('/(customer)')}
            variant="primary"
            style={styles.doneBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Confirm & Rate" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Banner */}
          <View style={styles.topCard}>
            <Text style={styles.topEmoji}>🛵💨</Text>
            <Text style={styles.topTitle}>Delivery Completed</Text>
            <Text style={styles.topDesc}>
              Please confirm you have received all items in good condition and rate your runner.
            </Text>
          </View>

          {/* Error Banner */}
          <ErrorMessage message={error} onRetry={() => setError(null)} />

          {/* Runner Summary Card */}
          {task?.runner && (
            <View style={styles.runnerCard}>
              <View style={styles.runnerAvatar}>
                <Text style={styles.runnerEmoji}>🛵</Text>
              </View>
              <View style={styles.runnerInfo}>
                <Text style={styles.runnerName}>{task.runner.full_name}</Text>
                <Text style={styles.runnerSub}>
                  Runner Fee: <Text style={styles.feeVal}>{formatNaira(task.service_fee)}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Interactive Star Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was the delivery service?</Text>
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
            />
          </View>

          {/* Submit Action */}
          <Button
            title={submitting ? 'Releasing Funds...' : 'Confirm Delivery & Submit Rating ⭐'}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textSecondary,
  },
  topCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.charcoal,
    marginBottom: 6,
  },
  topDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  runnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  runnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerEmoji: {
    fontSize: 24,
  },
  runnerInfo: {
    flex: 1,
  },
  runnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  runnerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  feeVal: {
    fontWeight: '700',
    color: colors.coral,
  },
  ratingCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.success,
  },
  celebrationEmoji: {
    fontSize: 44,
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.charcoal,
    marginBottom: 8,
  },
  celebrationSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  doneBtn: {
    minWidth: 200,
  },
});
