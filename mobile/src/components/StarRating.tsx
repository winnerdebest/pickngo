import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  maxStars?: number;
  interactive?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor (1/5)',
  2: 'Fair (2/5)',
  3: 'Good (3/5)',
  4: 'Great (4/5)',
  5: 'Exceptional (5/5) ★',
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxStars = 5,
  interactive = true,
  size = 'medium',
  showLabel = true,
  style,
}) => {
  const { colors } = useTheme();
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const getStarSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 34;
      case 'medium':
      default:
        return 26;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {stars.map((starNum) => {
          const isFilled = starNum <= rating;
          return (
            <TouchableOpacity
              key={starNum}
              disabled={!interactive}
              activeOpacity={0.7}
              onPress={() => onRatingChange && onRatingChange(starNum)}
              style={styles.starTouch}
            >
              <Icon
                name={isFilled ? 'star' : 'star-outline'}
                size={getStarSize()}
                color={isFilled ? '#F59E0B' : colors.borderDark}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {showLabel && rating > 0 && (
        <Text style={[styles.labelText, { color: colors.textPrimary }]}>
          {RATING_LABELS[rating] || `${rating}/${maxStars}`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starTouch: {
    padding: 4,
  },
  labelText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
  },
});
