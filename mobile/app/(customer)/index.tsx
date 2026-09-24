import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/constants/colors';
import { Task } from '../../src/api/types';
import { getCustomerTasks } from '../../src/api/customers';
import { formatNaira, formatDate, getTaskTypeInfo } from '../../src/utils/formatters';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Button } from '../../src/components/Button';
import { TaskCard } from '../../src/components/TaskCard';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const data = await getCustomerTasks(user.id);
        setTasks(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load your tasks');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Find active task (not completed or cancelled)
  const activeTask = tasks.find(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  );

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTasks(true)}
            tintColor={colors.coral}
            colors={[colors.coral]}
          />
        }
      >
        {/* Top Greeting Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingSub}>Welcome back,</Text>
            <Text style={styles.greetingName}>
              {user?.full_name?.split(' ')[0] || 'Customer'} 👋
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(customer)/profile')}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarEmoji}>🛒</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Banner: Post a Task */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Need something done fast?</Text>
            <Text style={styles.heroDesc}>
              Groceries, supermarket runs, food pickup, or parcel deliveries right to your door.
            </Text>
            <Button
              title="Post a Task Now 🚀"
              onPress={() => router.push('/(customer)/create-task')}
              variant="primary"
              size="medium"
              style={styles.heroBtn}
            />
          </View>
        </View>

        {/* Error Message */}
        <ErrorMessage message={error} onRetry={() => loadTasks()} />

        {/* Live Active Task Card */}
        {activeTask && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Active Task</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(customer)/track-task',
                    params: { taskId: activeTask.id },
                  })
                }
              >
                <Text style={styles.viewLink}>Track Live →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/track-task',
                  params: { taskId: activeTask.id },
                })
              }
              style={styles.activeCard}
            >
              <View style={styles.activeCardHeader}>
                <View style={styles.activeType}>
                  <Text style={styles.activeEmoji}>
                    {getTaskTypeInfo(activeTask.type).icon}
                  </Text>
                  <Text style={styles.activeTypeName}>
                    {getTaskTypeInfo(activeTask.type).title}
                  </Text>
                </View>
                <StatusBadge status={activeTask.status} size="small" />
              </View>

              <Text style={styles.activeDesc} numberOfLines={2}>
                {activeTask.description}
              </Text>

              <View style={styles.activeFooter}>
                <Text style={styles.activeAmount}>
                  {formatNaira(activeTask.total_amount)}
                </Text>
                <View style={styles.trackPill}>
                  <Text style={styles.trackPillText}>Live Tracker 📍</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Errand Services</Text>
          <View style={styles.categoriesRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/create-task',
                  params: { defaultType: 'SUPERMARKET_RUN' },
                })
              }
              style={styles.categoryCard}
            >
              <View style={styles.categoryIconCircle}>
                <Text style={styles.categoryIcon}>🛒</Text>
              </View>
              <Text style={styles.categoryTitle}>Supermarket</Text>
              <Text style={styles.categorySub}>Groceries & food items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/create-task',
                  params: { defaultType: 'PICKUP' },
                })
              }
              style={styles.categoryCard}
            >
              <View style={styles.categoryIconCircle}>
                <Text style={styles.categoryIcon}>📦</Text>
              </View>
              <Text style={styles.categoryTitle}>Pickup & Drop</Text>
              <Text style={styles.categorySub}>Documents & packages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{activeTask ? 1 : 0}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* Recent Tasks List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            {tasks.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/(customer)/history')}>
                <Text style={styles.viewLink}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {tasks.length === 0 && !loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyDesc}>
                Post your first errand and a runner will be on the way!
              </Text>
            </View>
          ) : (
            tasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() =>
                  router.push({
                    pathname: '/(customer)/track-task',
                    params: { taskId: task.id },
                  })
                }
              />
            ))
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.charcoal,
    letterSpacing: 0.3,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.coralLight,
    borderWidth: 1.5,
    borderColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  heroCard: {
    backgroundColor: colors.charcoal,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroContent: {
    width: '100%',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.coral,
  },
  activeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.coral,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeEmoji: {
    fontSize: 16,
  },
  activeTypeName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  activeDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  activeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  activeAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.charcoal,
  },
  trackPill: {
    backgroundColor: colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trackPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  categorySub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.coral,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
