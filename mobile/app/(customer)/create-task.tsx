import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/constants/colors';
import { TaskType } from '../../src/api/types';
import { createTask } from '../../src/api/tasks';
import { formatNaira } from '../../src/utils/formatters';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function CreateTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ defaultType?: string }>();
  const { user } = useAuth();

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

      // Navigate to funding screen with created task
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
    <SafeAreaView style={styles.safeArea}>
      <Header title="Post a New Task" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Toggle Selector */}
          <Text style={styles.sectionLabel}>Select Task Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setType('SUPERMARKET_RUN')}
              style={[
                styles.typeOption,
                type === 'SUPERMARKET_RUN' && styles.typeOptionActive,
              ]}
            >
              <Text style={styles.typeEmoji}>🛒</Text>
              <Text
                style={[
                  styles.typeOptionText,
                  type === 'SUPERMARKET_RUN' && styles.typeOptionTextActive,
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
                type === 'PICKUP' && styles.typeOptionActive,
              ]}
            >
              <Text style={styles.typeEmoji}>📦</Text>
              <Text
                style={[
                  styles.typeOptionText,
                  type === 'PICKUP' && styles.typeOptionTextActive,
                ]}
              >
                Pickup & Drop
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          <ErrorMessage message={error} onRetry={() => setError(null)} />

          {/* Form Fields */}
          <View style={styles.formCard}>
            <Input
              label={
                type === 'SUPERMARKET_RUN'
                  ? 'Shopping Items List'
                  : 'Item Description'
              }
              placeholder={
                type === 'SUPERMARKET_RUN'
                  ? 'e.g. 2 bags of rice, 1 carton of milk, tomatoes, cooking oil'
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
            />

            <Input
              label="Delivery Destination Address"
              placeholder="e.g. Flat 4B, Admiralty Way, Lekki Phase 1"
              value={deliveryAddress}
              onChangeText={(text) => {
                setDeliveryAddress(text);
                if (error) setError(null);
              }}
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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Breakdown</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Goods Cost</Text>
              <Text style={styles.summaryValue}>{formatNaira(numGoodsCost)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Service Fee</Text>
              <Text style={styles.summaryValue}>{formatNaira(numServiceFee)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Escrow Amount</Text>
              <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title={loading ? 'Creating Task...' : 'Continue to Funding 🔒'}
            onPress={handleCreate}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeOptionActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coralLight,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeOptionTextActive: {
    color: colors.coral,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
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
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.charcoal,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.coral,
  },
  submitBtn: {
    marginBottom: 20,
  },
});
