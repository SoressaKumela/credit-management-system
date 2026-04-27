import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

export default function Dashboard({ navigation, onOpenDrawer }) {
  const { customers, fetchCustomers, collections, fetchDailyCollection } = useStore();

  useEffect(() => {
    fetchCustomers();
    fetchDailyCollection();
  }, []);

  const totalDebt = customers.reduce((sum, c) => sum + c.Current_Balance, 0);

  const registered = customers.filter(c => c.Is_Registered);
  const manual = customers.filter(c => !c.Is_Registered);

  const renderCustomer = ({ item }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => navigation.navigate('Ledger', { customer: item })}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.customerName}>{item.Name}</Text>
          {item.Is_Registered && <Text style={styles.regBadge}>✓</Text>}
        </View>
        {item.agingDays > 0 && <Text style={styles.agingText}>{item.agingDays} days aging</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.balance, { color: item.agingDays >= 30 ? theme.colors.gave : theme.colors.text }]}>
          {item.Current_Balance} ETB
        </Text>
      </View>
    </TouchableOpacity>
  );

  const sections = [];
  if (registered.length > 0) {
    sections.push({ title: 'Registered Customers', data: registered });
  }
  if (manual.length > 0) {
    sections.push({ title: 'Manual Reminders', data: manual });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenDrawer} style={styles.burgerButton}>
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>dubePlus</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total You Will Get</Text>
          <Text style={styles.summaryValue}>{totalDebt} ETB</Text>
        </View>
        <View style={[styles.summaryCard, { marginLeft: theme.spacing.s }]}>
          <Text style={styles.summaryLabel}>Today's Collection</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.got }]}>{collections} ETB</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Customers ({customers.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewCustomer')}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No customers yet. Tap "+ Add" to get started.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={c => c._id}
          renderItem={renderCustomer}
          renderSectionHeader={({ section: { title, data } }) => (
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>{title}</Text>
              <Text style={styles.sectionCount}>{data.length}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  burgerButton: {
    width: 28,
    height: 22,
    justifyContent: 'space-between',
  },
  burgerLine: {
    width: 28,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.s,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gave,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  customerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  regBadge: {
    fontSize: 14,
    color: theme.colors.got,
    fontWeight: 'bold',
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
  },
  agingText: {
    fontSize: 12,
    color: theme.colors.gave,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
  }
});
