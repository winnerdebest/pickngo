import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  textStyle,
}) => {
  const isInteractionDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    if (fullWidth) list.push(styles.fullWidth);

    // Size
    switch (size) {
      case 'small':
        list.push(styles.smallSize);
        break;
      case 'medium':
        list.push(styles.mediumSize);
        break;
      case 'large':
      default:
        list.push(styles.largeSize);
        break;
    }

    // Variant
    switch (variant) {
      case 'secondary':
        list.push(styles.secondaryVariant);
        break;
      case 'outline':
        list.push(styles.outlineVariant);
        break;
      case 'ghost':
        list.push(styles.ghostVariant);
        break;
      case 'danger':
        list.push(styles.dangerVariant);
        break;
      case 'primary':
      default:
        list.push(styles.primaryVariant);
        break;
    }

    if (isInteractionDisabled) {
      list.push(styles.disabled);
    }

    if (style) list.push(style);

    return list;
  };

  const getTextStyle = (): TextStyle[] => {
    const list: TextStyle[] = [styles.baseText];

    switch (size) {
      case 'small':
        list.push(styles.smallText);
        break;
      case 'medium':
        list.push(styles.mediumText);
        break;
      case 'large':
      default:
        list.push(styles.largeText);
        break;
    }

    switch (variant) {
      case 'outline':
        list.push(styles.outlineText);
        break;
      case 'ghost':
        list.push(styles.ghostText);
        break;
      case 'danger':
        list.push(styles.dangerText);
        break;
      case 'secondary':
      case 'primary':
      default:
        list.push(styles.primaryText);
        break;
    }

    if (textStyle) list.push(textStyle);

    return list;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isInteractionDisabled}
      style={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.coral : colors.white}
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  smallSize: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  mediumSize: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  largeSize: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  primaryVariant: {
    backgroundColor: colors.coral,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryVariant: {
    backgroundColor: colors.charcoal,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  outlineVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.coral,
  },
  ghostVariant: {
    backgroundColor: colors.surfaceSubtle,
  },
  dangerVariant: {
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 13,
  },
  mediumText: {
    fontSize: 15,
  },
  largeText: {
    fontSize: 16,
  },
  primaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.coral,
  },
  ghostText: {
    color: colors.textPrimary,
  },
  dangerText: {
    color: colors.white,
  },
});
