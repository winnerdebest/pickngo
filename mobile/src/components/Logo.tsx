import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  showTagline?: boolean;
  variant?: 'image' | 'wordmark' | 'combo';
  theme?: 'dark' | 'light';
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  showTagline = false,
  variant = 'combo',
  theme = 'light',
  style,
}) => {
  const getImageDimensions = () => {
    switch (size) {
      case 'small':
        return { width: 36, height: 36, borderRadius: 10 };
      case 'large':
        return { width: 84, height: 84, borderRadius: 22 };
      case 'hero':
        return { width: 120, height: 120, borderRadius: 28 };
      case 'medium':
      default:
        return { width: 56, height: 56, borderRadius: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 32;
      case 'hero':
        return 40;
      case 'medium':
      default:
        return 26;
    }
  };

  const isDark = theme === 'dark';
  const imgDim = getImageDimensions();

  return (
    <View style={[styles.container, style]}>
      {(variant === 'image' || variant === 'combo') && (
        <Image
          source={require('../../assets/logo.png')}
          style={[styles.logoImage, imgDim]}
          resizeMode="cover"
        />
      )}

      {(variant === 'wordmark' || variant === 'combo') && (
        <View style={styles.textContainer}>
          <Text style={[styles.wordmark, { fontSize: getFontSize() }]}>
            <Text style={{ color: isDark ? colors.white : colors.charcoal }}>Pick</Text>
            <Text style={{ color: colors.coral }}>N</Text>
            <Text style={{ color: isDark ? colors.white : colors.charcoal }}>Go</Text>
          </Text>

          {showTagline && (
            <Text
              style={[
                styles.tagline,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}
            >
              Fast, Reliable Errands & Delivery
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoImage: {
    backgroundColor: colors.charcoal,
    borderWidth: 2,
    borderColor: 'rgba(255, 87, 51, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
