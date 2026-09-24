import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useTheme } from '../../../src/hooks/useTheme';
import { Task } from '../../../src/api/types';
import { getRunnerTasks } from '../../../src/api/runners';
import { formatNaira } from '../../../src/utils/formatters';
import { Header } from '../../../src/components/Header';
import { TaskCard } from '../../../src/components/TaskCard';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorMessage } from '../../../src/components/ErrorMessage';
import { Icon } from '../../../src/components/Icon';

export default function RunnerHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRunnerHistory = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const data = await getRunnerTasks(user.id);
        setTasks(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load errand history');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      loadRunnerHistory();
    }, [loadRunnerHistory])
  );

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const totalEarnings = completedTasks.reduce((sum, t) => sum + (t.service_fee || 0), 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="My Errand History" />

      {/* Earnings Overview Card */}
      <View
        style={[
          styles.earningsCard,
          {
            backgroundColor: isDark ? colors.cardElevated : colors.white,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.statBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="wallet" size={16} color={colors.coral} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Earned</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.coral }]}>
            {formatNaira(totalEarnings)}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {completedTasks.length}
          </Text>
        </View>
      </View>

      {/* Error Message */}
      <View style={{ paddingHorizontal: 20 }}>
        <ErrorMessage message={error} onRetry={() => loadRunnerHistory()} />
      </View>

      {/* Task List */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading history...
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRunnerHistory(true)}
              tintColor={colors.coral}
              colors={[colors.coral]}
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => {
                if (item.status === 'COMPLETED' || item.status === 'CANCELLED') {
                  router.push({
                    pathname: '/(runner)/task-detail',
                    params: { taskId: item.id },
                  });
                } else {
                  router.push({
                    pathname: '/(runner)/active-task',
                    params: { taskId: item.id },
                  });
                }
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title="No Errand History Yet"
              description="Accept and complete tasks from the Available tab to start building your earnings and ratings!"
              actionTitle="View Available Runs"
              onAction={() => router.push('/(runner)')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  earningsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
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
});
