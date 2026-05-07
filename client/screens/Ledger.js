import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

export default function Ledger({ route, navigation }) {
  const { customer: routeCustomer } = route.params;
  const { transactions, fetchTransactions, customers, settleAll } = useStore();
  
  const customer = customers.find(c => c._id === routeCustomer._id) || routeCustomer;

  useEffect(() => {
    fetchTransactions(customer._id);
  }, [customer._id]);

  const handleSettleAll = () => {
    if (customer.Current_Balance <= 0) return;
    Alert.alert(
      "Settle All",
      `Are you sure you want to settle the full balance of ${customer.Current_Balance} ETB?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Settle", onPress: () => settleAll(customer._id) }
      ]
    );
  };

  const renderTransaction = ({ item }) => {
    const isGave = item.type === 'GAVE';
    return (
      <View style={styles.transactionRow}>
        <View style={styles.transLeft}>
          <Text style={styles.transDate}>{new Date(item.date).toLocaleDateString()}</Text>
          <Text style={styles.transDesc}>{item.description || item.type}</Text>
          {isGave && item.dueDate && (
            <Text style={styles.transMeta}>Due: {new Date(item.dueDate).toLocaleDateString()} • {item.status}</Text>
          )}
          {!isGave && item.paymentClassification && (
            <Text style={styles.transMeta}>Timing: {item.paymentClassification}</Text>
          )}
        </View>
        <Text style={[styles.transAmount, { color: isGave ? theme.colors.gave : theme.colors.got }]}>
          {isGave ? '+' : '-'}{item.amount} ETB
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{customer.Name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditCustomer', { customer })}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>{customer.Current_Balance} ETB</Text>
        {customer.Credit_Limit > 0 && (
          <Text style={styles.limitValue}>Credit Limit: {customer.Credit_Limit} ETB</Text>
        )}
        {customer.Next_Due_Date && customer.Current_Balance > 0 && (
           <Text style={styles.dueValue}>Next Due: {new Date(customer.Next_Due_Date).toLocaleDateString()} ({customer.Repayment_Cycle})</Text>
        )}
        {customer.Current_Balance > 0 && (
          <TouchableOpacity style={styles.settleButton} onPress={handleSettleAll}>
            <Text style={styles.settleText}>Settle All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={t => t._id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.list}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.gave }]}
          onPress={() => navigation.navigate('TransactionForm', { customer, type: 'GAVE' })}
        >
          <Text style={styles.actionText}>Gave ETB</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.got }]}
          onPress={() => navigation.navigate('TransactionForm', { customer, type: 'GOT' })}
        >
          <Text style={styles.actionText}>Got ETB</Text>
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
    color: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  editText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.l,
    padding: theme.spacing.l,
    borderRadius: theme.radius.m,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.s,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  limitValue: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: theme.spacing.s,
    fontWeight: '600',
  },
  dueValue: {
     fontSize: 14,
     color: theme.colors.gave,
     marginTop: 4,
     fontWeight: '600',
  },
  settleButton: {
    marginTop: theme.spacing.m,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.s,
    backgroundColor: theme.colors.primary,
  },
  settleText: {
    color: theme.colors.primaryText,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: theme.spacing.l,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transLeft: {
    flex: 1,
  },
  transDate: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  transDesc: {
    fontSize: 16,
    color: theme.colors.text,
  },
  transMeta: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  transAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: theme.spacing.l,
    gap: theme.spacing.m,
  },
  actionButton: {
    flex: 1,
    padding: theme.spacing.l,
    borderRadius: theme.radius.l,
    alignItems: 'center',
  },
  actionText: {
    color: theme.colors.primaryText,
    fontSize: 20,
    fontWeight: '700',
  }
});
