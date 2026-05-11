import { create } from 'zustand';
import axios from 'axios';
import { Alert } from 'react-native';

export const API_URL = 'https://credit-system-backend-qw3g.onrender.com/api';

export const useStore = create((set, get) => ({
  user: null,
  customers: [],
  transactions: [],
  collections: 0,
  disputes: [],
  myDebts: [],
  loading: false,

  login: async (phone, password, role) => {
    set({ loading: true });
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { Phone: phone, Password: password, Role: role });
      set({ user: res.data.user, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
      Alert.alert('Login Error', e.response?.data?.error || 'Login failed. Please check your connection.');
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await axios.post(`${API_URL}/auth/register`, data);
      set({ user: res.data.user, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
      Alert.alert('Registration Error', e.response?.data?.error || 'Registration failed');
    }
  },

  fetchCustomers: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/customers?ownerId=${user._id}`);
      set({ customers: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  addCustomer: async (customerData) => {
    const { user } = get();
    try {
      await axios.post(`${API_URL}/customers`, { ...customerData, OwnerId: user._id });
      await get().fetchCustomers();
      return { success: true };
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.error || 'Error adding customer');
      return { success: false };
    }
  },

  searchCustomer: async (phone) => {
    try {
      const res = await axios.get(`${API_URL}/customers/search/${phone}`);
      return { found: true, customer: res.data };
    } catch (e) {
      return { found: false, message: e.response?.data?.message || 'Not found' };
    }
  },

  fetchMyDebts: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/customers/my-debts/${user.Phone}`);
      set({ myDebts: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      await axios.put(`${API_URL}/customers/${id}`, customerData);
      await get().fetchCustomers();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Error updating customer');
    }
  },

  deleteCustomer: async (id) => {
    try {
      await axios.delete(`${API_URL}/customers/${id}`);
      await get().fetchCustomers();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Error deleting customer');
    }
  },

  fetchTransactions: async (customerId) => {
    try {
      const res = await axios.get(`${API_URL}/transactions/${customerId}`);
      set({ transactions: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  addTransaction: async (data) => {
    try {
      await axios.post(`${API_URL}/transactions`, data);
      await get().fetchCustomers();
      if (data.customerId) {
        await get().fetchTransactions(data.customerId);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.error || 'Error adding transaction');
    }
  },

  settleAll: async (customerId) => {
    try {
      const res = await axios.post(`${API_URL}/transactions/settle-all`, { customerId });
      await get().fetchCustomers();
      await get().fetchTransactions(customerId);
      Alert.alert('Success', `Settled ${res.data.settledAmount} ETB`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.error || 'Error settling balance');
    }
  },

  fetchDailyCollection: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/reports/daily-collection?ownerId=${user._id}`);
      set({ collections: res.data.total });
    } catch (e) {
      console.error(e);
    }
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return;
    set({ loading: true });
    try {
      const res = await axios.put(`${API_URL}/auth/profile/${user._id}`, data);
      set({ user: res.data.user, loading: false });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e) {
      console.error(e);
      set({ loading: false });
      Alert.alert('Error', e.response?.data?.error || 'Failed to update profile');
    }
  },

  fetchDisputes: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/disputes?ownerId=${user._id}`);
      set({ disputes: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchCustomerDisputes: async (customerId) => {
    try {
      const res = await axios.get(`${API_URL}/disputes/customer/${customerId}`);
      set({ disputes: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  createDispute: async (data) => {
    try {
      await axios.post(`${API_URL}/disputes`, data);
      Alert.alert('Submitted', 'Your dispute has been submitted to the shop owner.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.error || 'Error submitting dispute');
    }
  },

  resolveDispute: async (id, status, resolution) => {
    try {
      await axios.put(`${API_URL}/disputes/${id}`, { status, resolution });
      await get().fetchDisputes();
      Alert.alert('Done', `Dispute ${status.toLowerCase()}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Error resolving dispute');
    }
  }
}));
