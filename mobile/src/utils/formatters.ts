import { TaskStatus, TaskType, TrustTier } from '../api/types';
import { colors } from '../constants/colors';

/**
 * Format number into Nigerian Naira (₦) currency string
 */
export function formatNaira(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '₦0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₦0.00';
  return '₦' + num.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format ISO date string into readable format (e.g. "Sep 24, 2026 • 2:30 PM")
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/**
 * Returns human-readable label, color token, and description for each TaskStatus
 */
export function getStatusMeta(status: TaskStatus): {
  label: string;
  color: string;
  backgroundColor: string;
  textColor: string;
  stepIndex: number;
  description: string;
} {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Awaiting Payment',
        color: colors.warning,
        backgroundColor: colors.warningLight,
        textColor: colors.warningText,
        stepIndex: 0,
        description: 'Task created, waiting for escrow funding',
      };
    case 'FUNDED':
      return {
        label: 'Looking for Runner',
        color: colors.info,
        backgroundColor: colors.infoLight,
        textColor: colors.infoText,
        stepIndex: 1,
        description: 'Payment secured in escrow. Finding nearby runner...',
      };
    case 'ACCEPTED':
      return {
        label: 'Runner Assigned',
        color: colors.info,
        backgroundColor: colors.infoLight,
        textColor: colors.infoText,
        stepIndex: 2,
        description: 'A runner has accepted your task and is heading to pickup',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        color: colors.coral,
        backgroundColor: colors.coralLight,
        textColor: colors.coralDark,
        stepIndex: 3,
        description: 'Runner is actively working on your errand',
      };
    case 'PICKED_UP':
      return {
        label: 'Items Picked Up',
        color: colors.coral,
        backgroundColor: colors.coralLight,
        textColor: colors.coralDark,
        stepIndex: 4,
        description: 'Runner has collected the items and is heading to delivery',
      };
    case 'DELIVERED':
      return {
        label: 'Delivered',
        color: colors.success,
        backgroundColor: colors.successLight,
        textColor: colors.successText,
        stepIndex: 5,
        description: 'Runner has reached delivery destination. Please confirm!',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        color: colors.success,
        backgroundColor: colors.successLight,
        textColor: colors.successText,
        stepIndex: 6,
        description: 'Delivery confirmed and funds released to runner',
      };
    case 'DISPUTED':
      return {
        label: 'Disputed',
        color: colors.error,
        backgroundColor: colors.errorLight,
        textColor: colors.errorText,
        stepIndex: -1,
        description: 'Task is under review by PickNGo support',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: colors.textMuted,
        backgroundColor: colors.surfaceSubtle,
        textColor: colors.textSecondary,
        stepIndex: -1,
        description: 'This task was cancelled',
      };
    default:
      return {
        label: status,
        color: colors.mediumGray,
        backgroundColor: colors.surfaceSubtle,
        textColor: colors.textSecondary,
        stepIndex: 0,
        description: '',
      };
  }
}

/**
 * Returns metadata for Trust Tiers
 */
export function getTrustTierMeta(tier: TrustTier = 'BRONZE'): {
  name: string;
  badgeColor: string;
  bgLight: string;
  maxCap: string;
  icon: string;
} {
  switch (tier) {
    case 'PLATINUM':
      return {
        name: 'Platinum Tier',
        badgeColor: colors.platinum,
        bgLight: colors.platinumLight,
        maxCap: '₦200,000+',
        icon: '💎',
      };
    case 'GOLD':
      return {
        name: 'Gold Tier',
        badgeColor: colors.gold,
        bgLight: colors.goldLight,
        maxCap: '₦100,000',
        icon: '🥇',
      };
    case 'SILVER':
      return {
        name: 'Silver Tier',
        badgeColor: colors.silver,
        bgLight: colors.silverLight,
        maxCap: '₦50,000',
        icon: '🥈',
      };
    case 'BRONZE':
    default:
      return {
        name: 'Bronze Tier',
        badgeColor: colors.bronze,
        bgLight: colors.bronzeLight,
        maxCap: '₦20,000',
        icon: '🥉',
      };
  }
}

/**
 * Get readable task type title and icon
 */
export function getTaskTypeInfo(type: TaskType): { title: string; icon: string } {
  if (type === 'SUPERMARKET_RUN') {
    return { title: 'Supermarket Run', icon: '🛒' };
  }
  return { title: 'Pickup & Delivery', icon: '📦' };
}
