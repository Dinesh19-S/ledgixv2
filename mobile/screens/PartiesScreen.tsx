import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export default function PartiesScreen({ navigation }: any) {
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await api.get('/parties');
      setParties(response.data);
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
        <Text style={styles.headerTitle}>Parties</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <FlatList
            data={parties}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.partyName}>{item.name}</Text>
                <Text style={styles.partyDetails}>{item.mobile} | GST: {item.gst}</Text>
                <Text style={styles.partyBalance}>Balance: ₹{item.openingBalance} ({item.balanceType})</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No parties found.</Text>}
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
  partyName: { fontSize: 16, fontWeight: 'bold' },
  partyDetails: { fontSize: 14, color: '#64748b', marginTop: 4 },
  partyBalance: { fontSize: 14, color: '#0f172a', marginTop: 4, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});
