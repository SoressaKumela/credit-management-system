import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useStore, API_URL } from '../store/useStore';
import { theme } from '../theme';

export default function Reminders({ navigation }) {
  const [report, setReport] = useState(null);
  const user = useStore((state) => state.user);

  useEffect(() => {
    if (user) {
      fetchReport();
    }
  }, [user]);

  const fetchReport = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/reports/aging?ownerId=${user._id}`);
      setReport(res.data);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch reminders: ' + e.message);
    }
  };

  const handleSMS = (customer, shopName = user?.Shop_Name || "My Shop") => {
    const text = customer.Current_Balance > 0 
      ? `Dear ${customer.Name}, your balance at ${shopName} is ${customer.Current_Balance} ETB. Please settle.`
      : `Dear ${customer.Name}, thank you for your business at ${shopName}! We look forward to seeing you again.`;
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${customer.Phone}${separator}body=${text}`);
  };

  const renderSection = (title, data) => {
    if (!data || data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map(({ customer, days }) => (
          <View key={customer._id} style={styles.card}>
            <View>
              <Text style={styles.name}>{customer.Name}</Text>
              <Text style={styles.aging}>{days} days overdue</Text>
            </View>
            <TouchableOpacity 
              style={styles.smsButton}
              onPress={() => handleSMS(customer)}
            >
              <Text style={styles.smsText}>Send SMS</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={{ width: 50 }} />
      </View>
      
      {report ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderSection('45+ Days Overdue', report['45_plus_days'])}
          {renderSection('30-44 Days Overdue', report['30_days'])}
          {renderSection('15-29 Days Overdue', report['15_days'])}
          {renderSection('Other Customers', report['others'])}
          
          {Object.values(report).every(arr => arr.length === 0) && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found for your shop.</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading report...</Text>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  backText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  section: {
    marginBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gave,
    marginBottom: theme.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  aging: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  smsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radius.s,
  },
  smsText: {
    color: theme.colors.primaryText,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
  }
});
