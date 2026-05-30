import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export default function PaymentsScreen({ navigation }: any) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.title}>{item.partyName}</Text>
                  <Text style={[styles.amount, { color: item.transactionType === 'Receive' ? '#16a34a' : '#dc2626' }]}>
                    {item.transactionType === 'Receive' ? '+' : '-'}₹{item.amount}
                  </Text>
                </View>
                <Text style={styles.details}>Voucher: {item.voucherNo} | Type: {item.paymentType}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No payments found.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backBtn: { color: '#2563eb', fontSize: 16 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 8, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold' },
  amount: { fontSize: 16, fontWeight: 'bold' },
  details: { fontSize: 14, color: '#64748b', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});
