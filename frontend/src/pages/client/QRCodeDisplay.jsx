import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QRCodeDisplayScreen = ({ navigation, route }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  const { bookingId } = route.params || {};
  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    if (booking?.qr_expires_at) {
      const timer = setInterval(() => {
        const now = new Date();
        const expiry = new Date(booking.qr_expires_at);
        const diff = expiry - now;
        
        if (diff <= 0) {
          setTimeRemaining('Expiré');
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [booking]);

  const fetchBookingDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBooking(data.data);
      } else {
        Alert.alert('Erreur', data.message || 'Réservation non trouvée');
        navigation.goBack();
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isQRValid = () => {
    if (!booking?.qr_code) return false;
    if (booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') return false;
    if (booking.qr_expires_at && new Date(booking.qr_expires_at) < new Date()) return false;
    return true;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Réservation non trouvée</Text>
          <TouchableOpacity style={styles.backButtonSmall} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const qrValid = isQRValid();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Code QR de Mission</Text>
        <View style={[styles.statusBadge, { backgroundColor: qrValid ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusBadgeText, { color: qrValid ? '#166534' : '#991B1B' }]}>
            {booking.status === 'CONFIRMED' ? 'CONFIRMÉ' : booking.status}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.providerRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{booking.provider_name?.charAt(0) || 'P'}</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{booking.provider_name || 'Prestataire'}</Text>
              <Text style={styles.serviceCategory}>{booking.category_name || 'Service'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>{formatDate(booking.booking_date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>{booking.time_slot || 'Flexible'}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix accordé</Text>
            <Text style={styles.priceValue}>{booking.agreed_price || booking.estimated_price || 0} MAD</Text>
          </View>
        </View>

        {/* QR Code Display */}
        <View style={[styles.qrCard, !qrValid && styles.qrCardDisabled]}>
          {qrValid && booking.qr_code ? (
            <>
              <View style={styles.qrContainer}>
                <Ionicons name="qr-code" size={160} color="#191C23" />
              </View>
              <View style={styles.qrCodeBox}>
                <Text style={styles.qrCodeText} selectable>
                  {booking.qr_code}
                </Text>
              </View>
              <Text style={styles.bookingId}>Code unique de la mission</Text>
            </>
          ) : (
            <>
              <View style={styles.qrContainer}>
                <Ionicons name="qr-code-outline" size={120} color="#CBD5E1" />
              </View>
              <Text style={styles.qrDisabledText}>
                {booking.status === 'PENDING' 
                  ? 'QR Code disponible après confirmation' 
                  : booking.status === 'COMPLETED' || booking.status === 'CANCELLED'
                  ? 'QR Code expiré'
                  : 'QR Code temporairement indisponible'}
              </Text>
            </>
          )}
        </View>

        {/* Timer */}
        {qrValid && booking.qr_expires_at && (
          <View style={styles.timerBox}>
            <View style={styles.timerHeader}>
              <Ionicons name="time" size={20} color="#1A73E8" />
              <Text style={styles.timerTitle}>Validité du QR</Text>
            </View>
            <Text style={styles.timerValue}>{timeRemaining || 'Calcul...'}</Text>
            <Text style={styles.timerSubtitle}>
              Actif jusqu'au {formatTime(booking.qr_expires_at)}
            </Text>
          </View>
        )}

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            ⚠️ Montrez ce QR uniquement quand le prestataire a terminé la mission. Ne le montrez pas avant !
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  errorText: { fontSize: 18, color: '#EF4444', marginBottom: 16 },
  backButtonSmall: { backgroundColor: '#1A73E8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
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
  qrCardDisabled: { opacity: 0.6 },
  qrContainer: { width: 200, height: 200, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  qrCodeBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 8, width: '100%' },
  qrCodeText: { fontSize: 12, color: '#1A73E8', textAlign: 'center', fontFamily: 'monospace' },
  qrDisabledText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 16 },
  bookingId: { fontSize: 16, fontWeight: '600', color: '#94A3B8', letterSpacing: 1, marginTop: 12 },
  warningBox: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  warningText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#EF4444', fontWeight: '700', lineHeight: 20 },
  timerBox: { backgroundColor: '#F0F7FF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#D0E4FF', alignItems: 'center' },
  timerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timerTitle: { fontSize: 14, fontWeight: '700', color: '#1A73E8', marginLeft: 8 },
  timerValue: { fontSize: 28, fontWeight: '800', color: '#1A73E8', marginBottom: 4 },
  timerSubtitle: { fontSize: 13, color: '#475569', textAlign: 'center' },
  bottomSpacer: { height: 40 },
});

export default QRCodeDisplayScreen;