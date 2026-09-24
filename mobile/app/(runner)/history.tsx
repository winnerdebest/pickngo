import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/constants/colors';
import { Task } from '../../src/api/types';
import { getRunnerTasks } from '../../src/api/runners';
import { formatNaira } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { TaskCard } from '../../src/components/TaskCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function RunnerHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRunnerHistory = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
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
    [user]
  );

  useEffect(() => {
    loadRunnerHistory();
  }, [loadRunnerHistory]);

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const totalEarnings = completedTasks.reduce((sum, t) => sum + (t.service_fee || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Errand History" />

      {/* Earnings Overview Card */}
      <View style={styles.earningsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Earned</Text>
          <Text style={styles.statValue}>{formatNaira(totalEarnings)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{completedTasks.length}</Text>
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
          <Text style={styles.loadingText}>Loading history...</Text>
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
              icon="📋"
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
    backgroundColor: colors.background,
  },
  earningsCard: {
    flexDirection: 'row',
    backgroundColor: colors.charcoal,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.coral,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    color: colors.textSecondary,
  },
});
