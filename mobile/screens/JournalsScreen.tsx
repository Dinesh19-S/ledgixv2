import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export default function JournalsScreen({ navigation }: any) {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const response = await api.get('/journals');
      setJournals(response.data);
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
        <Text style={styles.headerTitle}>Journals</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <FlatList
            data={journals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.title}>Voucher: {item.voucherNo}</Text>
                <View style={styles.row}>
                  <Text style={styles.debit}>Dr: {item.debitParty}</Text>
                  <Text style={styles.credit}>Cr: {item.creditParty}</Text>
                </View>
                <Text style={styles.amount}>₹{item.amount}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No journals found.</Text>}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  title: { fontSize: 14, color: '#64748b' },
  debit: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  credit: { fontSize: 15, fontWeight: '600', color: '#16a34a' },
  amount: { fontSize: 18, fontWeight: 'bold', marginTop: 8, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});
