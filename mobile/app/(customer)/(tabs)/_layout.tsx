import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/hooks/useTheme';
import { Icon } from '../../../src/components/Icon';

export default function CustomerTabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 12 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: isDark ? colors.charcoal : colors.white,
            borderTopColor: colors.border,
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrapper}>
              <Icon name="home" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrapper}>
              <Icon name="history" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrapper}>
              <Icon name="person" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
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
});
