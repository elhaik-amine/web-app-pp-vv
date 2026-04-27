import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Linking, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_URL = process.env.EXPO_PUBLIC_CLOUDINARY_URL;
const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;

const BookingDetailScreen = ({ navigation, route }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [noShowReports, setNoShowReports] = useState([]);
  const [showNoShowForm, setShowNoShowForm] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  
  const { bookingId } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
        setCurrentUserId(user.id);
        if (user.role === 'PROVIDER') {
          fetchTokenBalance();
        }
      }
    } catch (error) {
      console.log('Error loading user role:', error);
    }
  };

  const fetchTokenBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/tokens/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTokenBalance(data.data.balance);
      }
    } catch (error) {
      console.log('Error fetching token balance:', error);
    }
  };

  const goBackOrFallback = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (userRole === 'PROVIDER') {
      navigation.navigate('ProviderDashboard');
      return;
    }

    navigation.navigate('MesReservations');
  };

  const uploadToCloudinary = async (uri) => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const ext = filename?.split('.').pop() || 'jpg';

    formData.append('file', { uri, name: filename || `evidence.${ext}`, type: `image/${ext}` });
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }

    return data.secure_url;
  };

  const takeEvidencePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès à la caméra pour prendre une preuve en temps réel.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setUploadingEvidence(true);
      const uploadedUrl = await uploadToCloudinary(result.assets[0].uri);
      setEvidencePhotoUrl(uploadedUrl);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de téléverser la preuve photo');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const fetchNoShowReports = async (providedToken = null) => {
    try {
      const token = providedToken || await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        const filteredReports = (data.data || []).filter(
          (report) => Number(report.booking_id) === Number(bookingId) && report.type === 'NOSHOW'
        );
        setNoShowReports(filteredReports);
      }
    } catch (error) {
      console.log('Error fetching no-show reports:', error);
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
        await fetchNoShowReports(token);
      } else {
        Alert.alert('Erreur', data.message || 'Réservation non trouvée');
        goBackOrFallback();
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
                goBackOrFallback();
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
    if (!reportDescription.trim() || reportDescription.trim().length < 10) {
      Alert.alert('Description requise', 'Ajoutez au moins 10 caractères pour expliquer ce qui s\'est passé.');
      return;
    }

    setSubmittingReport(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');

      const response = await fetch(`${API_URL}/bookings/${bookingId}/report-noshow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: reportDescription.trim(),
          evidence_photo_url: evidencePhotoUrl || null,
          evidence_captured_at: new Date(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Succès', data.message || 'Signalement envoyé');
        setShowNoShowForm(false);
        setReportDescription('');
        setEvidencePhotoUrl('');
        await fetchBookingDetails();
      } else {
        Alert.alert('Erreur', data.message || 'Impossible d\'envoyer le signalement');
      }
    } catch (error) {
      console.log('Error reporting:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getMeetingWindowEnd = () => {
    if (!booking) return null;
    if (booking.qr_active_until) return new Date(booking.qr_active_until);

    const date = new Date(booking.date_meeting);
    const timeSlotStarts = {
      '08:00-12:00': 8,
      '12:00-15:00': 12,
      '15:00-18:00': 15,
      '18:00-21:00': 18,
    };

    const startHour = timeSlotStarts[booking.time_slot] ?? 8;
    date.setHours(startHour + 3, 0, 0, 0);
    return date;
  };

  const getReportStatusMeta = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return { bg: '#FEF3C7', text: '#92400E', label: 'En attente de réponse' };
      case 'UNDER_ADMIN_REVIEW':
        return { bg: '#DBEAFE', text: '#1D4ED8', label: 'En revue admin' };
      case 'AUTO_RESOLVED':
        return { bg: '#DCFCE7', text: '#166534', label: 'Résolu automatiquement' };
      case 'RESOLVED':
        return { bg: '#DCFCE7', text: '#166534', label: 'Résolu' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejeté' };
      default:
        return { bg: '#E2E8F0', text: '#475569', label: status || 'Signalement' };
    }
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
          <TouchableOpacity style={styles.backButtonSmall} onPress={goBackOrFallback}>
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
  const latestNoShowReport = noShowReports[0] || null;
  const noShowStatus = latestNoShowReport ? getReportStatusMeta(latestNoShowReport.status) : null;
  const userHasReportedNoShow = noShowReports.some((report) => Number(report.reporter_id) === Number(currentUserId));
  const otherPartyReportedNoShow = noShowReports.some((report) => Number(report.reporter_id) !== Number(currentUserId));
  const meetingWindowEnd = getMeetingWindowEnd();
  const canReportNoShow = Boolean(
    booking.status === 'CONFIRMED' &&
    meetingWindowEnd &&
    new Date() > meetingWindowEnd &&
    !userHasReportedNoShow
  );
  const showNoShowSection = Boolean(latestNoShowReport || booking.status === 'CONFIRMED');
  const noShowUnavailableReason = (() => {
    if (userHasReportedNoShow) return 'Vous avez déjà envoyé un signalement pour cette réservation.';
    if (booking.status !== 'CONFIRMED') return "Le signalement d'absence est disponible uniquement sur une réservation confirmée.";
    if (meetingWindowEnd && new Date() <= meetingWindowEnd) {
      return `Vous pourrez signaler une absence après la fin du créneau : ${meetingWindowEnd.toLocaleString('fr-FR')}.`;
    }
    return null;
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBackOrFallback}>
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
              source={{ uri: userRole === 'PROVIDER' ? (booking.client_avatar || 'https://i.sstatic.net/l60Hf.png') : (booking.provider_avatar || 'https://randomuser.me/api/portraits/men/32.jpg') }} 
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
                <Text style={styles.detailValue}>{formatDate(booking.date_meeting)}</Text>
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
            onPress={() => {
              if (userRole === 'PROVIDER' && tokenBalance < 1) {
                Alert.alert('Solde insuffisant', "Vous n'avez pas assez de tokens pour négocier. Veuillez recharger votre compte.");
              } else {
                navigation.navigate('Negociation', { bookingId: booking.id });
              }
            }}
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

        {showNoShowSection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Absence et litige</Text>

            {latestNoShowReport && noShowStatus && (
              <View style={styles.disputeCard}>
                <View style={styles.disputeHeader}>
                  <Text style={styles.disputeTitle}>Signalement d'absence</Text>
                  <View style={[styles.disputeBadge, { backgroundColor: noShowStatus.bg }]}>
                    <Text style={[styles.disputeBadgeText, { color: noShowStatus.text }]}>
                      {noShowStatus.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.disputeText}>
                  {Number(latestNoShowReport.reporter_id) === Number(currentUserId)
                    ? 'Votre signalement a bien été enregistré.'
                    : 'L\'autre partie a signalé votre absence.'}
                </Text>

                {!!latestNoShowReport.description && (
                  <Text style={styles.disputeDescription}>{latestNoShowReport.description}</Text>
                )}

                {!!latestNoShowReport.response_deadline && latestNoShowReport.status === 'PENDING_REVIEW' && (
                  <Text style={styles.disputeMeta}>
                    Date limite de réponse : {new Date(latestNoShowReport.response_deadline).toLocaleString('fr-FR')}
                  </Text>
                )}

                {!!latestNoShowReport.evidence_photo_url && (
                  <Image source={{ uri: latestNoShowReport.evidence_photo_url }} style={styles.disputeImage} />
                )}
              </View>
            )}

            {canReportNoShow && (showNoShowForm || otherPartyReportedNoShow) && (
              <View style={styles.disputeFormCard}>
                <Text style={styles.disputeFormTitle}>
                  {otherPartyReportedNoShow ? 'Répondre avec un contre-signalement' : 'Signaler une absence'}
                </Text>
                <Text style={styles.disputeHint}>
                  Cette action n'est possible qu'après la fin du créneau. Ajoutez une explication claire et, si possible, une photo.
                </Text>

                <TextInput
                  style={styles.textArea}
                  multiline
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  placeholder="Expliquez ce qui s'est passé, quand vous êtes arrivé(e), et pourquoi vous estimez que l'autre partie était absente."
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.evidenceButton}
                  onPress={takeEvidencePhoto}
                  disabled={uploadingEvidence}
                >
                  <Ionicons name="camera-outline" size={18} color="#1A73E8" />
                  <Text style={styles.evidenceButtonText}>
                    {uploadingEvidence ? 'Téléversement...' : evidencePhotoUrl ? 'Photo temps réel ajoutée' : 'Prendre une photo preuve'}
                  </Text>
                </TouchableOpacity>

                {!!evidencePhotoUrl && (
                  <Image source={{ uri: evidencePhotoUrl }} style={styles.evidencePreview} />
                )}

                <View style={styles.disputeActions}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      setShowNoShowForm(false);
                      setReportDescription('');
                      setEvidencePhotoUrl('');
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, submittingReport && styles.disabledButton]}
                    onPress={reportNoShow}
                    disabled={submittingReport}
                  >
                    <Text style={styles.primaryButtonText}>
                      {submittingReport ? 'Envoi...' : otherPartyReportedNoShow ? 'Envoyer ma réponse' : 'Envoyer le signalement'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!latestNoShowReport && !showNoShowForm && noShowUnavailableReason && (
              <View style={styles.disputeCard}>
                <Text style={styles.disputeTitle}>Signaler une absence</Text>
                <Text style={styles.disputeText}>{noShowUnavailableReason}</Text>
              </View>
            )}

            {canReportNoShow && !showNoShowForm && !otherPartyReportedNoShow && (
              <TouchableOpacity style={styles.outlineAction} onPress={() => setShowNoShowForm(true)}>
                <Ionicons name="flag-outline" size={20} color="#64748B" />
                <Text style={styles.outlineActionText}>Signaler une absence</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
  disputeCard: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 18, padding: 16, marginBottom: 16 },
  disputeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  disputeTitle: { fontSize: 15, fontWeight: '700', color: '#191C23', flex: 1, marginRight: 12 },
  disputeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  disputeBadgeText: { fontSize: 12, fontWeight: '700' },
  disputeText: { fontSize: 14, color: '#7C2D12', marginBottom: 8 },
  disputeDescription: { fontSize: 14, color: '#431407', lineHeight: 20, marginBottom: 10 },
  disputeMeta: { fontSize: 12, color: '#9A3412', marginBottom: 10 },
  disputeImage: { width: '100%', height: 160, borderRadius: 14, backgroundColor: '#FED7AA' },
  disputeFormCard: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, padding: 16 },
  disputeFormTitle: { fontSize: 15, fontWeight: '700', color: '#191C23', marginBottom: 6 },
  disputeHint: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 14 },
  textArea: { minHeight: 120, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, backgroundColor: '#FFFFFF', padding: 14, fontSize: 14, color: '#191C23', marginBottom: 12 },
  evidenceButton: { height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  evidenceButtonText: { marginLeft: 8, color: '#1A73E8', fontSize: 14, fontWeight: '600' },
  evidencePreview: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12, backgroundColor: '#E2E8F0' },
  disputeActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  secondaryButtonText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  primaryButton: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A73E8' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
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
