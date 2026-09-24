import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { colors } from '../../src/constants/colors';

export default function RunnerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Available',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>🛵</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'My Runs',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>📋</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconWrapper}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>👤</Text>
            </View>
          ),
        }}
      />
      {/* Hidden nested stack screens */}
      <Tabs.Screen
        name="task-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="active-task"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabEmojiActive: {
    opacity: 1,
  },
});
