import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Image, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookingStep4Screen = ({ navigation, route }) => {
  const [submitting, setSubmitting] = useState(false);
  
  const { 
    providerId, 
    providerName, 
    description, 
    photos, 
    proposedPrice, 
    bookingDate, 
    timeSlot 
  } = route.params || {};
  
  const API_URL = 'http://192.168.1.10:5000/api';

  const handleConfirm = async () => {
    setSubmitting(true);
    
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const bookingData = {
        provider_id: providerId,
        booking_date: bookingDate,
        time_slot: timeSlot,
        agreed_price: proposedPrice,
        notes: description,
      };
      
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Succès', 
          'Votre réservation a été envoyée au prestataire!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Go back to HomeClient and clear the booking stack
                navigation.popToTop();
                navigation.navigate('HomeClient');
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de la réservation');
      }
    } catch (error) {
      console.log('Error creating booking:', error);
      Alert.alert('Erreur', 'Impossible de créer la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
              <MaterialCommunityIcons name="tools" size={20} color="#1A73E8" />
              <Text style={styles.detailLabel}>Service</Text>
            </View>
            <Text style={styles.detailValue}>Service à domicile</Text>
          </View>
          
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
              <Text style={styles.descriptionValue}>{description.substring(0, 50)}...</Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="clipboard-outline" size={20} color="#1A73E8" style={styles.infoIcon} />
          <Text style={styles.infoText}>Votre demande sera envoyée au prestataire. Il pourra accepter ou négocier le prix.</Text>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]} 
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmer la réservation ✓</Text>
          )}
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
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, marginBottom: 24 },
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
  detailValue: { fontSize: 14, fontWeight: '600', color: '#191C23', textAlign: 'right', maxWidth: '50%' },
  descriptionValue: { fontSize: 14, color: '#64748B', textAlign: 'right', maxWidth: '50%' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#1A73E8' },
  infoBox: { flexDirection: 'row', backgroundColor: '#F0F7FF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#D0E4FF' },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#1A73E8', lineHeight: 20 },
  bottomSpacer: { height: 120 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: 34, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  confirmButton: { backgroundColor: '#10B981', height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default BookingStep4Screen;