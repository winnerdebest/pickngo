import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { TaskType } from '../../src/api/types';
import { createTask } from '../../src/api/tasks';
import { formatNaira } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Icon } from '../../src/components/Icon';

export default function CreateTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ defaultType?: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [type, setType] = useState<TaskType>(
    params.defaultType === 'PICKUP' ? 'PICKUP' : 'SUPERMARKET_RUN'
  );
  const [description, setDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [goodsCost, setGoodsCost] = useState('');
  const [serviceFee, setServiceFee] = useState('1500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numGoodsCost = parseFloat(goodsCost) || 0;
  const numServiceFee = parseFloat(serviceFee) || 0;
  const totalAmount = numGoodsCost + numServiceFee;

  const handleCreate = async () => {
    if (!user) {
      setError('You must be signed in to create a task.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description or items list.');
      return;
    }
    if (!pickupAddress.trim()) {
      setError('Please enter the pickup or supermarket address.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Please enter the delivery destination address.');
      return;
    }
    if (numServiceFee <= 0) {
      setError('Service fee must be greater than zero.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newTask = await createTask({
        type,
        customer_id: user.id,
        description: description.trim(),
        pickup_address: pickupAddress.trim(),
        delivery_address: deliveryAddress.trim(),
        estimated_goods_cost: numGoodsCost,
        service_fee: numServiceFee,
      });

      router.push({
        pathname: '/(customer)/fund-task',
        params: { taskId: newTask.id },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Post a New Task" showBack />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* Type Toggle Selector */}
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Select Task Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setType('SUPERMARKET_RUN')}
              style={[
                styles.typeOption,
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: type === 'SUPERMARKET_RUN' ? colors.coral : colors.border,
                },
                type === 'SUPERMARKET_RUN' && { backgroundColor: isDark ? colors.cardElevated : colors.coralLight },
              ]}
            >
              <Icon
                name="cart"
                size={24}
                color={type === 'SUPERMARKET_RUN' ? colors.coral : colors.textMuted}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  { color: type === 'SUPERMARKET_RUN' ? colors.coral : colors.textSecondary },
                ]}
              >
                Supermarket Run
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setType('PICKUP')}
              style={[
                styles.typeOption,
                {
                  backgroundColor: isDark ? colors.card : colors.white,
                  borderColor: type === 'PICKUP' ? colors.coral : colors.border,
                },
                type === 'PICKUP' && { backgroundColor: isDark ? colors.cardElevated : colors.coralLight },
              ]}
            >
              <Icon
                name="package"
                size={24}
                color={type === 'PICKUP' ? colors.coral : colors.textMuted}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  { color: type === 'PICKUP' ? colors.coral : colors.textSecondary },
                ]}
              >
                Pickup & Drop
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          <ErrorMessage message={error} onRetry={() => setError(null)} />

          {/* Form Fields */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: isDark ? colors.card : colors.white,
                borderColor: colors.border,
              },
            ]}
          >
            <Input
              label={
                type === 'SUPERMARKET_RUN'
                  ? 'Shopping Items List'
                  : 'Item Description'
              }
              placeholder={
                type === 'SUPERMARKET_RUN'
                  ? 'e.g. 2 bags of rice, 1 carton of milk, cooking oil'
                  : 'e.g. 1 brown envelope document, handle with care'
              }
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (error) setError(null);
              }}
              multiline
              numberOfLines={3}
              style={styles.textArea}
              prefix={<Icon name="document" size={18} color={colors.textMuted} />}
            />

            <Input
              label={
                type === 'SUPERMARKET_RUN'
                  ? 'Supermarket / Store Address'
                  : 'Pickup Address'
              }
              placeholder="e.g. Spar Supermarket, Victoria Island, Lagos"
              value={pickupAddress}
              onChangeText={(text) => {
                setPickupAddress(text);
                if (error) setError(null);
              }}
              prefix={<Icon name="map-pin" size={18} color={colors.coral} />}
            />

            <Input
              label="Delivery Destination Address"
              placeholder="e.g. Flat 4B, Admiralty Way, Lekki Phase 1"
              value={deliveryAddress}
              onChangeText={(text) => {
                setDeliveryAddress(text);
                if (error) setError(null);
              }}
              prefix={<Icon name="map-pin" size={18} color={colors.textMuted} />}
            />

            <View style={styles.amountRow}>
              <View style={styles.amountCol}>
                <Input
                  label="Est. Goods Cost (₦)"
                  placeholder="0"
                  value={goodsCost}
                  onChangeText={(text) => setGoodsCost(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  prefix="₦"
                />
              </View>

              <View style={styles.amountCol}>
                <Input
                  label="Runner Fee (₦)"
                  placeholder="1500"
                  value={serviceFee}
                  onChangeText={(text) => setServiceFee(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  prefix="₦"
                />
              </View>
            </View>
          </View>

          {/* Price Summary Breakdown */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: isDark ? colors.card : colors.white,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Payment Breakdown</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Estimated Goods Cost</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatNaira(numGoodsCost)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery Service Fee</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatNaira(numServiceFee)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Escrow Amount</Text>
              <Text style={[styles.totalValue, { color: colors.coral }]}>{formatNaira(totalAmount)}</Text>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={loading ? 'Creating Task...' : 'Continue to Funding'}
            onPress={handleCreate}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    gap: 6,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountCol: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  submitBtn: {
    marginBottom: 20,
  },
});
