import React from 'react';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ViewStyle } from 'react-native';
import { colors as defaultColors } from '../constants/colors';

export type IconName =
  | 'home'
  | 'cart'
  | 'package'
  | 'bike'
  | 'motorcycle'
  | 'history'
  | 'person'
  | 'flash'
  | 'check-circle'
  | 'clock'
  | 'alert-circle'
  | 'chevron-right'
  | 'arrow-left'
  | 'star'
  | 'star-outline'
  | 'shield'
  | 'phone'
  | 'mail'
  | 'lock'
  | 'logout'
  | 'moon'
  | 'sun'
  | 'refresh'
  | 'map-pin'
  | 'wallet'
  | 'filter'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'search'
  | 'store'
  | 'document'
  | 'help-circle'
  | 'info'
  | 'sparkles';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = defaultColors.coral,
  style,
}) => {
  switch (name) {
    case 'home':
      return <Ionicons name="home-sharp" size={size} color={color} style={style} />;
    case 'cart':
      return <Ionicons name="cart-sharp" size={size} color={color} style={style} />;
    case 'package':
      return <Feather name="package" size={size} color={color} style={style} />;
    case 'bike':
    case 'motorcycle':
      return <MaterialCommunityIcons name="motorbike" size={size} color={color} style={style} />;
    case 'history':
      return <Ionicons name="receipt-sharp" size={size} color={color} style={style} />;
    case 'person':
      return <Ionicons name="person-sharp" size={size} color={color} style={style} />;
    case 'flash':
      return <Ionicons name="flash-sharp" size={size} color={color} style={style} />;
    case 'check-circle':
      return <Ionicons name="checkmark-circle-sharp" size={size} color={color} style={style} />;
    case 'clock':
      return <Ionicons name="time-sharp" size={size} color={color} style={style} />;
    case 'alert-circle':
      return <Ionicons name="alert-circle-sharp" size={size} color={color} style={style} />;
    case 'chevron-right':
      return <Ionicons name="chevron-forward-sharp" size={size} color={color} style={style} />;
    case 'arrow-left':
      return <Ionicons name="arrow-back-sharp" size={size} color={color} style={style} />;
    case 'star':
      return <Ionicons name="star-sharp" size={size} color={color} style={style} />;
    case 'star-outline':
      return <Ionicons name="star-outline" size={size} color={color} style={style} />;
    case 'shield':
      return <Ionicons name="shield-checkmark-sharp" size={size} color={color} style={style} />;
    case 'phone':
      return <Ionicons name="call-sharp" size={size} color={color} style={style} />;
    case 'mail':
      return <Ionicons name="mail-sharp" size={size} color={color} style={style} />;
    case 'lock':
      return <Ionicons name="lock-closed-sharp" size={size} color={color} style={style} />;
    case 'logout':
      return <Ionicons name="log-out-sharp" size={size} color={color} style={style} />;
    case 'moon':
      return <Ionicons name="moon-sharp" size={size} color={color} style={style} />;
    case 'sun':
      return <Ionicons name="sunny-sharp" size={size} color={color} style={style} />;
    case 'refresh':
      return <Ionicons name="refresh-sharp" size={size} color={color} style={style} />;
    case 'map-pin':
      return <Ionicons name="location-sharp" size={size} color={color} style={style} />;
    case 'wallet':
      return <Ionicons name="wallet-sharp" size={size} color={color} style={style} />;
    case 'filter':
      return <Ionicons name="filter-sharp" size={size} color={color} style={style} />;
    case 'close':
      return <Ionicons name="close-sharp" size={size} color={color} style={style} />;
    case 'eye':
      return <Ionicons name="eye-sharp" size={size} color={color} style={style} />;
    case 'eye-off':
      return <Ionicons name="eye-off-sharp" size={size} color={color} style={style} />;
    case 'search':
      return <Ionicons name="search-sharp" size={size} color={color} style={style} />;
    case 'store':
      return <Ionicons name="storefront-sharp" size={size} color={color} style={style} />;
    case 'document':
      return <Ionicons name="document-text-sharp" size={size} color={color} style={style} />;
    case 'help-circle':
      return <Ionicons name="help-circle-sharp" size={size} color={color} style={style} />;
    case 'info':
      return <Ionicons name="information-circle-sharp" size={size} color={color} style={style} />;
    case 'sparkles':
      return <Ionicons name="sparkles-sharp" size={size} color={color} style={style} />;
    default:
      return <Ionicons name="ellipse" size={size} color={color} style={style} />;
  }
};
