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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const QRScannerScreen = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isProcessing = React.useRef(false); // synchronous lock — useState is async so can't guard alone
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanStatus, setScanStatus] = useState('initialisez'); // 'initialisez' | 'pret' | 'detecte' | 'verification' | 'erreur'
  
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

  const verifyQRCode = async (qrCode) => {
    if (!qrCode || qrCode.trim() === '') {
      Alert.alert('Erreur', 'Veuillez entrer un code QR valide');
      return;
    }

    setVerifying(true);
    setScanStatus('verification');
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${booking?.id}/scan-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code: qrCode.trim() }),
      });
      
      const result = await response.json();
      // console.log('Verify result:', result);
      
      if (result.success) {
        Alert.alert(
          '✅ Succès',
          'QR code validé ! Service démarré.',
          [
            {
              text: 'OK',
              onPress: () => {
        setModalVisible(false);
        setManualCode('');
                // Navigate back to BookingDetail to show the complete button
                navigation.replace('BookingDetail', { bookingId: booking?.id });
              },
            },
          ]
        );
      } else {
        Alert.alert('❌ Erreur', result.message || 'QR code invalide');
        setScanned(false);
        setScanStatus('erreur');
      }
    } catch (error) {
      // console.log('Error:', error);
      Alert.alert('Erreur', 'Impossible de vérifier le code');
      setScanned(false);
      setScanStatus('erreur');
    } finally {
      setVerifying(false);
      isProcessing.current = false;
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setScanned(true);
    setScanStatus('detecte');
    verifyQRCode(data);
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
          <TouchableOpacity 
            style={[styles.permissionButton, styles.manualButton]} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.permissionButtonText}>Entrer le code manuellement</Text>
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
            <Ionicons name="qr-code-outline" size={80} color="#CBD5E1" />
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
      
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        onCameraReady={() => setScanStatus('pret')}
        barcodeScannerEnabled={true}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner QR</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.codeButton}>Code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.scannerFrame}>
        <View style={styles.scannerArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      <Text style={styles.instructionText}>Placez le QR code dans le cadre</Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: scanStatus === 'pret' || scanStatus === 'detecte' ? '#10B981' : '#F59E0B' }]} />
        <Text style={styles.statusText}>
          {scanStatus === 'initialisez' && 'Initialisation...'}
          {scanStatus === 'pret' && 'Scanner prêt'}
          {scanStatus === 'detecte' && 'QR détecté ! Vérification...'}
          {scanStatus === 'verification' && 'Vérification...'}
          {scanStatus === 'erreur' && 'Erreur de scan'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.missionLabelContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.missionLabel}>MISSION À DÉMARRER</Text>
        </View>

        <View style={styles.clientRow}>
          <View style={styles.clientAvatar}>
            <Text style={styles.avatarText}>{booking.client_name?.charAt(0) || 'C'}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{booking.client_name || 'Client'}</Text>
            <Text style={styles.missionDetails}>
              {booking.category_name || 'Service'} — {formatDate(booking.date_meeting)} • {booking.time_slot || 'Flexible'}
            </Text>
          </View>
          <Text style={styles.priceText}>{booking.agreed_price || booking.estimated_price || 0} MAD</Text>
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

      {/* Manual Entry Button */}
      <TouchableOpacity 
        style={styles.manualEntryButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="keypad-outline" size={20} color="#1A73E8" />
        <Text style={styles.manualEntryButtonText}>Saisir le code manuellement</Text>
      </TouchableOpacity>

      {/* Manual Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setScanned(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrer le code QR</Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setScanned(false);
              }}>
                <Ionicons name="close" size={24} color="#191C23" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Saisissez le code affiché sur le téléphone du client
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 6bdd46726553af600fb1e4e..."
              placeholderTextColor="#94A3B8"
              value={manualCode}
              onChangeText={setManualCode}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.modalButton, verifying && styles.buttonDisabled]}
              onPress={() => verifyQRCode(manualCode)}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonText}>Vérifier le code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  permissionButton: { backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 12 },
  manualButton: { backgroundColor: '#64748B' },
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  codeButton: { color: '#1A73E8', fontSize: 16, fontWeight: '600' },
  scannerFrame: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerArea: { width: width - 80, height: width - 80, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#1A73E8', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  instructionText: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 12, fontSize: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 24, margin: 20, padding: 20, marginBottom: 8 },
  missionLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  missionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 1 },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#1A73E8' },
  clientInfo: { flex: 1, marginLeft: 12 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  missionDetails: { fontSize: 12, color: '#64748B', marginTop: 2 },
  priceText: { fontSize: 18, fontWeight: '800', color: '#1A73E8' },
  verifyingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 12, paddingVertical: 12 },
  verifyingText: { fontSize: 14, color: '#64748B' },
  rescanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A73E8', height: 50, borderRadius: 16, marginTop: 16, gap: 8 },
  rescanButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  noMissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  noMissionText: { fontSize: 18, color: '#64748B', marginTop: 20, textAlign: 'center' },
  refreshButton: { marginTop: 20, backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  contentLayer: { flex: 1, backgroundColor: '#F8FAFC' },
  // Modal Styles
  manualEntryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 80, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1A73E8', gap: 8 },
  manualEntryButtonText: { fontSize: 16, fontWeight: '700', color: '#1A73E8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#191C23' },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  modalInput: { width: '100%', minHeight: 80, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 14, color: '#191C23', backgroundColor: '#F8FAFC', textAlign: 'left', marginBottom: 20 },
  modalButton: { backgroundColor: '#1A73E8', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default QRScannerScreen;