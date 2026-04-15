import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';

const QRCodeDisplayScreen = ({ navigation, route }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { bookingId } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

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
        console.log('QR Code value:', data.data.qr_code);
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

  const shareQRCode = () => {
    if (booking?.qr_code) {
      Share.share({
        message: `Code QR pour la mission #${booking.id}: ${booking.qr_code}`,
        title: 'Code QR Khdimati',
      });
    }
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

  const qrValid = booking.qr_code && (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Code QR de Mission</Text>
        <View style={[styles.statusBadge, { backgroundColor: qrValid ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusBadgeText, { color: qrValid ? '#166534' : '#991B1B' }]}>
            {booking.status === 'CONFIRMED' ? 'ACTIF' : booking.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix</Text>
            <Text style={styles.priceValue}>{booking.agreed_price || booking.estimated_price || 0} MAD</Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={[styles.qrCard, !qrValid && styles.qrCardDisabled]}>
          {qrValid && booking.qr_code ? (
            <>
              <View style={styles.qrContainer}>
                <QRCode
                  value={booking.qr_code}
                  size={220}
                  bgColor="#000000"
                  fgColor="#FFFFFF"
                />
              </View>
              <Text style={styles.qrCodeValue} selectable>
                Code: {booking.qr_code.substring(0, 16)}...
              </Text>
              <TouchableOpacity style={styles.shareButton} onPress={shareQRCode}>
                <Ionicons name="share-outline" size={20} color="#1A73E8" />
                <Text style={styles.shareButtonText}>Partager le QR code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={100} color="#CBD5E1" />
              </View>
              <Text style={styles.qrDisabledText}>
                QR Code disponible après confirmation du prestataire
              </Text>
            </>
          )}
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            ⚠️ Montrez ce QR uniquement au prestataire quand il arrive.
          </Text>
        </View>
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
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#1A73E8' },
  qrCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 32, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  qrCardDisabled: { opacity: 0.6 },
  qrContainer: { padding: 16, backgroundColor: '#000000', borderRadius: 16, marginBottom: 16 },
  qrCodeValue: { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', marginTop: 8 },
  shareButton: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F0F7FF', borderRadius: 20 },
  shareButtonText: { fontSize: 14, fontWeight: '600', color: '#1A73E8', marginLeft: 8 },
  qrPlaceholder: { width: 220, height: 220, backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qrDisabledText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 16 },
  warningBox: { width: '100%', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center' },
  warningText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#EF4444', fontWeight: '700', lineHeight: 20 },
});

export default QRCodeDisplayScreen;
