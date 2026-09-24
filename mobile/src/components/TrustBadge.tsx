import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TrustTier } from '../api/types';
import { getTrustTierMeta } from '../utils/formatters';
import { Icon } from './Icon';

interface TrustBadgeProps {
  tier?: TrustTier;
  showCap?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  tier = 'BRONZE',
  showCap = false,
  size = 'medium',
  style,
}) => {
  const meta = getTrustTierMeta(tier);

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 18;
      case 'medium':
      default:
        return 15;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: meta.bgLight, borderColor: meta.badgeColor },
        size === 'small' && styles.smallContainer,
        size === 'large' && styles.largeContainer,
        style,
      ]}
    >
      <Icon name="shield" size={getIconSize()} color={meta.badgeColor} />
      <Text
        style={[
          styles.text,
          { color: meta.badgeColor },
          size === 'small' && styles.smallText,
          size === 'large' && styles.largeText,
        ]}
      >
        {meta.name}
      </Text>
      {showCap && (
        <Text style={[styles.capText, { color: meta.badgeColor }]}>
          (Max {meta.maxCap})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
    gap: 6,
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  largeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  smallText: {
    fontSize: 11,
  },
  largeText: {
    fontSize: 15,
  },
  capText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.85,
  },
});
