import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export default function RoleSelection({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to dubePlus</Text>
      <Text style={styles.subtitle}>Please select your role to continue</Text>

      <View style={styles.cardsContainer}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Auth', { role: 'Shop_Owner' })}
        >
          <Text style={styles.cardIcon}>🏪</Text>
          <Text style={styles.cardTitle}>I am a Shop Owner</Text>
          <Text style={styles.cardDesc}>Manage your ledger, add customers, and track debts.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Auth', { role: 'Customer' })}
        >
          <Text style={styles.cardIcon}>👤</Text>
          <Text style={styles.cardTitle}>I am a Customer</Text>
          <Text style={styles.cardDesc}>View your balances, payment dates, and manage disputes.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 40,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.l,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  }
});
