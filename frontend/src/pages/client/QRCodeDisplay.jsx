import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const QRCodeDisplayScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Code QR de Mission</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>CONFIRMÉ</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.providerRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>A</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Ahmed B.</Text>
              <Text style={styles.serviceCategory}>Plomberie</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>15 Octobre</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>12:00 - 15:00</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix accordé</Text>
            <Text style={styles.priceValue}>230 MAD</Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <View style={styles.qrGrid}>
              {[...Array(9)].map((_, i) => (
                <View key={i} style={styles.qrSquareRow}>
                  {[...Array(9)].map((_, j) => (
                    <View key={j} style={[styles.qrDot, { backgroundColor: (i + j) % 3 === 0 ? '#191C23' : '#FFFFFF' }]} />
                  ))}
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.bookingId}>#KH-2024-0892</Text>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            ⚠️ Montrez ce QR uniquement quand le prestataire a TERMINÉ la mission. Ne le montrez pas avant !
          </Text>
        </View>

        {/* Timer */}
        <View style={styles.timerBox}>
          <View style={styles.timerHeader}>
            <Ionicons name="time" size={20} color="#1A73E8" />
            <Text style={styles.timerTitle}>Activation du QR</Text>
          </View>
          <Text style={styles.timerSubtitle}>QR actif à partir de 12:00 le 15 Oct</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { color: '#166534', fontSize: 12, fontWeight: '800' },
  scrollContent: { padding: 24 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24, elevation: 2 },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: '#1A73E8' },
  providerInfo: { marginLeft: 12 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  serviceCategory: { fontSize: 13, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  detailsRow: { flexDirection: 'row', marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  detailText: { fontSize: 14, color: '#475569', marginLeft: 6 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16 },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#166534' },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#10B981' },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24, elevation: 5 },
  qrContainer: { width: 200, height: 200, backgroundColor: '#FFFFFF', padding: 10, borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  qrGrid: { width: '100%', height: '100%' },
  qrSquareRow: { flex: 1, flexDirection: 'row' },
  qrDot: { flex: 1, margin: 1 },
  bookingId: { fontSize: 16, fontWeight: '600', color: '#94A3B8', letterSpacing: 1 },
  warningBox: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  warningText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#EF4444', fontWeight: '700', lineHeight: 20 },
  timerBox: { backgroundColor: '#F0F7FF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#D0E4FF', alignItems: 'center' },
  timerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timerTitle: { fontSize: 14, fontWeight: '700', color: '#1A73E8', marginLeft: 8 },
  timerSubtitle: { fontSize: 15, color: '#475569', textAlign: 'center' },
  bottomSpacer: { height: 40 },
});

export default QRCodeDisplayScreen;