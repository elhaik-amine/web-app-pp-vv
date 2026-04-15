import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const QRScannerScreen = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  
  const { bookingId } = route.params || {};
  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      fetchCurrentMission();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBooking(data.data);
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMission = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings?status=CONFIRMED`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setBooking(data.data[0]);
      }
    } catch (error) {
      console.log('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || scanning) return;
    
    setScanned(true);
    setScanning(true);
    
    console.log('QR scanned:', data);
    
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${booking?.id}/scan-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code: data }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        Alert.alert(
          'Succès',
          'QR code validé ! Service démarré.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('UploadPhotos', { bookingId: booking?.id }),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.message || 'QR code invalide');
        setScanned(false);
        setScanning(false);
      }
    } catch (error) {
      console.log('Error verifying QR:', error);
      Alert.alert('Erreur', 'Impossible de vérifier le QR code');
      setScanned(false);
      setScanning(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Demande de permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off-outline" size={64} color="#EF4444" />
          <Text style={styles.permissionTitle}>Permission caméra refusée</Text>
          <Text style={styles.permissionText}>
            Nous avons besoin d'accéder à votre caméra pour scanner les QR codes.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.contentLayer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scanner QR</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.noMissionContainer}>
            <Ionicons name="qr-code-outline" size={80} color="#FFFFFF" />
            <Text style={styles.noMissionText}>Aucune mission en cours</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchCurrentMission}>
              <Text style={styles.refreshButtonText}>Rafraîchir</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Content Layer */}
      <SafeAreaView style={styles.contentLayer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner QR Client</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.instructionText}>Pointez la caméra vers le QR du client</Text>

        {/* Bottom Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.missionLabelContainer}>
            <View style={styles.pulseDot} />
            <Text style={styles.missionLabel}>Mission à démarrer</Text>
          </View>

          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.avatarText}>{booking.client_name?.charAt(0) || 'C'}</Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{booking.client_name || 'Client'}</Text>
              <Text style={styles.missionDetails}>
                {booking.category_name || 'Service'} — {formatDate(booking.booking_date)}
              </Text>
            </View>
            <Text style={styles.priceText}>{booking.agreed_price || 0} MAD</Text>
          </View>

          {scanned && !scanning && (
            <TouchableOpacity 
              style={styles.rescanButton} 
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          )}

          {scanning && (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="small" color="#1A73E8" />
              <Text style={styles.scanningText}>Vérification...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#FFFFFF' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#000' },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 20, marginBottom: 10 },
  permissionText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 30 },
  permissionButton: { backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  overlayTop: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayRow: { flexDirection: 'row', height: 260 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanArea: { width: 260, height: 260, backgroundColor: 'transparent', position: 'relative' },
  overlayBottom: { flex: 1.5, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFFFFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
  contentLayer: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  placeholder: { width: 44 },
  instructionText: { color: '#FFFFFF', textAlign: 'center', marginTop: 20, fontSize: 16, opacity: 0.9 },
  noMissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  noMissionText: { color: '#FFFFFF', fontSize: 18, marginTop: 20, textAlign: 'center' },
  refreshButton: { marginTop: 20, backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, margin: 20, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  missionLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  missionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  clientAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#1A73E8' },
  clientInfo: { flex: 1, marginLeft: 12 },
  clientName: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  missionDetails: { fontSize: 12, color: '#64748B', marginTop: 2 },
  priceText: { fontSize: 18, fontWeight: '800', color: '#1A73E8' },
  rescanButton: { backgroundColor: '#1A73E8', height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rescanButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scanningContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 50 },
  scanningText: { fontSize: 14, color: '#64748B' },
});

export default QRScannerScreen;