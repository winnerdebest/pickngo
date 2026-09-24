import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: string | React.ReactNode;
  suffix?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  prefix,
  suffix,
  containerStyle,
  secureTextEntry,
  style,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? colors.card : colors.white,
            borderColor: isFocused
              ? colors.coral
              : error
              ? colors.error
              : colors.border,
          },
          props.multiline ? styles.multilineContainer : null,
        ]}
      >
        {prefix && (
          <View style={styles.prefixContainer}>
            {typeof prefix === 'string' ? (
              <Text style={[styles.prefixText, { color: colors.coral }]}>{prefix}</Text>
            ) : (
              prefix
            )}
          </View>
        )}

        <TextInput
          placeholderTextColor={colors.textMuted}
          keyboardAppearance={props.keyboardAppearance || (isDark ? 'dark' : 'light')}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          style={[styles.input, { color: colors.textPrimary }, style]}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.togglePasswordBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {suffix && <View style={styles.suffixContainer}>{suffix}</View>}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  prefixContainer: {
    marginRight: 8,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '800',
  },
  suffixContainer: {
    marginLeft: 8,
  },
  togglePasswordBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
  },
});
