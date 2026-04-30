import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useStore, API_URL } from '../store/useStore';
import { theme } from '../theme';

export default function CustomerInterface({ navigation }) {
  const user = useStore(state => state.user);
  const { createDispute, fetchMyDebts, myDebts } = useStore();
  
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [disputes, setDisputes] = useState([]);

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [selectedTxId, setSelectedTxId] = useState(null);

  useEffect(() => {
    fetchMyDebts();
  }, []);

  const selectShop = async (debt) => {
    setSelectedDebt(debt);
    try {
      const transRes = await axios.get(`${API_URL}/transactions/${debt._id}`);
      setTransactions(transRes.data);
      const disputeRes = await axios.get(`${API_URL}/disputes/customer/${debt._id}`);
      setDisputes(disputeRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    useStore.setState({ user: null, myDebts: [] });
  };

  const goBackToList = () => {
    setSelectedDebt(null);
    setTransactions([]);
    setDisputes([]);
  };

  const submitDispute = async () => {
    if (!disputeReason.trim() || !selectedDebt) return;
    await createDispute({
      customerId: selectedDebt._id,
      transactionId: selectedTxId,
      reason: disputeReason,
      ownerId: selectedDebt.OwnerId._id
    });
    setIsDisputeModalOpen(false);
    setDisputeReason('');
    setSelectedTxId(null);
    selectShop(selectedDebt);
  };

  const openDisputeModal = (txId = null) => {
    setSelectedTxId(txId);
    setIsDisputeModalOpen(true);
  };

  const totalDebt = myDebts.reduce((sum, d) => sum + d.Current_Balance, 0);

  if (!selectedDebt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Owed Across All Shops</Text>
          <Text style={styles.balanceValue}>{totalDebt} ETB</Text>
        </View>

        {myDebts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>You're All Clear!</Text>
            <Text style={styles.emptyText}>No outstanding debts from any shop.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.shopsTitle}>Shops You Owe ({myDebts.length})</Text>
            <FlatList
              data={myDebts}
              keyExtractor={d => d._id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.shopCard} onPress={() => selectShop(item)}>
                  <View>
                    <Text style={styles.shopName}>{item.OwnerId?.Shop_Name || 'Shop'}</Text>
                    <Text style={styles.shopOwner}>Owner: {item.OwnerId?.Name || 'Unknown'}</Text>
                    {item.Next_Due_Date && item.Current_Balance > 0 && (
                      <Text style={styles.shopDue}>Due: {new Date(item.Next_Due_Date).toLocaleDateString()}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.shopBalance}>{item.Current_Balance} ETB</Text>
                    {item.Credit_Limit > 0 && (
                      <Text style={styles.shopLimit}>Limit: {item.Credit_Limit} ETB</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </SafeAreaView>
    );
  }

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
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.transAmount, { color: isGave ? theme.colors.gave : theme.colors.got }]}>
            {isGave ? '+' : '-'}{item.amount} ETB
          </Text>
          <TouchableOpacity onPress={() => openDisputeModal(item._id)}>
            <Text style={styles.disputeLink}>Dispute</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDispute = ({ item }) => (
    <View style={styles.disputeRow}>
      <View style={styles.transLeft}>
        <Text style={styles.transDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.transDesc}>{item.reason}</Text>
        {item.resolution ? <Text style={styles.resolutionText}>Resolution: {item.resolution}</Text> : null}
      </View>
      <Text style={[styles.statusBadge, item.status === 'OPEN' ? styles.statusOpen : styles.statusClosed]}>
        {item.status}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBackToList}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedDebt.OwnerId?.Shop_Name || 'Shop'}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Debt to This Shop</Text>
        <Text style={styles.balanceValue}>{selectedDebt.Current_Balance} ETB</Text>
        {selectedDebt.Credit_Limit > 0 && (
          <Text style={styles.limitValue}>Credit Limit: {selectedDebt.Credit_Limit} ETB</Text>
        )}
        {selectedDebt.Next_Due_Date && selectedDebt.Current_Balance > 0 && (
           <Text style={styles.dueValue}>Next Due: {new Date(selectedDebt.Next_Due_Date).toLocaleDateString()} ({selectedDebt.Repayment_Cycle})</Text>
        )}
      </View>
      
      <View style={styles.tabsContainer}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        <TouchableOpacity onPress={() => openDisputeModal(null)}>
          <Text style={styles.disputeButtonText}>+ New Dispute</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={t => t._id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyListText}>No transactions yet.</Text>}
      />

      {disputes.length > 0 && (
        <>
          <View style={[styles.tabsContainer, { marginTop: 20 }]}>
             <Text style={styles.sectionTitle}>My Disputes</Text>
          </View>
          <FlatList
            data={disputes}
            keyExtractor={d => d._id}
            renderItem={renderDispute}
            contentContainerStyle={styles.list}
          />
        </>
      )}


      <Modal visible={isDisputeModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Raise a Dispute</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTxId ? "Disputing a specific transaction." : "General account dispute."}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Explain the issue..."
              multiline
              numberOfLines={4}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsDisputeModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitDispute} style={styles.modalSubmitBtn}>
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  backText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  logoutText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.l,
    padding: theme.spacing.xl,
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
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.gave,
  },
  limitValue: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: theme.spacing.s,
    fontWeight: '600',
  },
  dueValue: {
     fontSize: 14,
     color: theme.colors.text,
     marginTop: 4,
     fontWeight: '600',
  },

  shopsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  shopCard: {
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
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  shopOwner: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  shopDue: {
    fontSize: 12,
    color: theme.colors.gave,
    marginTop: 4,
  },
  shopBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.gave,
  },
  shopLimit: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  emptyListText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    padding: 20,
  },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  disputeButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
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
  disputeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: '#fffaf0',
    paddingHorizontal: 8,
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
    marginBottom: 4,
  },
  disputeLink: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  resolutionText: {
    fontSize: 13,
    color: theme.colors.got,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    overflow: 'hidden'
  },
  statusOpen: {
    backgroundColor: '#ffe4b5',
    color: '#d2691e',
  },
  statusClosed: {
    backgroundColor: '#e0ffe0',
    color: '#008000',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.radius.m,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.s,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.m,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.l,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.m,
  },
  modalCancelBtn: {
    padding: theme.spacing.m,
  },
  modalCancelText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
  },
  modalSubmitText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  }
});
