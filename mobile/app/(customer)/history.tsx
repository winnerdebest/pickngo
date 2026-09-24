import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/constants/colors';
import { Task } from '../../src/api/types';
import { getCustomerTasks } from '../../src/api/customers';
import { Header } from '../../src/components/Header';
import { TaskCard } from '../../src/components/TaskCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorMessage } from '../../src/components/ErrorMessage';

type FilterTab = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function CustomerHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const data = await getCustomerTasks(user.id);
        setTasks(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load task history');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredTasks = tasks.filter((task) => {
    switch (selectedFilter) {
      case 'ACTIVE':
        return task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
      case 'COMPLETED':
        return task.status === 'COMPLETED';
      case 'CANCELLED':
        return task.status === 'CANCELLED' || task.status === 'DISPUTED';
      case 'ALL':
      default:
        return true;
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Task History" />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as FilterTab[]).map((tab) => {
          const isActive = selectedFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setSelectedFilter(tab)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {tab === 'ALL'
                  ? 'All'
                  : tab === 'ACTIVE'
                  ? 'Active'
                  : tab === 'COMPLETED'
                  ? 'Completed'
                  : 'Cancelled'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Error Message */}
      <View style={{ paddingHorizontal: 20 }}>
        <ErrorMessage message={error} onRetry={() => loadHistory()} />
      </View>

      {/* Task List */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHistory(true)}
              tintColor={colors.coral}
              colors={[colors.coral]}
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/track-task',
                  params: { taskId: item.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="No tasks in this category"
              description="You don't have any tasks matching this status filter."
              actionTitle="Post a Task"
              onAction={() => router.push('/(customer)/create-task')}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
  },
  filterTabActive: {
    backgroundColor: colors.coral,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
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
