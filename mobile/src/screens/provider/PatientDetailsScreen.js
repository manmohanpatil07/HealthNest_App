// PatientDetailsScreen.js – Provider module (HealthNest)
// Implements the read‑only view of a patient after a QR scan.
// Uses data passed from ScanQRScreen or fetches by token if needed.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Linking } from 'react-native';
import { providerService } from '../../services/providerService';
import { formatDate } from '../../utils';

export default function PatientDetailsScreen({ route, navigation }) {
  const { patient, healthRecords, documents, vaccinations, accessInfo, token } = route.params || {};

  const [loading, setLoading] = useState(!patient && !!token);
  const [data, setData] = useState({ patient, healthRecords, documents, vaccinations, accessInfo });

  // Fetch on‑demand when only a token was supplied (deep‑link scenarios)
  useEffect(() => {
    if (!patient && token) {
      (async () => {
        try {
          const res = await providerService.getPatientByToken(token);
          setData(res);
        } catch (e) {
          console.warn('Failed to fetch patient data', e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [patient, token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading patient data…</Text>
      </View>
    );
  }

  const { patient: p, healthRecords: hr, documents: docs, vaccinations: vxs, accessInfo: acc } = data;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <Text style={styles.title}>Patient Details</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.card}>
        <Text style={styles.name}>{p?.fullName ?? 'Unnamed Patient'}</Text>
        <Text style={styles.row}>DOB: {p?.dob ? formatDate(p.dob) : '—'}</Text>
        <Text style={styles.row}>Blood Group: {p?.blood_group ?? '—'}</Text>
        {p?.emergency_contact && (
          <Text style={styles.row}>Emergency: {p.emergency_contact}</Text>
        )}
      </View>

      {/* Sections */}
      <Section title="Health Records" emptyMsg="No health records found.">
        {hr?.map((r) => (
          <View key={r.id} style={styles.item}>
            <Text style={styles.itemTitle}>{r.title}</Text>
            <Text style={styles.itemMeta}>{formatDate(r.recorded_at)}</Text>
            <Text style={styles.itemDesc}>{r.notes ?? ''}</Text>
          </View>
        ))}
      </Section>

      <Section title="Documents" emptyMsg="No documents uploaded.">
        {docs?.map((d) => (
          <Pressable
            key={d.id}
            style={styles.item}
            onPress={() => Linking.openURL(d.file_url)}
          >
            <Text style={styles.itemTitle}>{d.document_name}</Text>
            <Text style={styles.itemMeta}>{d.document_type}</Text>
            <Text style={styles.link}>Tap to view</Text>
          </Pressable>
        ))}
      </Section>

      <Section title="Vaccinations" emptyMsg="No vaccination records.">
        {vxs?.map((v) => (
          <View key={v.id} style={styles.item}>
            <Text style={styles.itemTitle}>{v.vaccine_name}</Text>
            <Text style={styles.itemMeta}>Given: {formatDate(v.administered_at)}</Text>
          </View>
        ))}
      </Section>

      {/* Footer audit info */}
      <View style={styles.footer}>
        <Text style={styles.audit}>
          Access granted by {acc?.granted_by ?? 'patient'} at {formatDate(acc?.granted_at)}
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children, emptyMsg }) {
  const hasContent = React.Children.count(children) > 0;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hasContent ? children : <Text style={styles.empty}>{emptyMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { padding: 8 },
  backTxt: { fontSize: 20 },
  title: { fontSize: 22, fontWeight: '600', marginLeft: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 6 },
  row: { fontSize: 14, color: '#374151', marginBottom: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '500', marginBottom: 6 },
  item: { backgroundColor: '#FFFFFF', borderRadius: 6, padding: 12, marginBottom: 8, elevation: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemMeta: { fontSize: 13, color: '#6B7280' },
  itemDesc: { fontSize: 14, marginTop: 4, color: '#374151' },
  link: { color: '#2563EB', marginTop: 4 },
  empty: { fontStyle: 'italic', color: '#6B7280' },
  footer: { paddingVertical: 12, borderTopWidth: 1, borderColor: '#E5E7EB' },
  audit: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#374151' },
});
