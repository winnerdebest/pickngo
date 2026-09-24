import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface LiveIndicatorProps {
  connected?: boolean;
  label?: string;
  style?: ViewStyle;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  connected = true,
  label = 'LIVE',
  style,
}) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (connected) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [connected, pulseAnim]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: connected ? colors.successLight : colors.warningLight },
        style,
      ]}
    >
      <View style={styles.dotWrapper}>
        {connected && (
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                backgroundColor: colors.success,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.6],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
        )}
        <View
          style={[
            styles.dot,
            { backgroundColor: connected ? colors.success : colors.warning },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: connected ? colors.successText : colors.warningText }]}>
        {connected ? label : 'Reconnecting...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dotWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulseCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
