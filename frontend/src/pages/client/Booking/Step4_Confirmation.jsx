import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Image, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLOUDINARY_URL = process.env.EXPO_PUBLIC_CLOUDINARY_URL;
const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const requireApiConfig = () => {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is missing');
};

const requireCloudinaryConfig = () => {
  if (!CLOUDINARY_URL) throw new Error('EXPO_PUBLIC_CLOUDINARY_URL is missing');
  if (!CLOUDINARY_PRESET) throw new Error('EXPO_PUBLIC_CLOUDINARY_PRESET is missing');
};

// ─── Upload a single local URI to Cloudinary ──────────────────────────────────
const getCloudinaryCloudName = () => {
  const match = CLOUDINARY_URL?.match(/\/v1_1\/([^/]+)\//);
  return match?.[1] || 'unknown';
};

const uploadToCloudinary = async (photo) => {
  requireCloudinaryConfig();

  if (!photo?.uri) {
    throw new Error('Photo URI is missing');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: photo.uri,
    type: photo.mimeType || 'image/jpeg',
    name: photo.fileName || `booking_${Date.now()}.jpg`,
  });
  formData.append('upload_preset', CLOUDINARY_PRESET);

  const uploadWithUri = () => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', CLOUDINARY_URL);
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        reject(new Error('Cloudinary returned an invalid response'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        console.log('Cloudinary upload ok:', {
          cloudName: getCloudinaryCloudName(),
          publicId: data.public_id,
        });
        resolve(data.secure_url);
        return;
      }

      reject(new Error(data.error?.message || `Cloudinary upload failed (${xhr.status})`));
    };

    xhr.onerror = () => {
      reject(new Error('Cloudinary upload network error'));
    };

    xhr.send(formData);
  });

  try {
    return await uploadWithUri();
  } catch (uriError) {
    if (!photo.base64) {
      throw uriError;
    }

    console.log('Cloudinary URI upload failed, retrying with base64:', {
      message: uriError.message,
      cloudName: getCloudinaryCloudName(),
    });

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: `data:${photo.mimeType || 'image/jpeg'};base64,${photo.base64}`,
        upload_preset: CLOUDINARY_PRESET,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || `Cloudinary base64 upload failed (${response.status})`);
    }

    console.log('Cloudinary upload ok:', {
      cloudName: getCloudinaryCloudName(),
      publicId: data.public_id,
      fallback: 'base64',
    });
    return data.secure_url;
  }
};

