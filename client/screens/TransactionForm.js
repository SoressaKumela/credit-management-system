import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

export default function TransactionForm({ route, navigation }) {
  const { customer, type } = route.params;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const addTransaction = useStore(state => state.addTransaction);

  const isOverLimit = type === 'GAVE' && 
                      customer.Credit_Limit > 0 && 
                      (customer.Current_Balance + Number(amount)) > customer.Credit_Limit;

  const handleSubmit = async () => {
    if (!amount) return;
    await addTransaction({
      customerId: customer._id,
      type,
      amount: Number(amount),
      description
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type === 'GAVE' ? 'Give Credit' : 'Receive Payment'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.form}>
        {type === 'GAVE' && customer.Credit_Limit > 0 && (
          <Text style={styles.limitInfo}>
            Credit Limit: {customer.Credit_Limit} ETB | Available: {customer.Credit_Limit - customer.Current_Balance} ETB
          </Text>
        )}
        
        <Text style={styles.label}>Amount (ETB)</Text>
        <TextInput
          style={[styles.inputAmount, isOverLimit && styles.inputError]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          autoFocus
        />
        
        {isOverLimit && (
          <Text style={styles.errorText}>This amount exceeds the credit limit.</Text>
        )}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.inputDesc}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter details..."
        />

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: type === 'GAVE' ? theme.colors.gave : theme.colors.got }]}
          onPress={handleSubmit}
        >
          <Text style={styles.saveText}>Save Transaction</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  form: {
    padding: theme.spacing.l,
  },
  limitInfo: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
  },
  inputAmount: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: theme.spacing.l,
    textAlign: 'center',
  },
  inputError: {
    borderColor: theme.colors.gave,
    color: theme.colors.gave,
  },
  errorText: {
    color: theme.colors.gave,
    marginTop: -theme.spacing.m,
    marginBottom: theme.spacing.l,
    textAlign: 'center',
  },
  inputDesc: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
    fontSize: 16,
    marginBottom: theme.spacing.xl,
  },
  saveButton: {
    padding: theme.spacing.l,
    borderRadius: theme.radius.l,
    alignItems: 'center',
  },
  saveText: {
    color: theme.colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
  }
});
