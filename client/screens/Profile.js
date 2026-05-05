import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

export default function Profile() {
  const { user, updateProfile, loading } = useStore();
  const [name, setName] = useState(user?.Name || '');
  const [shopName, setShopName] = useState(user?.Shop_Name || '');

  const handleUpdate = () => {
    if (!name.trim() || !shopName.trim()) {
      alert('Please fill in all fields');
      return;
    }
    updateProfile({ Name: name, Shop_Name: shopName });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account Settings</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Enter your name" 
        />
        
        <Text style={styles.label}>Shop Name</Text>
        <TextInput 
          style={styles.input} 
          value={shopName} 
          onChangeText={setShopName} 
          placeholder="Enter shop name" 
        />

        <Text style={styles.infoLabel}>Phone Number (Cannot be changed)</Text>
        <TextInput 
          style={[styles.input, styles.disabledInput]} 
          value={user?.Phone} 
          editable={false} 
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Update Profile'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.l,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.l,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.radius.m,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
    fontSize: 16,
    marginBottom: theme.spacing.m,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    alignItems: 'center',
    marginTop: theme.spacing.l,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
});
