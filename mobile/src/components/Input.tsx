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
import { colors } from '../constants/colors';

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
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          props.multiline ? styles.multilineContainer : null,
        ]}
      >
        {prefix && (
          <View style={styles.prefixContainer}>
            {typeof prefix === 'string' ? <Text style={styles.prefixText}>{prefix}</Text> : prefix}
          </View>
        )}

        <TextInput
          placeholderTextColor={colors.mediumGray}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          style={[styles.input, style]}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.togglePasswordBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.togglePasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}

        {suffix && <View style={styles.suffixContainer}>{suffix}</View>}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
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
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: colors.coral,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  prefixContainer: {
    marginRight: 8,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.coral,
  },
  suffixContainer: {
    marginLeft: 8,
  },
  togglePasswordBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  togglePasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.coral,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
