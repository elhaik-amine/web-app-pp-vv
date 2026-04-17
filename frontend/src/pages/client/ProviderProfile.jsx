import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, Dimensions, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const availability = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mer', value: 3 },
  { label: 'Jeu', value: 4 },
  { label: 'Ven', value: 5 },
  { label: 'Sam', value: 6 },
  { label: 'Dim', value: 7 },
];

const ProviderProfileScreen = ({ navigation, route }) => {
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableDays, setAvailableDays] = useState([]);
  
  const { providerId } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (providerId) {
      fetchProviderDetails();
      fetchProviderReviews();
      fetchAvailability();
    }
  }, [providerId]);

  const fetchProviderDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/providers/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Provider details:', data);
      
      if (data.success) {
        setProvider(data.data);
      }
    } catch (error) {
      console.log('Error fetching provider:', error);
    }
  };

  const fetchProviderReviews = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings?provider_id=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter reviews from completed bookings
        const reviewList = data.data
          .filter(booking => booking.status === 'COMPLETED' && booking.review)
          .map(booking => ({
            id: booking.id,
            name: booking.client_name,
            rating: booking.review?.rating || 5,
            date: new Date(booking.created_at).toLocaleDateString(),
            comment: booking.review?.comment || 'Excellent service!',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          }));
        setReviews(reviewList);
      }
    } catch (error) {
      console.log('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/providers/${providerId}/availability`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const days = data.data
          .filter(d => Number(d.is_available) === 1)
          .map(d => Number(d.day_of_week));
        setAvailableDays(days);
      }
    } catch (error) {
      console.log('Error fetching availability:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProviderDetails();
    fetchProviderReviews();
    fetchAvailability();
  };

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{item.name}</Text>
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
        <View style={styles.reviewStars}>
          {[...Array(5)].map((_, i) => (
            <Ionicons key={i} name="star" size={12} color={i < item.rating ? '#FFB300' : '#E2E8F0'} />
          ))}
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

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

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Prestataire non trouvé</Text>
          <TouchableOpacity style={styles.backButtonSmall} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
        }
      >
        {/* Header Photo */}
        <View style={styles.headerContainer}>
          <Image 
            source={{ uri: provider.avatar || 'https://images.unsplash.com/photo-1540560717464-578bad5d138b?q=80&w=800&auto=format&fit=crop' }} 
            style={styles.headerImage} 
          />
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#191C23" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="share-outline" size={24} color="#191C23" />
            </TouchableOpacity>
          </View>
          <View style={styles.nameCard}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName}>{provider.name}</Text>
              {provider.is_verified === 1 && (
                <MaterialCommunityIcons name="check-decagram" size={20} color="#1A73E8" />
              )}
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.providerSpecialty}>{provider.category_name || 'Prestataire'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.rating || '4.5'} ⭐</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.total_reviews || 0}</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{provider.experience || '3'} ans</Text>
            <Text style={styles.statLabel}>Expérience</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.bioText}>{provider.description || 'Professionnel dédié à fournir un service de qualité.'}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color="#1A73E8" />
            <Text style={styles.locationText}>{provider.city || 'Maroc'}</Text>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilités</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.availabilityList}>
            {availability
              .filter((day) => availableDays.includes(day.value))
              .map((day) => {
              return (
                <View key={day.value} style={[styles.dayChip, styles.dayChipActive]}>
                  <Text style={[styles.dayText, styles.dayTextActive]}>{day.label}</Text>
                </View>
              );
            })}
            {availableDays.length === 0 && (
              <Text style={styles.noAvailabilityText}>Aucune disponibilité renseignée</Text>
            )}
          </ScrollView>
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Avis Clients</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <FlatList 
              data={reviews.slice(0, 3)} 
              renderItem={renderReview} 
              keyExtractor={(item) => item.id.toString()} 
              scrollEnabled={false} 
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <SafeAreaView style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>{provider.min_price || 150} MAD<Text style={styles.priceUnit}>/h</Text></Text>
          <Text style={styles.priceLabel}>Prix indicatif</Text>
        </View>
        <TouchableOpacity 
          style={styles.bookButton} 
          onPress={() => navigation.navigate('Step1', { providerId: provider.id, providerName: provider.name })}
        >
          <Text style={styles.bookButtonText}>Réserver maintenant</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  errorText: { fontSize: 18, color: '#EF4444', marginBottom: 16 },
  backButtonSmall: { backgroundColor: '#1A73E8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  headerContainer: { height: width * 1.0, position: 'relative' },
  headerImage: { width: '100%', height: '100%' },
  headerOverlay: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  nameCard: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, elevation: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  providerName: { fontSize: 22, fontWeight: '800', color: '#191C23', marginRight: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginLeft: 8 },
  providerSpecialty: { fontSize: 14, color: '#64748B' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -12, marginBottom: 24 },
  statCard: { width: '30%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#94A3B8' },
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#191C23', marginBottom: 12 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  bioText: { fontSize: 15, color: '#64748B', lineHeight: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 15, color: '#64748B', marginLeft: 8 },
  availabilityList: { paddingVertical: 4 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1 },
  dayChipActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  dayText: { fontSize: 14, fontWeight: '600' },
  dayTextActive: { color: '#FFFFFF' },
  noAvailabilityText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', paddingVertical: 10 },
  reviewCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewInfo: { flex: 1 },
  reviewName: { fontSize: 14, fontWeight: '700', color: '#191C23' },
  reviewDate: { fontSize: 12, color: '#94A3B8' },
  reviewStars: { flexDirection: 'row' },
  reviewComment: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  bottomSpacer: { height: 120 },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  priceContainer: { flex: 1 },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#1A73E8' },
  priceUnit: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  priceLabel: { fontSize: 12, color: '#94A3B8' },
  bookButton: { backgroundColor: '#1A73E8', paddingHorizrontal: 24, paddingVertical: 16, borderRadius: 16, elevation: 4 },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default ProviderProfileScreen;
