import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Task } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { formatNaira, formatDate, getTaskTypeInfo } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  style?: ViewStyle;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, style }) => {
  const { colors, isDark } = useTheme();
  const typeInfo = getTaskTypeInfo(task.type);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.card : colors.white,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top row: Type & Status */}
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <Icon
            name={task.type === 'SUPERMARKET_RUN' ? 'cart' : 'package'}
            size={18}
            color={colors.coral}
          />
          <Text style={[styles.typeTitle, { color: colors.textPrimary }]}>
            {typeInfo.title}
          </Text>
        </View>
        <StatusBadge status={task.status} size="small" />
      </View>

      {/* Description Preview */}
      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
        {task.description}
      </Text>

      {/* Route Addresses */}
      <View
        style={[
          styles.routeContainer,
          { backgroundColor: isDark ? colors.cardSubtle : colors.surfaceSubtle },
        ]}
      >
        <View style={styles.addressRow}>
          <Icon name="map-pin" size={14} color={colors.coral} />
          <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
            <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>Pick: </Text>
            {task.pickup_address}
          </Text>
        </View>

        <View style={[styles.routeLine, { backgroundColor: colors.border }]} />

        <View style={styles.addressRow}>
          <Icon name="map-pin" size={14} color={colors.textMuted} />
          <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
            <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>Drop: </Text>
            {task.delivery_address}
          </Text>
        </View>
      </View>

      {/* Bottom row: Total Amount & Date */}
      <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Total Value</Text>
          <Text style={[styles.amountValue, { color: colors.coral }]}>
            {formatNaira(task.total_amount)}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatDate(task.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  routeContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLine: {
    width: 2,
    height: 10,
    marginLeft: 6,
    marginVertical: 2,
  },
  addressLabel: {
    fontWeight: '700',
  },
  addressText: {
    flex: 1,
    fontSize: 13,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
  },
});
