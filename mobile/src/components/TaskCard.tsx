import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Task } from '../api/types';
import { colors } from '../constants/colors';
import { formatNaira, formatDate, getTaskTypeInfo } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  style?: ViewStyle;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, style }) => {
  const typeInfo = getTaskTypeInfo(task.type);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, style]}
    >
      {/* Top row: Type & Status */}
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
          <Text style={styles.typeTitle}>{typeInfo.title}</Text>
        </View>
        <StatusBadge status={task.status} size="small" />
      </View>

      {/* Description Preview */}
      <Text style={styles.description} numberOfLines={2}>
        {task.description}
      </Text>

      {/* Route Addresses */}
      <View style={styles.routeContainer}>
        <View style={styles.addressRow}>
          <View style={[styles.dotMarker, { backgroundColor: colors.coral }]} />
          <Text style={styles.addressText} numberOfLines={1}>
            <Text style={styles.addressLabel}>Pick: </Text>
            {task.pickup_address}
          </Text>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.addressRow}>
          <View style={[styles.dotMarker, { backgroundColor: colors.charcoal }]} />
          <Text style={styles.addressText} numberOfLines={1}>
            <Text style={styles.addressLabel}>Drop: </Text>
            {task.delivery_address}
          </Text>
        </View>
      </View>

      {/* Bottom row: Total Amount & Date */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.amountLabel}>Total Value</Text>
          <Text style={styles.amountValue}>{formatNaira(task.total_amount)}</Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(task.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    gap: 6,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  routeContainer: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 2,
    height: 10,
    backgroundColor: colors.borderDark,
    marginLeft: 3,
    marginVertical: 2,
  },
  addressLabel: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.coral,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
