import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Dimensions, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TIME_SLOTS = [
  { id: '1', time: '08:00-12:00', period: 'Matin' },
  { id: '2', time: '12:00-15:00', period: 'Midi' },
  { id: '3', time: '15:00-18:00', period: 'Après-midi' },
  { id: '4', time: '18:00-21:00', period: 'Soir' },
];

// Build YYYY-MM-DD from local clock (avoids toISOString UTC off-by-one)
const pad = (n) => String(n).padStart(2, '0');
const toLocalDateString = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const BookingStep3Screen = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [weekAvailability, setWeekAvailability] = useState([]); // from API
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [daysInMonth, setDaysInMonth] = useState([]);

  const { providerId, providerName, description, photos, proposedPrice } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Generate next 60 days from today using LOCAL time
  const generateDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isPast: false,
        dateString: toLocalDateString(date), // ← local time, no UTC shift
      });
    }
    return days;
  };

  useEffect(() => {
    setDaysInMonth(generateDays());
    fetchWeekAvailability();
  }, []);

  // Fetch next-7-days availability from our endpoint
  const fetchWeekAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/providers/${providerId}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWeekAvailability(data.week); // array of { date, day_name, slots[] }
      }
    } catch (err) {
      console.log('Availability fetch error:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Returns 'BOOKED' | 'AVAILABLE' | null (not in 7-day window)
  const getSlotStatus = (dateString, slotTime) => {
    const dayData = weekAvailability.find((d) => d.date === dateString);
    if (!dayData) return null; // beyond 7-day window — let server decide
    const slot = dayData.slots.find((s) => s.time_slot === slotTime);
    return slot ? slot.availability : null;
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

    const dateStr = toLocalDateString(selectedDate);
    const status = getSlotStatus(dateStr, selectedSlot.time);

    if (status === 'BOOKED') {
      Alert.alert(
        'Créneau indisponible',
        'Ce prestataire est déjà réservé sur ce créneau. Veuillez choisir une autre date ou un autre créneau.',
      );
      return;
    }

    // status === null means beyond 7-day window — allow through, DB enforces uniqueness
    navigation.replace('Step4', {
      providerId,
      providerName,
      description,
      photos,
      proposedPrice,
      bookingDate: dateStr,
      timeSlot: selectedSlot.time,
    });
  };

  const formatMonth = (date) =>
    date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const isDateDisabled = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day.date < today;
  };

  // Check if every slot on a date is BOOKED (to dim the date cell)
  const isDateFullyBooked = (dateString) => {
    const dayData = weekAvailability.find((d) => d.date === dateString);
    if (!dayData) return false;
    return dayData.slots.every((s) => s.availability === 'BOOKED');
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
            {loadingAvailability && <ActivityIndicator size="small" color="#1A73E8" />}
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.weekRow}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {daysInMonth.map((day, index) => {
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                const isDisabled = isDateDisabled(day);
                const fullyBooked = isDateFullyBooked(day.dateString);
                const dayOfWeek = day.date.getDay();
                const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const marginLeft = index === 0 ? adjustedDayOfWeek * (width / 7) : 0;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => !isDisabled && setSelectedDate(day.date)}
                    disabled={isDisabled}
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonActive,
                      { marginLeft },
                      (isDisabled || fullyBooked) && styles.dayButtonDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.dayTextActive,
                      (isDisabled || fullyBooked) && styles.dayTextDisabled,
                    ]}>
                      {day.day}
                    </Text>
                    {fullyBooked && !isDisabled && (
                      <View style={styles.bookedDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choisissez un créneau horaire</Text>
            <FlatList
              data={TIME_SLOTS}
              renderItem={({ item }) => {
                const isSelected = selectedSlot?.id === item.id;
                const dateStr = toLocalDateString(selectedDate);
                const status = getSlotStatus(dateStr, item.time);
                const isBooked = status === 'BOOKED';

                return (
                  <TouchableOpacity
                    style={[
                      styles.slotCard,
                      isSelected && styles.slotCardActive,
                      isBooked && styles.slotCardBooked,
                    ]}
                    onPress={() => {
                      if (isBooked) {
                        Alert.alert('Créneau indisponible', 'Ce créneau est déjà réservé.');
                        return;
                      }
                      setSelectedSlot(item);
                    }}
                    disabled={isBooked}
                  >
                    <Text style={[
                      styles.slotTime,
                      isSelected && styles.slotTextActive,
                      isBooked && styles.slotTextBooked,
                    ]}>
                      {item.time}
                    </Text>
                    <Text style={[
                      styles.slotPeriod,
                      isSelected && styles.slotTextActive,
                      isBooked && styles.slotTextBooked,
                    ]}>
                      {isBooked ? '🔒 Réservé' : item.period}
                    </Text>
                    {isSelected && (
                      <View style={styles.slotCheck}>
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.slotRow}
            />
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.continueButtonText}>Continuer →</Text>
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
  progressText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 24 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  calendarContainer: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekDayText: { width: (width - 112) / 7, textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayButton: { width: (width - 112) / 7, height: 44, alignItems: 'center', justifyContent: 'center', marginVertical: 4, borderRadius: 12 },
  dayButtonActive: { backgroundColor: '#1A73E8', elevation: 4 },
  dayButtonDisabled: { opacity: 0.3 },
  dayText: { fontSize: 14, fontWeight: '600', color: '#191C23' },
  dayTextActive: { color: '#FFFFFF', fontWeight: '800' },
  dayTextDisabled: { color: '#94A3B8' },
  bookedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#EF4444', marginTop: 2 },
  slotRow: { justifyContent: 'space-between' },
  slotCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  slotCardActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8', elevation: 4 },
  slotCardBooked: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9', opacity: 0.6 },
  slotTime: { fontSize: 14, fontWeight: '700', color: '#191C23', marginBottom: 4 },
  slotPeriod: { fontSize: 12, color: '#64748B' },
  slotTextActive: { color: '#FFFFFF' },
  slotTextBooked: { color: '#94A3B8' },
  slotCheck: { position: 'absolute', top: 12, right: 12 },
  bottomSpacer: { height: 100 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: 34, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default BookingStep3Screen;