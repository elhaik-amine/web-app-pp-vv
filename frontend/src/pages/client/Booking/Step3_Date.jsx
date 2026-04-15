import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Dimensions, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const timeSlots = [
  { id: '1', time: '08:00-12:00', period: 'Matin' },
  { id: '2', time: '12:00-15:00', period: 'Midi' },
  { id: '3', time: '15:00-18:00', period: 'Après-midi' },
  { id: '4', time: '18:00-21:00', period: 'Soir' },
];

const BookingStep3Screen = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { providerId, providerName, description, photos, proposedPrice } = route.params || {};
  const API_URL = 'http://192.168.1.10:5000/api';

  // Generate next 30 days
  const getDaysArray = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isPast: false,
      });
    }
    return days;
  };

  const [daysInMonth, setDaysInMonth] = useState(getDaysArray());
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const checkAvailability = async (date, slot) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const formattedDate = date.toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/bookings/slots?provider_id=${providerId}&date=${formattedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (data.success) {
        const isAvailable = !data.data.taken.includes(slot.time);
        if (!isAvailable) {
          Alert.alert('Indisponible', 'Ce créneau est déjà réservé');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.log('Error checking availability:', error);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau horaire');
      return;
    }
    
    const isAvailable = await checkAvailability(selectedDate, selectedSlot);
    if (isAvailable) {
     navigation.replace('Step4', { 
  providerId, 
  providerName, 
  description, 
  photos, 
  proposedPrice,
  bookingDate: selectedDate.toISOString().split('T')[0],
  timeSlot: selectedSlot.time,
});
    }
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
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
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>
        <Text style={styles.progressText}>Étape 3 de 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choisissez une date</Text>
            <Text style={styles.monthText}>{formatMonth(currentMonth)}</Text>
          </View>
          
          <View style={styles.calendarContainer}>
            <View style={styles.weekRow}>
              {weekDays.map(day => <Text key={day} style={styles.weekDayText}>{day}</Text>)}
            </View>
            <View style={styles.daysGrid}>
              {daysInMonth.map((day, index) => {
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                return (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => setSelectedDate(day.date)}
                    style={[styles.dayButton, isSelected && styles.dayButtonActive]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{day.day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisissez un créneau horaire</Text>
          <FlatList 
            data={timeSlots} 
            renderItem={({ item }) => {
              const isSelected = selectedSlot?.id === item.id;
              return (
                <TouchableOpacity 
                  style={[styles.slotCard, isSelected && styles.slotCardActive]} 
                  onPress={() => setSelectedSlot(item)}>
                  <Text style={[styles.slotTime, isSelected && styles.slotTextActive]}>{item.time}</Text>
                  <Text style={[styles.slotPeriod, isSelected && styles.slotTextActive]}>{item.period}</Text>
                  {isSelected && <View style={styles.slotCheck}><Ionicons name="checkmark-circle" size={18} color="#FFFFFF" /></View>}
                </TouchableOpacity>
              );
            }} 
            keyExtractor={(item) => item.id} 
            numColumns={2} 
            scrollEnabled={false} 
            columnWrapperStyle={styles.slotRow} 
          />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.continueButtonText}>Continuer →</Text>}
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
  progressText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 24 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  monthText: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  calendarContainer: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekDayText: { width: (width - 112) / 7, textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayButton: { width: (width - 112) / 7, height: 44, alignItems: 'center', justifyContent: 'center', marginVertical: 4, borderRadius: 12 },
  dayButtonActive: { backgroundColor: '#1A73E8', elevation: 4 },
  dayText: { fontSize: 14, fontWeight: '600', color: '#191C23' },
  dayTextActive: { color: '#FFFFFF', fontWeight: '800' },
  slotRow: { justifyContent: 'space-between' },
  slotCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  slotCardActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8', elevation: 4 },
  slotTime: { fontSize: 14, fontWeight: '700', color: '#191C23', marginBottom: 4 },
  slotPeriod: { fontSize: 12, color: '#64748B' },
  slotTextActive: { color: '#FFFFFF' },
  slotCheck: { position: 'absolute', top: 12, right: 12 },
  bottomSpacer: { height: 100 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: 34, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default BookingStep3Screen;