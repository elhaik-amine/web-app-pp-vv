import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const EndMissionPhotosScreen = ({ navigation, route }) => {
  const [booking, setBooking] = useState(null);
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanTime, setScanTime] = useState(null);
  
  const { bookingId } = route.params || {};
  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
      fetchBeforePhotos();
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
        setScanTime(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
    }
  };

  const fetchBeforePhotos = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/photos`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data.before) {
        setBeforePhotos(data.data.before);
      } else {
        // Mock before photos for demo
        setBeforePhotos([
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595467795924-279093847524?q=80&w=200&auto=format&fit=crop',
        ]);
      }
    } catch (error) {
      console.log('Error fetching before photos:', error);
      // Mock data for demo
      setBeforePhotos([
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595467795924-279093847524?q=80&w=200&auto=format&fit=crop',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (index) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newPhotos = [...afterPhotos];
      newPhotos[index] = result.assets[0].uri;
      setAfterPhotos(newPhotos);
    }
  };

  const uploadPhotos = async () => {
    const validPhotos = afterPhotos.filter(p => p !== null && p !== undefined);
    if (validPhotos.length === 0) {
      Alert.alert('Erreur', 'Veuillez prendre au moins une photo après la mission');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      // Upload each photo
      const uploadedUrls = [];
      for (const photoUri of validPhotos) {
        const formData = new FormData();
        formData.append('image', {
          uri: photoUri,
          type: 'image/jpeg',
          name: `after_${Date.now()}.jpg`,
        });
        
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          uploadedUrls.push(data.data.url);
        }
      }
      
      // Submit after photos to booking
      const submitResponse = await fetch(`${API_URL}/bookings/${bookingId}/after-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: uploadedUrls }),
      });
      
      const submitData = await submitResponse.json();
      
      if (submitData.success) {
        Alert.alert(
          'Succès', 
          'Photos envoyées ! Mission terminée.',
          [{ text: 'OK', onPress: () => navigation.navigate('Avis', { bookingId }) }]
        );
      } else {
        Alert.alert('Erreur', submitData.message);
      }
    } catch (error) {
      console.log('Error uploading photos:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer les photos');
    } finally {
      setSubmitting(false);
    }
  };

  const completeMission = async () => {
    if (afterPhotos.filter(p => p).length === 0) {
      Alert.alert('Erreur', 'Veuillez prendre au moins une photo après la mission');
      return;
    }
    
    Alert.alert(
      'Terminer la mission',
      'Confirmez-vous que la mission est terminée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: uploadPhotos,
        },
      ]
    );
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

  const completedPhotos = afterPhotos.filter(p => p).length;
  const totalPhotosNeeded = Math.min(2, beforePhotos.length);
  const progress = (completedPhotos / totalPhotosNeeded) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photos de fin de mission</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>QR SCANNÉ ✓</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.successBanner}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.successText}>
            QR validé à {scanTime || '14:32'} — Uploadez maintenant les photos après
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Comparaison Avant / Après</Text>

        <View style={styles.comparisonGrid}>
          <View style={styles.gridHeader}>
            <Text style={[styles.columnLabel, styles.beforeLabel]}>AVANT</Text>
            <Text style={[styles.columnLabel, styles.afterLabel]}>APRÈS</Text>
          </View>

          {beforePhotos.map((photo, index) => (
            <View key={index} style={styles.photoRow}>
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
              </View>
              <TouchableOpacity 
                style={[styles.photoContainer, styles.cameraBox]} 
                onPress={() => takePhoto(index)}
              >
                {afterPhotos[index] ? (
                  <Image source={{ uri: afterPhotos[index] }} style={styles.photo} />
                ) : (
                  <View style={styles.emptyBox}>
                    <Ionicons name="camera" size={32} color="#1A73E8" />
                    <Text style={styles.cameraText}>Prendre photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="camera-outline" size={20} color="#F97316" />
          <Text style={styles.infoText}>
            Photos via caméra uniquement — galerie désactivée pour garantir l'authenticité.
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressValue}>{completedPhotos}/{totalPhotosNeeded} photos minimum</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.finishButton, submitting && styles.finishButtonDisabled]} 
          activeOpacity={0.8}
          onPress={completeMission}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.finishButtonText}>Terminer la mission ✓</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#191C23' },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { color: '#166534', fontSize: 10, fontWeight: '800' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 32 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  successText: { flex: 1, fontSize: 13, color: '#166534', fontWeight: '700', lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191C23', marginBottom: 20 },
  comparisonGrid: { marginBottom: 32 },
  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  columnLabel: { width: '48%', textAlign: 'center', fontSize: 12, fontWeight: '800', paddingVertical: 6, borderRadius: 8 },
  beforeLabel: { backgroundColor: '#FEE2E2', color: '#EF4444' },
  afterLabel: { backgroundColor: '#DCFCE7', color: '#10B981' },
  photoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  photoContainer: { width: '48%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  photo: { width: '100%', height: '100%' },
  cameraBox: { borderWidth: 2, borderColor: '#1A73E8', borderStyle: 'dashed' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F7FF' },
  cameraText: { fontSize: 12, color: '#1A73E8', fontWeight: '700', marginTop: 8, textAlign: 'center' },
  infoBox: { flexDirection: 'row', backgroundColor: '#FFF7ED', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5', marginBottom: 32 },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#9A3412', lineHeight: 20 },
  progressContainer: { marginBottom: 40 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: '#191C23' },
  progressValue: { fontSize: 12, color: '#64748B' },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  bottomSpacer: { height: 20 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: 34, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  finishButton: { backgroundColor: '#10B981', height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  finishButtonDisabled: { opacity: 0.6 },
  finishButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default EndMissionPhotosScreen;