import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

function validatePhone(phone) {
  const cleaned = phone.replace(/\s+/g, '');
  return /^(09\d{8}|\+2519\d{8})$/.test(cleaned);
}

export default function Login({ route, navigation }) {
  const role = route?.params?.role || 'Shop_Owner';
  const isShopOwner = role === 'Shop_Owner';

  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const login = useStore((state) => state.login);
  const register = useStore((state) => state.register);
  const loading = useStore((state) => state.loading);

  const handlePhoneChange = (text) => {
    setPhone(text);
    if (text.trim().length > 0 && !validatePhone(text.trim())) {
      setPhoneError('Use format: 09XXXXXXXX');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!validatePhone(trimmedPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Ethiopian phone number.\nFormat: 09XXXXXXXX');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (isLogin) {
      login(trimmedPhone, password, role);
    } else {
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }
      if (isShopOwner && !shopName.trim()) {
        Alert.alert('Error', 'Please enter your shop name');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      register({ 
        Phone: trimmedPhone, 
        Name: name.trim(), 
        Shop_Name: isShopOwner ? shopName.trim() : undefined,
        Password: password,
        Role: role
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {isShopOwner ? '🏪 Shop Owner' : '👤 Customer'}
        </Text>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => setIsLogin(true)} style={[styles.toggleBtn, isLogin && styles.activeToggle]}>
            <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(false)} style={[styles.toggleBtn, !isLogin && styles.activeToggle]}>
            <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {!isLogin && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Your Name"
                autoCapitalize="words"
              />
              
              {isShopOwner && (
                <>
                  <Text style={styles.label}>Shop Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={shopName} 
                    onChangeText={setShopName} 
                    placeholder="Your Shop"
                  />
                </>
              )}
            </>
          )}

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, phoneError ? styles.inputError : null]}
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            placeholder="09XXXXXXXX"
            maxLength={13}
          />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
          
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={isLogin ? 'Enter password' : 'Min 6 characters'}
          />

          {!isLogin && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter password"
              />
            </>
          )}
          
          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  backBtn: {
    marginBottom: theme.spacing.m,
  },
  backText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.l,
    borderRadius: theme.radius.m,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textLight,
  },
  activeToggleText: {
    color: theme.colors.primaryText,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.radius.m,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
    fontSize: 18,
    marginBottom: theme.spacing.m,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#D32F2F',
    marginBottom: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    marginBottom: theme.spacing.m,
    marginLeft: 4,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radius.l,
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  buttonText: {
    color: theme.colors.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
});
