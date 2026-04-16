import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookingDetailScreen = ({ navigation, route }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  const { bookingId } = route.params || {};
  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    loadUserRole();
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  // Auto-refresh status every 30 seconds for confirmed/in_progress bookings
  useEffect(() => {
    const interval = setInterval(() => {
      if (booking?.status === 'CONFIRMED' || booking?.status === 'IN_PROGRESS') {
        fetchBookingDetails();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [booking?.status]);

  const loadUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('khidmati_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    } catch (error) {
      console.log('Error loading user role:', error);
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

  const cancelBooking = async () => {
    Alert.alert(
      'Annuler la réservation',
      'Voulez-vous vraiment annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              
              const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Succès', 'Réservation annulée');
                navigation.goBack();
              } else {
                Alert.alert('Erreur', data.message || 'Erreur lors de l\'annulation');
              }
            } catch (error) {
              console.log('Error cancelling:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la réservation');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const reportNoShow = async () => {
    Alert.alert(
      'Signaler une absence',
      'Confirmez-vous que le prestataire ne s\'est pas présenté ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              
              const response = await fetch(`${API_URL}/bookings/${bookingId}/report-noshow`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Succès', 'Signalement envoyé');
                fetchBookingDetails();
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error) {
              console.log('Error reporting:', error);
              Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
            }
          },
        },
      ]
    );
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'CONFIRMED': return { bg: '#DCFCE7', text: '#166534', label: 'CONFIRMÉ' };
      case 'PENDING': return { bg: '#EFF6FF', text: '#1E40AF', label: 'EN ATTENTE' };
      case 'IN_PROGRESS': return { bg: '#FFF7ED', text: '#9A3412', label: 'EN COURS' };
      case 'COMPLETED': return { bg: '#F0FDF4', text: '#15803d', label: 'TERMINÉ' };
      case 'CANCELLED': return { bg: '#FEF2F2', text: '#991B1B', label: 'ANNULÉ' };
      default: return { bg: '#F1F5F9', text: '#475569', label: status };
    }
  };

  const getSteps = (status) => {
    const steps = [
      { id: '1', title: 'EN ATTENTE', key: 'PENDING' },
      { id: '2', title: 'CONFIRMÉ', key: 'CONFIRMED' },
      { id: '3', title: 'EN COURS', key: 'IN_PROGRESS' },
      { id: '4', title: 'TERMINÉ', key: 'COMPLETED' },
    ];
    
    const currentStepIndex = steps.findIndex(s => s.key === status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex,
      current: step.key === status,
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
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

  const statusStyle = getStatusStyles(booking.status);
  const steps = getSteps(booking.status);
  const showContactInfo = (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS');
  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isCompleted = booking.status === 'COMPLETED';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail Réservation</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.providerRow}>
            <Image 
              source={{ uri: userRole === 'PROVIDER' ? (booking.client_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg') : (booking.provider_avatar || 'https://randomuser.me/api/portraits/men/32.jpg') }} 
              style={styles.providerAvatar} 
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>
                {userRole === 'PROVIDER' ? booking.client_name : booking.provider_name || 'Prestataire'}
              </Text>
              <Text style={styles.providerCategory}>
                {userRole === 'PROVIDER' ? 'Client' : booking.category_name || 'Service'}
              </Text>
            </View>
            
            {userRole === 'CLIENT' && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFB300" />
                <Text style={styles.ratingText}>{booking.provider_rating || '4.5'}</Text>
              </View>
            )}
          </View>

          {userRole === 'PROVIDER' && showContactInfo && booking.client_phone && (
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${booking.client_phone}`)}>
              <View style={styles.phoneBadge}>
                <Ionicons name="call-outline" size={16} color="#10B981" />
                <Text style={styles.phoneText}>Contacter le client: {booking.client_phone}</Text>
              </View>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#1A73E8" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(booking.booking_date)}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#1A73E8" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Heure</Text>
                <Text style={styles.detailValue}>{formatTimeSlot(booking.time_slot)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix convenu</Text>
            <Text style={styles.priceValue}>{booking.agreed_price || booking.estimated_price || 0} MAD</Text>
          </View>
        </View>

        {/* QR Code for CLIENT - Show QR when confirmed */}
        {userRole === 'CLIENT' && isConfirmed && (
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => navigation.navigate('QRCodeDisplay', { bookingId: booking.id })}
          >
            <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            <Text style={styles.qrButtonText}>Afficher mon QR Code</Text>
          </TouchableOpacity>
        )}

        {/* QR Scanner for PROVIDER - Scan client's QR when confirmed */}
        {userRole === 'PROVIDER' && isConfirmed && (
          <TouchableOpacity 
            style={styles.scannerButton}
            onPress={() => navigation.navigate('QRScanner', { bookingId: booking.id })}
          >
            <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
            <Text style={styles.scannerButtonText}>Scanner QR Client</Text>
          </TouchableOpacity>
        )}

        {/* Complete Service Button for PROVIDER - When service is in progress */}
        {userRole === 'PROVIDER' && isInProgress && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => navigation.navigate('UploadPhotos', { bookingId: booking.id })}
          >
            <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Terminer la mission</Text>
          </TouchableOpacity>
        )}

        {/* Negotiation Button - ONLY for PENDING bookings */}
        {isPending && (
          <TouchableOpacity 
            style={styles.negotiateButton}
            onPress={() => navigation.navigate('Negociation', { bookingId: booking.id })}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
            <Text style={styles.negotiateButtonText}>Négocier le prix</Text>
          </TouchableOpacity>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi de la réservation</Text>
          <View style={styles.timelineContainer}>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.timelineStep}>
                <View style={styles.stepIndicatorContainer}>
                  <View style={[styles.stepCircle, step.completed && styles.stepCircleCompleted, step.current && styles.stepCircleCurrent]}>
                    {step.completed ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.stepNumber, step.current && styles.stepNumberCurrent]}>{step.id}</Text>
                    )}
                  </View>
                  {index !== steps.length - 1 && (
                    <View style={[styles.stepLine, step.completed && styles.stepLineCompleted]} />
                  )}
                </View>
                <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted, step.current && styles.stepTitleCurrent]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
          <View style={styles.actionsContainer}>
            {isPending && (
              <TouchableOpacity 
                style={styles.cancelAction} 
                onPress={cancelBooking}
                disabled={cancelling}
              >
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.cancelActionText}>
                  {cancelling ? 'Annulation...' : 'Annuler la réservation'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.outlineAction} onPress={reportNoShow}>
              <Ionicons name="flag-outline" size={20} color="#64748B" />
              <Text style={styles.outlineActionText}>Signaler un problème</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review Button for completed bookings */}
        {isCompleted && !booking.has_review && userRole === 'CLIENT' && (
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => navigation.navigate('Avis', { bookingId: booking.id })}
          >
            <Ionicons name="star-outline" size={20} color="#FFFFFF" />
            <Text style={styles.reviewButtonText}>Laisser un avis</Text>
          </TouchableOpacity>
        )}

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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#191C23', marginLeft: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  scrollContent: { padding: 24 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24, elevation: 2 },
  providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  providerAvatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F1F5F9' },
  providerInfo: { flex: 1, marginLeft: 16 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#191C23' },
  providerCategory: { fontSize: 14, color: '#64748B' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#191C23', marginLeft: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  phoneText: { fontSize: 13, fontWeight: '600', color: '#10B981', marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  detailTextContainer: { marginLeft: 10 },
  detailLabel: { fontSize: 12, color: '#94A3B8' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#191C23' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F7FF', padding: 16, borderRadius: 16 },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#1A73E8' },
  qrButton: { backgroundColor: '#1A73E8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, marginBottom: 16, elevation: 4 },
  qrButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 12 },
  scannerButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, marginBottom: 16, elevation: 4 },
  scannerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 12 },
  completeButton: { backgroundColor: '#8B5CF6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, marginBottom: 16, elevation: 4 },
  completeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 12 },
  negotiateButton: { backgroundColor: '#F97316', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 20, marginBottom: 16, elevation: 4 },
  negotiateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 12 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 20 },
  timelineContainer: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  stepIndicatorContainer: { alignItems: 'center', marginRight: 16 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepCircleCompleted: { backgroundColor: '#10B981' },
  stepCircleCurrent: { backgroundColor: '#1A73E8', borderWidth: 4, borderColor: '#E0EEFF' },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  stepNumberCurrent: { color: '#FFFFFF', fontSize: 10 },
  stepLine: { width: 2, height: 40, backgroundColor: '#F1F5F9', marginTop: -4 },
  stepLineCompleted: { backgroundColor: '#10B981' },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 4 },
  stepTitleCompleted: { color: '#10B981' },
  stepTitleCurrent: { color: '#1A73E8', fontWeight: '800' },
  actionsContainer: { gap: 12 },
  cancelAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  cancelActionText: { color: '#EF4444', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  outlineAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  outlineActionText: { color: '#64748B', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  reviewButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 16, marginTop: 16 },
  reviewButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  bottomSpacer: { height: 40 },
});

export default BookingDetailScreen;