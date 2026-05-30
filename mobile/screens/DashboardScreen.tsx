import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, auth } from '../services/api';

export default function DashboardScreen({ route, navigation }: any) {
  const { setUserToken } = route.params;
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/parties');
      setParties(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.removeToken();
    setUserToken(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ledgix Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.navGrid}>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Parties')}>
            <Text style={styles.navText}>Parties</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Payments')}>
            <Text style={styles.navText}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Journals')}>
            <Text style={styles.navText}>Journals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Parties ({parties.length})</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={parties}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.partyName}>{item.name}</Text>
                <Text style={styles.partyBalance}>
                  Balance: ₹{item.openingBalance} ({item.balanceType})
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No parties found. (CRUD forms coming soon)</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navCard: {
    width: '48%',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  navText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  partyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  partyBalance: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
  }
});
