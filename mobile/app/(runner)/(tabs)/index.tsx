import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useTheme } from '../../../src/hooks/useTheme';
import { useAvailableTasksWebSocket } from '../../../src/hooks/useAvailableTasksWebSocket';
import { LiveIndicator } from '../../../src/components/LiveIndicator';
import { TrustBadge } from '../../../src/components/TrustBadge';
import { TaskCard } from '../../../src/components/TaskCard';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorMessage } from '../../../src/components/ErrorMessage';
import { Logo } from '../../../src/components/Logo';
import { Icon } from '../../../src/components/Icon';

export default function RunnerAvailableFeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const {
    tasks,
    isConnected,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useAvailableTasksWebSocket({ runnerId: user?.id });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header with Logo & Status */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: isDark ? colors.charcoal : colors.white,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Logo size="small" theme={isDark ? 'dark' : 'light'} variant="combo" style={{ alignItems: 'flex-start' }} />

        <View style={styles.topRight}>
          <View style={styles.topActionRow}>
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
            <LiveIndicator connected={isConnected} label="FEED LIVE" />
          </View>
          <TrustBadge tier={user?.trust_tier || 'BRONZE'} size="small" />
        </View>
      </View>

      {/* Banner */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: isDark ? colors.card : colors.white,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={[styles.bannerIconCircle, { backgroundColor: colors.coralLight }]}>
          <Icon name="flash" size={20} color={colors.coral} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
            Real-Time Task Stream
          </Text>
          <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
            New funded tasks in your trust tier appear here automatically.
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
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Fetching available tasks...
          </Text>
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
              icon="bike"
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  topRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSub: {
    fontSize: 12,
    color: '#A1A1AA',
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
  },
});
