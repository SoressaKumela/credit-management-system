import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../theme';

export default function Disputes({ navigation }) {
  const { disputes, fetchDisputes, resolveDispute } = useStore();
  
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState('RESOLVED');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleAction = (dispute, type) => {
    setSelectedDispute(dispute);
    setActionType(type);
    setResolutionText('');
    setModalVisible(true);
  };

  const confirmAction = async () => {
    if (!selectedDispute) return;
    await resolveDispute(selectedDispute._id, actionType, resolutionText);
    setModalVisible(false);
  };

  const renderDispute = ({ item }) => {
    const isOpen = item.status === 'OPEN';
    
    return (
      <View style={styles.disputeCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
            {item.status}
          </Text>
        </View>
        
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
        
        {item.resolution ? (
          <Text style={styles.resolutionText}>Note: {item.resolution}</Text>
        ) : null}

        {isOpen && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.resolveBtn]}
              onPress={() => handleAction(item, 'RESOLVED')}
            >
              <Text style={styles.resolveBtnText}>Resolve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleAction(item, 'REJECTED')}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disputes</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={disputes}
        keyExtractor={d => d._id}
        renderItem={renderDispute}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No disputes found.</Text>}
      />


      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'RESOLVED' ? 'Resolve Dispute' : 'Reject Dispute'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Add a note explaining the resolution (optional).
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Resolution details..."
              multiline
              numberOfLines={3}
              value={resolutionText}
              onChangeText={setResolutionText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmAction} 
                style={[styles.modalSubmitBtn, actionType === 'REJECTED' && { backgroundColor: theme.colors.gave }]}
              >
                <Text style={styles.modalSubmitText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.m, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backText: { fontSize: 16, color: theme.colors.primary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  list: { padding: theme.spacing.l },
  emptyText: { textAlign: 'center', marginTop: 50, color: theme.colors.textLight, fontSize: 16 },
  
  disputeCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  resolutionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden'
  },
  statusOpen: { backgroundColor: '#ffe4b5', color: '#d2691e' },
  statusClosed: { backgroundColor: '#e0ffe0', color: '#008000' },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  resolveBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  resolveBtnText: { color: '#fff', fontWeight: 'bold' },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.gave,
  },
  rejectBtnText: { color: theme.colors.gave, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: theme.spacing.xl },
  modalContent: { backgroundColor: theme.colors.surface, padding: theme.spacing.l, borderRadius: theme.radius.m },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: theme.spacing.s },
  modalSubtitle: { fontSize: 14, color: theme.colors.textLight, marginBottom: theme.spacing.m },
  modalInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.s, padding: theme.spacing.m, fontSize: 16, minHeight: 80, textAlignVertical: 'top', marginBottom: theme.spacing.l },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing.m },
  modalCancelBtn: { padding: theme.spacing.m },
  modalCancelText: { fontSize: 16, color: theme.colors.textLight },
  modalSubmitBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.m, borderRadius: theme.radius.s },
  modalSubmitText: { fontSize: 16, color: '#fff', fontWeight: '700' }
});