const BookingStep4Screen = ({ navigation, route }) => {
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState(''); // 'photos' | 'booking' | 'saving'
  const submittingRef = useRef(false);

  const {
    providerId,
    providerName,
    description,
    photos,
    proposedPrice,
    bookingDate,   // already a local YYYY-MM-DD string from Step3
    timeSlot,
  } = route.params || {};

  const handleConfirm = async () => {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    let currentPhase = '';
    const updatePhase = (nextPhase) => {
      currentPhase = nextPhase;
      setPhase(nextPhase);
    };

    try {
      requireApiConfig();

      const token = await AsyncStorage.getItem('khidmati_token');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      if (!photos?.length) {
        throw new Error('Veuillez ajouter au moins une photo avant la réservation');
      }

      updatePhase('photos');
      const uploadedUrls = [];
      for (let i = 0; i < photos.length; i += 1) {
        const photoUrl = await uploadToCloudinary(photos[i]);
        uploadedUrls.push(photoUrl);
      }

      // Upload before photos first so the provider never receives a booking without evidence photos.
      updatePhase('booking');
      const bookingRes = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_id:    providerId,
          date_meeting:   bookingDate,   // ← correct column name
          time_slot:      timeSlot,
          estimated_price: Number(proposedPrice),
          notes:          description,
        }),
      });
      const bookingData = await bookingRes.json();
      if (!bookingData.success) {
        Alert.alert('Erreur', bookingData.message || 'Erreur lors de la réservation');
        return;
      }
      const bookingId = bookingData.data?.id || bookingData.id;

      updatePhase('saving');
      let photosSaved = 0;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        try {
          const photoUrl = uploadedUrls[i];

          updatePhase('saving');
          const savePhotoRes = await fetch(`${API_URL}/bookings/${bookingId}/photos`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'BEFORE',
              url: photoUrl,
              description: i === 0 ? description : null,
              sort_order: photo.sort_order || i + 1,
            }),
          });

          const savePhotoData = await savePhotoRes.json();
          if (!savePhotoRes.ok || !savePhotoData.success) {
            throw new Error(savePhotoData.message || 'Failed to save booking photo');
          }

          photosSaved += 1;
        } catch (photoError) {
          console.log('Booking photo upload skipped:', {
            message: photoError.message,
            bookingId,
            index: i,
          });
          throw photoError;
        }
      }

      Alert.alert(
        '✅ Réservation envoyée',
        `Votre demande a été envoyée au prestataire avec ${photosSaved} photo(s). Il pourra accepter ou négocier le prix.`,
        [{ text: 'OK', onPress: () => navigation.replace('BookingDetail', { bookingId }) }],
      );
    } catch (error) {
      console.log('Booking error:', {
        message: error.message,
        phase: currentPhase,
        apiUrl: API_URL,
        cloudinaryUrl: CLOUDINARY_URL,
      });
      Alert.alert('Erreur', error.message || "Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setPhase('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Parse as local date (avoid UTC midnight shift)
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const phaseLabel = () => {
    if (phase === 'photos')  return `Envoi des photos… (${photos?.length} photo${photos?.length > 1 ? 's' : ''})`;
    if (phase === 'booking') return 'Création de la réservation…';
    if (phase === 'saving')  return 'Finalisation…';
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={submitting}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Réservation</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressText}>Étape 4 de 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Récapitulatif de votre demande</Text>

        {/* Provider card */}
        <View style={styles.summaryCard}>
          <View style={styles.providerRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{providerName?.charAt(0) || 'P'}</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{providerName || 'Prestataire'}</Text>
              <Text style={styles.providerSpecialty}>Prestataire de service</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.iconLabelGroup}>
              <Ionicons name="calendar-outline" size={20} color="#1A73E8" />
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(bookingDate)}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconLabelGroup}>
              <Ionicons name="time-outline" size={20} color="#1A73E8" />
              <Text style={styles.detailLabel}>Créneau</Text>
            </View>
            <Text style={styles.detailValue}>{timeSlot}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconLabelGroup}>
              <Ionicons name="pricetag-outline" size={20} color="#1A73E8" />
              <Text style={styles.detailLabel}>Prix proposé</Text>
            </View>
            <Text style={styles.priceValue}>{proposedPrice} MAD</Text>
          </View>

          {description && (
            <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.iconLabelGroup}>
                <Ionicons name="document-text-outline" size={20} color="#1A73E8" />
                <Text style={styles.detailLabel}>Description</Text>
              </View>
              <Text style={styles.descriptionValue} numberOfLines={2}>{description}</Text>
            </View>
          )}
        </View>

        {/* Photos preview */}
        {photos?.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.photosSectionTitle}>
              <Ionicons name="images-outline" size={16} color="#1A73E8" /> Photos jointes ({photos.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {photos.map((photo, i) => (
                <Image key={i} source={{ uri: photo.uri }} style={styles.photoThumb} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#1A73E8" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Votre demande sera envoyée au prestataire. Il pourra accepter ou négocier le prix.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        {submitting && phase ? (
          <View style={styles.phaseContainer}>
            <ActivityIndicator color="#1A73E8" style={{ marginRight: 10 }} />
            <Text style={styles.phaseText}>{phaseLabel()}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.confirmButtonText}>Confirmer la réservation ✓</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  placeholder: { width: 40 },
  progressContainer: { paddingHorizontal: 24, marginBottom: 24 },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#1A73E8', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#1A73E8', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#191C23', marginBottom: 20 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, marginBottom: 20 },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 24, fontWeight: '700', color: '#1A73E8' },
  providerInfo: { flex: 1, marginLeft: 16 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#191C23' },
  providerSpecialty: { fontSize: 14, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  iconLabelGroup: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: '#64748B', marginLeft: 12 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#191C23', textAlign: 'right', maxWidth: '55%' },
  descriptionValue: { fontSize: 13, color: '#64748B', textAlign: 'right', maxWidth: '55%' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#1A73E8' },
  photosSection: { marginBottom: 20 },
  photosSectionTitle: { fontSize: 14, fontWeight: '700', color: '#191C23', marginBottom: 12 },
  photosScroll: { flexDirection: 'row' },
  photoThumb: { width: 72, height: 72, borderRadius: 12, marginRight: 10, backgroundColor: '#F1F5F9' },
  infoBox: { flexDirection: 'row', backgroundColor: '#F0F7FF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#D0E4FF', marginBottom: 8 },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#1A73E8', lineHeight: 20 },
  bottomSpacer: { height: 130 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  phaseContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  phaseText: { fontSize: 13, color: '#1A73E8', fontWeight: '600' },
  confirmButton: { backgroundColor: '#10B981', height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default BookingStep4Screen;
