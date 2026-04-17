import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AvisScreen = ({ navigation, route }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [userRole, setUserRole] = useState('');
  
  const { bookingId } = route.params || {};
  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    checkUserRole();
    if (bookingId) {
      fetchBookingDetails();
      checkExistingReview();
    }
  }, [bookingId]);

  const checkUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('khidmati_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
        
        // If user is PROVIDER, redirect to dashboard
        if (user.role === 'PROVIDER') {
          Alert.alert(
            'Accès refusé',
            'Seuls les clients peuvent laisser un avis',
            [{ text: 'OK', onPress: () => navigation.replace('ProviderDashboard') }]
          );
        }
      }
    } catch (error) {
      console.log('Error checking user role:', error);
    }
  };

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
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReview = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setExistingReview(data.data);
        setRating(data.data.rating);
        setComment(data.data.comment || '');
      }
    } catch (error) {
      console.log('Error checking review:', error);
    }
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une note');
      return;
    }
    
    if (!comment.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un commentaire');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: rating,
          comment: comment.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Merci !', 
          'Votre avis a été publié. Merci pour votre retour !',
          [{ text: 'OK', onPress: () => navigation.navigate('MesReservations') }]
        );
      } else {
        Alert.alert('Erreur', data.message || 'Impossible de publier l\'avis');
      }
    } catch (error) {
      console.log('Error submitting review:', error);
      Alert.alert('Erreur', 'Impossible de publier l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = () => {
    const texts = ['', 'Médiocre', 'Passable', 'Bien', 'Très bien', 'Excellent'];
    return `${rating}/5 — ${texts[rating]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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

  // Block provider from seeing this page
  if (userRole === 'PROVIDER') {
    return null; // Will redirect in useEffect
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

  if (existingReview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#191C23" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Votre Avis</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.alreadyReviewedCard}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.alreadyReviewedTitle}>Avis déjà publié</Text>
            <Text style={styles.alreadyReviewedText}>
              Vous avez déjà laissé un avis pour cette réservation
            </Text>
            <View style={styles.existingReviewCard}>
              <View style={styles.existingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= existingReview.rating ? 'star' : 'star-outline'} 
                    size={24} 
                    color="#FFB300" 
                  />
                ))}
              </View>
              <Text style={styles.existingComment}>{existingReview.comment}</Text>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.publishButton} onPress={() => navigation.goBack()}>
            <Text style={styles.publishButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#191C23" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Laisser un Avis</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successBanner}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.successText}>
              Mission Complétée ! Merci d'évaluer {booking.provider_name}
            </Text>
          </View>

          <View style={styles.providerCard}>
            <Image 
              source={{ uri: booking.provider_avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
              style={styles.avatar} 
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{booking.provider_name || 'Prestataire'}</Text>
              <Text style={styles.providerCategory}>
                {booking.category_name || 'Service'}
              </Text>
              <Text style={styles.dateText}>
                {formatDate(booking.date_meeting || booking.booking_date)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre note</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={star <= rating ? 'star' : 'star-outline'} 
                    size={40} 
                    color="#FFB300" 
                    style={styles.starIcon} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && <Text style={styles.ratingLabel}>{getRatingText()}</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre commentaire</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                placeholder="Partagez votre expérience..."
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.publishButton, (rating === 0 || submitting) && styles.publishButtonDisabled]} 
            onPress={submitReview}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>Publier l'avis ✓</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  placeholder: { width: 40 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 24 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  successText: { flex: 1, fontSize: 14, color: '#166534', fontWeight: '700' },
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 32, borderWidth: 1, borderColor: '#E2E8F0' },
  avatar: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F1F5F9' },
  providerInfo: { marginLeft: 16 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  providerCategory: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#94A3B8' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 16 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  starIcon: { marginHorizontal: 4 },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#FFB300' },
  textAreaContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16 },
  textArea: { height: 120, fontSize: 16, color: '#191C23', lineHeight: 24 },
  alreadyReviewedCard: { alignItems: 'center', padding: 32, backgroundColor: '#F8FAFC', borderRadius: 20 },
  alreadyReviewedTitle: { fontSize: 18, fontWeight: '700', color: '#191C23', marginTop: 16, marginBottom: 8 },
  alreadyReviewedText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  existingReviewCard: { width: '100%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginTop: 16 },
  existingStars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  existingComment: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  bottomSpacer: { height: 120 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  publishButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  publishButtonDisabled: { opacity: 0.6 },
  publishButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default AvisScreen;
