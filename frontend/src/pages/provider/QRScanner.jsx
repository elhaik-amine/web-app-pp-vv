import React, { useState, useEffect } from 'react';
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
  const [verifying, setVerifying] = useState(false);
  
  const { bookingId } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
      console.log('Error:', error);
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
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || verifying) return;
    
    setScanned(true);
    setVerifying(true);
    
    console.log('QR Scanned:', data);
    
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
      console.log('Result:', result);
      
      if (result.success) {
        Alert.alert(
          '✅ Succès',
          'QR code validé ! Service démarré.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('UploadPhotos', { bookingId: booking?.id }),
            },
          ]
        );
      } else {
        Alert.alert('❌ Erreur', result.message || 'QR code invalide');
        setScanned(false);
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Erreur', 'Impossible de vérifier le QR code');
      setScanned(false);
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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

      {/* Content */}
      <SafeAreaView style={styles.contentLayer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner QR</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.instructionText}>Placez le QR code dans le cadre</Text>

        <View style={styles.infoCard}>
          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.avatarText}>{booking.client_name?.charAt(0) || 'C'}</Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{booking.client_name || 'Client'}</Text>
              <Text style={styles.missionDetails}>
                {booking.category_name} — {formatDate(booking.booking_date)} • {booking.time_slot}
              </Text>
            </View>
          </View>

          {verifying && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color="#1A73E8" />
              <Text style={styles.verifyingText}>Vérification en cours...</Text>
            </View>
          )}

          {scanned && !verifying && (
            <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.rescanButtonText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#FFF' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#000' },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 20, marginBottom: 10 },
  permissionText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 30 },
  permissionButton: { backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  overlayTop: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.7)' },
  overlayRow: { flexDirection: 'row', height: 260 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  scanArea: { width: 260, height: 260, backgroundColor: 'transparent', position: 'relative' },
  overlayBottom: { flex: 1.5, width: '100%', backgroundColor: 'rgba(0,0,0,0.7)' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
  contentLayer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  placeholder: { width: 44 },
  instructionText: { color: '#FFF', textAlign: 'center', marginTop: 20, fontSize: 16 },
  noMissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  noMissionText: { color: '#FFF', fontSize: 18, marginTop: 20, textAlign: 'center' },
  refreshButton: { marginTop: 20, backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, margin: 20, marginBottom: 30 },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#1A73E8' },
  clientInfo: { marginLeft: 12, flex: 1 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  missionDetails: { fontSize: 12, color: '#64748B', marginTop: 2 },
  verifyingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 12, paddingVertical: 12 },
  verifyingText: { fontSize: 14, color: '#64748B' },
  rescanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A73E8', height: 50, borderRadius: 16, marginTop: 16, gap: 8 },
  rescanButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});

export default QRScannerScreen;
