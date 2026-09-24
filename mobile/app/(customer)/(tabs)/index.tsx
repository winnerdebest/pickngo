import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useTheme } from '../../../src/hooks/useTheme';
import { Task } from '../../../src/api/types';
import { getCustomerTasks } from '../../../src/api/customers';
import { formatNaira, getTaskTypeInfo } from '../../../src/utils/formatters';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { Button } from '../../../src/components/Button';
import { TaskCard } from '../../../src/components/TaskCard';
import { ErrorMessage } from '../../../src/components/ErrorMessage';
import { Logo } from '../../../src/components/Logo';
import { Icon } from '../../../src/components/Icon';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (!user) return;
      try {
        if (isRefresh) setRefreshing(true);
        else if (!isSilent) setLoading(true);
        setError(null);
        const data = await getCustomerTasks(user.id);
        setTasks(data);
      } catch (err: any) {
        if (!isSilent) {
          setError(err.message || 'Failed to load your tasks');
        }
      } finally {
        if (!isSilent) setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      loadTasks(false, false);
      const interval = setInterval(() => {
        loadTasks(false, true);
      }, 5000);
      return () => clearInterval(interval);
    }, [loadTasks])
  );

  const activeTask = tasks.find(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  );

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
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
        {/* Top Greeting Bar with Logo & Theme Switch */}
        <View style={styles.topBar}>
          <Logo size="small" theme={isDark ? 'dark' : 'light'} variant="combo" style={{ alignItems: 'flex-start' }} />
          
          <View style={styles.topRightActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleTheme}
              style={[
                styles.iconBtn,
                { backgroundColor: isDark ? colors.cardElevated : colors.surfaceSubtle },
              ]}
            >
              <Icon
                name={isDark ? 'sun' : 'moon'}
                size={18}
                color={isDark ? colors.warning : colors.charcoal}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(customer)/profile')}
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.coralLight, borderColor: colors.coral },
              ]}
            >
              <Icon name="person" size={20} color={colors.coral} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Banner: Post a Task */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Need something done fast?</Text>
              <Icon name="flash" size={22} color={colors.coral} />
            </View>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Groceries, supermarket runs, food pickup, or parcel deliveries right to your door.
            </Text>
            <Button
              title="Post a Task Now"
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
              <View style={styles.sectionTitleRow}>
                <Icon name="flash" size={18} color={colors.coral} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Task</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(customer)/track-task',
                    params: { taskId: activeTask.id },
                  })
                }
              >
                <Text style={[styles.viewLink, { color: colors.coral }]}>Track Live →</Text>
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
              style={[
                styles.activeCard,
                { backgroundColor: isDark ? colors.card : colors.white, borderColor: colors.coral },
              ]}
            >
              <View style={styles.activeCardHeader}>
                <View style={styles.activeType}>
                  <Icon
                    name={activeTask.type === 'SUPERMARKET_RUN' ? 'cart' : 'package'}
                    size={18}
                    color={colors.coral}
                  />
                  <Text style={[styles.activeTypeName, { color: colors.textPrimary }]}>
                    {getTaskTypeInfo(activeTask.type).title}
                  </Text>
                </View>
                <StatusBadge status={activeTask.status} size="small" />
              </View>

              <Text style={[styles.activeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {activeTask.description}
              </Text>

              <View style={[styles.activeFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.activeAmount, { color: colors.textPrimary }]}>
                  {formatNaira(activeTask.total_amount)}
                </Text>
                <View style={[styles.trackPill, { backgroundColor: colors.coral }]}>
                  <Icon name="map-pin" size={12} color="#FFFFFF" />
                  <Text style={styles.trackPillText}>Live Tracker</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Errand Services</Text>
          <View style={styles.categoriesRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/create-task',
                  params: { defaultType: 'SUPERMARKET_RUN' },
                })
              }
              style={[
                styles.categoryCard,
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: colors.coralLight }]}>
                <Icon name="cart" size={22} color={colors.coral} />
              </View>
              <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>Supermarket</Text>
              <Text style={[styles.categorySub, { color: colors.textSecondary }]}>
                Groceries & items
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/create-task',
                  params: { defaultType: 'PICKUP' },
                })
              }
              style={[
                styles.categoryCard,
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: colors.coralLight }]}>
                <Icon name="package" size={22} color={colors.coral} />
              </View>
              <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>Pickup & Drop</Text>
              <Text style={[styles.categorySub, { color: colors.textSecondary }]}>
                Parcels & docs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View
          style={[
            styles.statsContainer,
            {
              backgroundColor: isDark ? colors.card : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.coral }]}>{tasks.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Tasks</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.successText }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.coral }]}>{activeTask ? 1 : 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
          </View>
        </View>

        {/* Recent Tasks List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Requests</Text>
            {tasks.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/(customer)/history')}>
                <Text style={[styles.viewLink, { color: colors.coral }]}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {tasks.length === 0 && !loading ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="document" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No tasks yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
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
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroContent: {
    width: '100%',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroDesc: {
    fontSize: 13,
    color: '#A1A1AA',
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    gap: 8,
  },
  activeTypeName: {
    fontSize: 14,
    fontWeight: '800',
  },
  activeDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  activeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  activeAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  trackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  trackPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  categorySub: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
});
