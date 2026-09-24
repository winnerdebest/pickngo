import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TaskStatus } from '../api/types';
import { getStatusMeta } from '../utils/formatters';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  style,
}) => {
  const meta = getStatusMeta(status);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.backgroundColor, borderColor: meta.color },
        size === 'small' && styles.smallBadge,
        size === 'large' && styles.largeBadge,
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text
        style={[
          styles.text,
          { color: meta.textColor },
          size === 'small' && styles.smallText,
          size === 'large' && styles.largeText,
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  largeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 11,
  },
  largeText: {
    fontSize: 14,
  },
});
