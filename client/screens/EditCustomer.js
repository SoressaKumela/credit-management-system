import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

const CYCLES = ['FLEXIBLE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];

export default function EditCustomer({ route, navigation }) {
  const { customer } = route.params;
  const [name, setName] = useState(customer.Name);
  const [phone, setPhone] = useState(customer.Phone);
  const [creditLimit, setCreditLimit] = useState(String(customer.Credit_Limit || 0));
  const [cycle, setCycle] = useState(customer.Repayment_Cycle || 'FLEXIBLE');

  const updateCustomer = useStore(state => state.updateCustomer);
  const deleteCustomer = useStore(state => state.deleteCustomer);

  const handleUpdate = async () => {
    if (!name || !phone) return;
    await updateCustomer(customer._id, {
      Name: name, Phone: phone,
      Credit_Limit: Number(creditLimit) || 0,
      Repayment_Cycle: cycle
    });
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      "Are you sure? This deletes all transactions and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          await deleteCustomer(customer._id);
          navigation.navigate('Dashboard');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Customer</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Credit Limit (ETB) — 0 = no limit</Text>
        <TextInput style={styles.input} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" />

        <Text style={styles.label}>Repayment Cycle</Text>
        <View style={styles.cycleRow}>
          {CYCLES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.cycleBtn, cycle === c && styles.cycleBtnActive]}
              onPress={() => setCycle(c)}
            >
              <Text style={[styles.cycleBtnText, cycle === c && styles.cycleBtnTextActive]}>
                {c === 'BIWEEKLY' ? 'Bi-Weekly' : c.charAt(0) + c.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Customer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.m, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backText: { fontSize: 16, color: theme.colors.textLight },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  form: { padding: theme.spacing.l },
  label: { fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.s, padding: theme.spacing.m, fontSize: 18, marginBottom: theme.spacing.l },
  cycleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.l },
  cycleBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.s, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  cycleBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  cycleBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  cycleBtnTextActive: { color: theme.colors.primaryText },
  saveButton: { backgroundColor: theme.colors.primary, padding: theme.spacing.l, borderRadius: theme.radius.l, alignItems: 'center', marginTop: theme.spacing.m },
  saveText: { color: theme.colors.primaryText, fontSize: 18, fontWeight: '700' },
  deleteButton: { padding: theme.spacing.l, borderRadius: theme.radius.l, alignItems: 'center', marginTop: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.gave },
  deleteText: { color: theme.colors.gave, fontSize: 18, fontWeight: '700' }
});
