import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

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
  5: 'Exceptional (5/5) ⭐',
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
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const getStarSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 36;
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
              <Text
                style={[
                  styles.star,
                  { fontSize: getStarSize() },
                  isFilled ? styles.starFilled : styles.starEmpty,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showLabel && rating > 0 && (
        <Text style={styles.labelText}>{RATING_LABELS[rating] || `${rating}/${maxStars}`}</Text>
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
    gap: 8,
  },
  starTouch: {
    padding: 4,
  },
  star: {
    fontWeight: '700',
  },
  starFilled: {
    color: '#FFB800',
  },
  starEmpty: {
    color: '#E2E8F0',
  },
  labelText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
