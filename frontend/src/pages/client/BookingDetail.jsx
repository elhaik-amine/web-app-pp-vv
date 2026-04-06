import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, Image, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookingDetailScreen = ({ navigation }) => {
  const steps = [
    { id: '1', title: 'EN ATTENTE', completed: true },
    { id: '2', title: 'NÉGOCIATION', completed: true },
    { id: '3', title: 'CONFIRMÉ', current: true },
    { id: '4', title: 'TERMINÉ', completed: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail Réservation</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>CONFIRMÉ</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.providerRow}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1540560717464-578bad5d138b?q=80&w=200&auto=format&fit=crop' }} style={styles.providerAvatar} />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Ahmed B.</Text>
              <Text style={styles.providerCategory}>Expert Plombier</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFB300" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#1A73E8" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>Mer. 15 Octobre</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#1A73E8" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Heure</Text>
                <Text style={styles.detailValue}>12:00 - 15:00</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix convenu</Text>
            <Text style={styles.priceValue}>230 MAD</Text>
          </View>
        </View>

        {/* QR Button */}
        <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate('QRCodeDisplay')}>
          <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
          <Text style={styles.qrButtonText}>Afficher mon QR Code</Text>
        </TouchableOpacity>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi de la réservation</Text>
          <View style={styles.timelineContainer}>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.timelineStep}>
                <View style={styles.stepIndicatorContainer}>
                  <View style={[styles.stepCircle, step.completed && styles.stepCircleCompleted, step.current && styles.stepCircleCurrent]}>
                    {step.completed ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.stepNumber, step.current && styles.stepNumberCurrent]}>{step.id}</Text>
                    )}
                  </View>
                  {index !== steps.length - 1 && (
                    <View style={[styles.stepLine, step.completed && styles.stepLineCompleted]} />
                  )}
                </View>
                <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted, step.current && styles.stepTitleCurrent]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.secondaryAction}>
            <Ionicons name="alert-circle-outline" size={20} color="#F97316" />
            <Text style={styles.secondaryActionText}>Prestataire absent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineAction}>
            <Ionicons name="flag-outline" size={20} color="#64748B" />
            <Text style={styles.outlineActionText}>Signaler un problème</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#191C23', marginLeft: 12 },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { color: '#166534', fontSize: 12, fontWeight: '700' },
  scrollContent: { padding: 24 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24, elevation: 2 },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  providerAvatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F1F5F9' },
  providerInfo: { flex: 1, marginLeft: 16 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#191C23' },
  providerCategory: { fontSize: 14, color: '#64748B' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#191C23', marginLeft: 4 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  detailTextContainer: { marginLeft: 10 },
  detailLabel: { fontSize: 12, color: '#94A3B8' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#191C23' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F7FF', padding: 16, borderRadius: 16 },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#1A73E8' },
  qrButton: { backgroundColor: '#1A73E8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 20, marginBottom: 32, elevation: 8 },
  qrButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 12 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 20 },
  timelineContainer: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  stepIndicatorContainer: { alignItems: 'center', marginRight: 16 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepCircleCompleted: { backgroundColor: '#10B981' },
  stepCircleCurrent: { backgroundColor: '#1A73E8', borderWidth: 4, borderColor: '#E0EEFF' },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  stepNumberCurrent: { color: '#FFFFFF', fontSize: 10 },
  stepLine: { width: 2, height: 40, backgroundColor: '#F1F5F9', marginTop: -4 },
  stepLineCompleted: { backgroundColor: '#10B981' },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 4 },
  stepTitleCompleted: { color: '#10B981' },
  stepTitleCurrent: { color: '#1A73E8', fontWeight: '800' },
  actionsContainer: { gap: 12 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 16, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5' },
  secondaryActionText: { color: '#F97316', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  outlineAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  outlineActionText: { color: '#64748B', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  bottomSpacer: { height: 40 },
});

export default BookingDetailScreen;