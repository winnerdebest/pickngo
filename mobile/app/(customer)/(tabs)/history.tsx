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
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useTheme } from '../../../src/hooks/useTheme';
import { Task } from '../../../src/api/types';
import { getCustomerTasks } from '../../../src/api/customers';
import { Header } from '../../../src/components/Header';
import { TaskCard } from '../../../src/components/TaskCard';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorMessage } from '../../../src/components/ErrorMessage';

type FilterTab = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function CustomerHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

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

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="My Task History" />

      {/* Filter Tabs */}
      <View
        style={[
          styles.filterContainer,
          {
            backgroundColor: isDark ? colors.charcoal : colors.white,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as FilterTab[]).map((tab) => {
          const isActive = selectedFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setSelectedFilter(tab)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive
                    ? colors.coral
                    : isDark
                    ? colors.cardElevated
                    : colors.surfaceSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive
                      ? '#FFFFFF'
                      : isDark
                      ? colors.textSecondary
                      : colors.textSecondary,
                  },
                ]}
              >
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
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading history...
          </Text>
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
              icon="history"
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
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
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
