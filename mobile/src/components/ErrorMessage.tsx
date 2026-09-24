import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';

interface ErrorMessageProps {
  message?: string | null;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  style,
}) => {
  const { colors } = useTheme();

  if (!message) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.errorLight,
          borderColor: colors.error,
        },
        style,
      ]}
    >
      <Icon name="alert-circle" size={22} color={colors.error} style={{ marginTop: 2 }} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.errorText }]}>Error</Text>
        <Text style={[styles.message, { color: colors.errorText }]}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRetry}
            style={[styles.retryButton, { backgroundColor: colors.error }]}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
