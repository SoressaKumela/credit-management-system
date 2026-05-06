import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

const CYCLES = ['FLEXIBLE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];

export default function NewCustomer({ navigation }) {
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialDebt, setInitialDebt] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [cycle, setCycle] = useState('FLEXIBLE');
  const [showManualForm, setShowManualForm] = useState(false);

  const addCustomer = useStore(state => state.addCustomer);
  const searchCustomer = useStore(state => state.searchCustomer);
  const user = useStore(state => state.user);

  const handleSearch = async () => {
    const trimmed = searchPhone.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a phone number to search');
      return;
    }

    if (trimmed === user.Phone || trimmed.replace(/^0/, '+251') === user.Phone || trimmed.replace(/^\+251/, '0') === user.Phone) {
      Alert.alert("⚠️ Not Allowed", "This is yourself, you can't do this.");
      return;
    }

    setSearching(true);
    setSearchResult(null);
    setShowManualForm(false);

    const result = await searchCustomer(trimmed);
    setSearching(false);

    if (result.found) {
      setSearchResult(result.customer);
    } else {
      setSearchResult(false);
    }
  };

  const handleAddRegistered = async () => {
    if (!searchResult) return;
    const result = await addCustomer({
      Name: searchResult.Name,
      Phone: searchResult.Phone,
      Current_Balance: Number(initialDebt) || 0,
      Credit_Limit: Number(creditLimit) || 0,
      Repayment_Cycle: cycle
    });
    if (result.success) {
      navigation.goBack();
    }
  };

  const handleAddManual = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Name and Phone are required');
      return;
    }
    const result = await addCustomer({
      Name: name.trim(),
      Phone: phone.trim(),
      Current_Balance: Number(initialDebt) || 0,
      Credit_Limit: Number(creditLimit) || 0,
      Repayment_Cycle: cycle
    });
    if (result.success) {
      navigation.goBack();
    }
  };

  const handleShowManual = () => {
    setShowManualForm(true);
    setPhone(searchPhone.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Customer</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionTitle}>🔍 Search Customer by Phone</Text>
        <Text style={styles.hint}>Enter the customer's phone number to check if they're registered on the app.</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchPhone}
            onChangeText={setSearchPhone}
            keyboardType="phone-pad"
            placeholder="09XXXXXXXX"
            maxLength={13}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
            <Text style={styles.searchBtnText}>{searching ? '...' : 'Search'}</Text>
          </TouchableOpacity>
        </View>

        {searching && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />}


        {searchResult && !searching && (
          <View style={styles.resultCard}>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>✅ Registered Customer</Text>
            </View>
            <Text style={styles.resultName}>{searchResult.Name}</Text>
            <Text style={styles.resultPhone}>{searchResult.Phone}</Text>


            <View style={styles.divider} />
            <Text style={styles.label}>Credit Limit (ETB) — 0 = no limit</Text>
            <TextInput style={styles.input} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" placeholder="0" />

            <Text style={styles.label}>Initial Debt (ETB)</Text>
            <TextInput style={styles.input} value={initialDebt} onChangeText={setInitialDebt} keyboardType="numeric" placeholder="0" />

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

            <TouchableOpacity style={styles.saveButton} onPress={handleAddRegistered}>
              <Text style={styles.saveText}>Add to My Ledger</Text>
            </TouchableOpacity>
          </View>
        )}


        {searchResult === false && !searching && (
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundText}>No registered customer found with this phone number.</Text>
            {!showManualForm && (
              <TouchableOpacity style={styles.manualBtn} onPress={handleShowManual}>
                <Text style={styles.manualBtnText}>+ Add Reminder Manually</Text>
              </TouchableOpacity>
            )}
          </View>
        )}


        {showManualForm && (
          <View style={styles.manualCard}>
            <View style={styles.manualBadge}>
              <Text style={styles.manualBadgeText}>📝 Manual Entry</Text>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Abebe Kebede" />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09..." />

            <Text style={styles.label}>Credit Limit (ETB) — 0 = no limit</Text>
            <TextInput style={styles.input} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" placeholder="0" />

            <Text style={styles.label}>Initial Debt (ETB)</Text>
            <TextInput style={styles.input} value={initialDebt} onChangeText={setInitialDebt} keyboardType="numeric" placeholder="0" />

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

            <TouchableOpacity style={styles.saveButton} onPress={handleAddManual}>
              <Text style={styles.saveText}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        )}
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

  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  hint: { fontSize: 13, color: theme.colors.textLight, marginBottom: theme.spacing.m, lineHeight: 18 },

  searchRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.l },
  searchInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.s, padding: theme.spacing.m, fontSize: 18, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, justifyContent: 'center', borderRadius: theme.radius.s },
  searchBtnText: { color: theme.colors.primaryText, fontWeight: '700', fontSize: 16 },

  resultCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.m, padding: theme.spacing.l, borderWidth: 2, borderColor: theme.colors.got, marginBottom: theme.spacing.l },
  resultBadge: { backgroundColor: '#E8F5E9', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 10 },
  resultBadgeText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  resultName: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  resultPhone: { fontSize: 16, color: theme.colors.textLight, marginBottom: 4 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.m },

  notFoundCard: { backgroundColor: '#FFF8E1', borderRadius: theme.radius.m, padding: theme.spacing.l, borderWidth: 1, borderColor: '#FFD54F', marginBottom: theme.spacing.l, alignItems: 'center' },
  notFoundText: { fontSize: 15, color: '#F57F17', textAlign: 'center', marginBottom: theme.spacing.m, fontWeight: '600' },
  manualBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: theme.radius.s },
  manualBtnText: { color: theme.colors.primaryText, fontWeight: '700', fontSize: 15 },

  manualCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.m, padding: theme.spacing.l, borderWidth: 2, borderColor: '#FFB74D', marginBottom: theme.spacing.l },
  manualBadge: { backgroundColor: '#FFF3E0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 10 },
  manualBadgeText: { fontSize: 13, fontWeight: '700', color: '#E65100' },

  label: { fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.s, padding: theme.spacing.m, fontSize: 18, marginBottom: theme.spacing.l, backgroundColor: '#fff' },
  cycleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.l },
  cycleBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.s, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  cycleBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  cycleBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  cycleBtnTextActive: { color: theme.colors.primaryText },
  saveButton: { backgroundColor: theme.colors.primary, padding: theme.spacing.l, borderRadius: theme.radius.l, alignItems: 'center', marginTop: theme.spacing.m },
  saveText: { color: theme.colors.primaryText, fontSize: 18, fontWeight: '700' }
});
