import React from 'react';
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
import { useAvailableTasksWebSocket } from '../../src/hooks/useAvailableTasksWebSocket';
import { LiveIndicator } from '../../src/components/LiveIndicator';
import { TrustBadge } from '../../src/components/TrustBadge';
import { TaskCard } from '../../src/components/TaskCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function RunnerAvailableFeedScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    tasks,
    isConnected,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useAvailableTasksWebSocket({ runnerId: user?.id });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingSub}>Ready to roll,</Text>
          <Text style={styles.greetingName}>
            {user?.full_name?.split(' ')[0] || 'Runner'} 🛵
          </Text>
        </View>

        <View style={styles.topRight}>
          <LiveIndicator connected={isConnected} label="FEED LIVE" />
          <TrustBadge tier={user?.trust_tier || 'BRONZE'} size="small" />
        </View>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>⚡</Text>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Real-Time Task Stream</Text>
          <Text style={styles.bannerSub}>
            New funded tasks in your trust tier appear here instantly.
          </Text>
        </View>
      </View>

      {/* Error Message */}
      <View style={{ paddingHorizontal: 20 }}>
        <ErrorMessage message={error} onRetry={refresh} />
      </View>

      {/* Task List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.coral} />
          <Text style={styles.loadingText}>Fetching available tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.coral}
              colors={[colors.coral]}
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() =>
                router.push({
                  pathname: '/(runner)/task-detail',
                  params: { taskId: item.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="🛵"
              title="No Available Tasks Right Now"
              description="Keep this screen open. When a customer funds an errand matching your tier, it will pop up automatically!"
              actionTitle="Refresh Feed"
              onAction={refresh}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greetingSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.charcoal,
    letterSpacing: 0.3,
  },
  topRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bannerEmoji: {
    fontSize: 24,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 2,
    lineHeight: 16,
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
