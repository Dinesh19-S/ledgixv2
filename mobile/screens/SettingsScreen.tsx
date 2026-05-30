import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export default function SettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState<any>({ businessName: '', address: '', gstin: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings', settings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput style={styles.input} value={settings.businessName} onChangeText={t => setSettings({...settings, businessName: t})} />
            
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={settings.address} onChangeText={t => setSettings({...settings, address: t})} />
            
            <Text style={styles.label}>GSTIN</Text>
            <TextInput style={styles.input} value={settings.gstin} onChangeText={t => setSettings({...settings, gstin: t})} />
            
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={settings.phone} onChangeText={t => setSettings({...settings, phone: t})} keyboardType="phone-pad" />
            
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={settings.email} onChangeText={t => setSettings({...settings, email: t})} keyboardType="email-address" autoCapitalize="none" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
            </TouchableOpacity>
          </View>
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
  form: { backgroundColor: '#ffffff', padding: 16, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 16 },
  saveBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
