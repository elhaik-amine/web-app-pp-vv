import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert,
  Share, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';

const QRCodeDisplayScreen = ({ navigation, route }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [qrActive, setQrActive] = useState(false);
  
  const { bookingId } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    if (booking) {
      checkQRActivity();
      const interval = setInterval(() => {
        checkQRActivity();
      }, 1000);
      return () => clearInterval(interval);
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
      console.log('Booking details:', data);
      
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

  const checkQRActivity = () => {
    if (!booking) return;
    
    const now = new Date();
    const activeFrom = new Date(booking.qr_active_from);
    const activeUntil = new Date(booking.qr_active_until);
    
    const isActive = now >= activeFrom && now <= activeUntil && booking.status === 'CONFIRMED';
    setQrActive(isActive);
    
    if (now < activeFrom) {
      const diff = activeFrom - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else if (now > activeUntil) {
      setTimeRemaining('Expiré');
    } else {
      setTimeRemaining(null);
    }
  };

  const shareQRCode = () => {
    if (booking?.qr_code) {
      Share.share({
        message: `Code QR pour la mission #${booking.id}: ${booking.qr_code}`,
        title: 'Code QR Khdimati',
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTimeSlot = (timeSlot) => {
    return timeSlot || 'Flexible';
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

  const formatActiveTime = () => {
    const from = new Date(booking.qr_active_from);
    const until = new Date(booking.qr_active_until);
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${from.toLocaleTimeString([], timeOptions)} - ${until.toLocaleTimeString([], timeOptions)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Code QR de Mission</Text>
        <View style={[styles.statusBadge, { backgroundColor: qrActive ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusBadgeText, { color: qrActive ? '#166534' : '#991B1B' }]}>
            {qrActive ? 'ACTIF' : 'INACTIF'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              <Text style={styles.detailText}>{formatDate(booking.date_meeting)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.detailText}>{formatTimeSlot(booking.time_slot)}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix accordé</Text>
            <Text style={styles.priceValue}>{booking.agreed_price || booking.estimated_price || 0} MAD</Text>
          </View>
        </View>

        {/* QR Code Display with Timer */}
        <View style={[styles.qrCard, !qrActive && styles.qrCardDisabled]}>
          {qrActive && booking.qr_code ? (
            <>
              <View style={styles.qrContainer}>
                <QRCode
                  value={booking.qr_code}
                  size={260}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  quietZone={20}
                />
              </View>
              <Text style={styles.activeText}>✅ QR actif - Montrez au prestataire</Text>
              <TouchableOpacity style={styles.shareButton} onPress={shareQRCode}>
                <Ionicons name="share-outline" size={20} color="#1A73E8" />
                <Text style={styles.shareButtonText}>Partager le QR code</Text>
              </TouchableOpacity>
              <Text style={styles.rawCodeLabel}>Code :</Text>
              <Text style={styles.rawCodeText} selectable>{booking.qr_code}</Text>
            </>
          ) : (
            <>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="time-outline" size={80} color="#CBD5E1" />
              </View>
              <Text style={styles.waitingText}>
                QR code disponible à partir de {new Date(booking.qr_active_from).toLocaleTimeString()}
              </Text>
              {timeRemaining && timeRemaining !== 'Expiré' && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownLabel}>Actif dans :</Text>
                  <Text style={styles.countdownValue}>{timeRemaining}</Text>
                </View>
              )}
              {timeRemaining === 'Expiré' && (
                <Text style={styles.expiredText}>QR code expiré</Text>
              )}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#1A73E8" />
                <Text style={styles.infoText}>
                  Le QR code sera actif pendant la durée du service: {formatActiveTime()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            ⚠️ Montrez ce QR uniquement au prestataire quand il arrive.
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
  scrollContent: { padding: 24, alignItems: 'center' },
  summaryCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: '#1A73E8' },
  providerInfo: { marginLeft: 12, flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  serviceCategory: { fontSize: 13, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  detailsRow: { flexDirection: 'row', marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  detailText: { fontSize: 14, color: '#475569', marginLeft: 6 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16 },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#166534' },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#10B981' },
  qrCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  qrCardDisabled: { backgroundColor: '#F8FAFC' },
  qrContainer: { padding: 16, backgroundColor: '#000000', borderRadius: 16, marginBottom: 16 },
  activeText: { fontSize: 14, color: '#10B981', fontWeight: '600', marginBottom: 16 },
  shareButton: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F0F7FF', borderRadius: 20 },
  shareButtonText: { fontSize: 14, fontWeight: '600', color: '#1A73E8', marginLeft: 8 },
  rawCodeLabel: { fontSize: 12, color: '#94A3B8', marginTop: 16, marginBottom: 4 },
  rawCodeText: { fontSize: 11, color: '#475569', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', paddingHorizontal: 8 },
  qrPlaceholder: { width: 220, height: 220, backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  waitingText: { fontSize: 16, fontWeight: '600', color: '#F97316', marginBottom: 8 },
  countdownContainer: { alignItems: 'center', marginTop: 8 },
  countdownLabel: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  countdownValue: { fontSize: 24, fontWeight: '800', color: '#1A73E8' },
  expiredText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', padding: 12, borderRadius: 12, marginTop: 16 },
  infoText: { flex: 1, fontSize: 12, color: '#1A73E8', marginLeft: 8 },
  warningBox: { width: '100%', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  warningText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#EF4444', fontWeight: '700', lineHeight: 20 },
  bottomSpacer: { height: 40 },
});

export default QRCodeDisplayScreen;
