import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [availableDays, setAvailableDays] = useState([]);
  const [availableSlotsForDate, setAvailableSlotsForDate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [days, setDays] = useState([]);

  const { providerId, providerName, description, photos, proposedPrice } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // Generate next 7 days starting from today
  const generateDays = () => {
    const nextDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      nextDays.push({
        id: i,
        date,
        dayNumber: date.getDate(),
        dayName: dayNames[date.getDay()],
        dateString: toLocalDateString(date),
        isPast: date < today,
      });
    }
    return nextDays;
  };

  useEffect(() => {
    setDays(generateDays());
    fetchProviderAvailability();
  }, []);

  const fetchProviderAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/providers/${providerId}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const availableDays = data.data
          .filter((d) => d.is_available)
          .map((d) => Number(d.day_of_week));
        setAvailableDays(availableDays);
      }
    } catch (err) {
      console.log('Availability fetch error:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const toDayOfWeek = (date) => {
    const jsDay = date.getDay(); // 0=Sun ... 6=Sat
    return jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun
  };

  // Day mapping: 1=Monday, 2=Tuesday, ..., 7=Sunday
  const isDateAvailable = (date) => {
    const mappedDay = toDayOfWeek(date);
    return availableDays.includes(mappedDay);
  };

  const fetchAvailableSlots = async (dateValue) => {
    setLoadingSlots(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const dateString = toLocalDateString(dateValue);
      const response = await fetch(
        `${API_URL}/bookings/slots?provider_id=${providerId}&date=${dateString}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (data.success && data.data) {
        setAvailableSlotsForDate(data.data.available || []);
        if (selectedSlot && !data.data.available?.includes(selectedSlot.time)) {
          setSelectedSlot(null);
        }
      }
    } catch (err) {
      console.log('Slots fetch error:', err);
      setAvailableSlotsForDate([]);
    } finally {
      setLoadingSlots(false);
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

    const dateDayOfWeek = toDayOfWeek(selectedDate);
    if (!availableDays.includes(dateDayOfWeek)) {
      Alert.alert('Date indisponible', 'Ce prestataire n’est pas disponible ce jour.');
      return;
    }

    const dateStr = toLocalDateString(selectedDate);

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

  const isDateDisabled = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day.isPast || day.date < today;
  };

  const isDateUnavailable = (day) => !isDateAvailable(day.date);

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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
            {days.map((day) => {
              const isSelected = selectedDate?.toDateString() === day.date.toDateString();
              const isUnavailable = isDateUnavailable(day);
              const isDisabled = isDateDisabled(day) || isUnavailable;

              return (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayCard,
                    isSelected && styles.dayCardActive,
                    isDisabled && styles.dayCardDisabled,
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    setSelectedDate(day.date);
                    setSelectedSlot(null);
                    fetchAvailableSlots(day.date);
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberActive,
                  ]}>
                    {day.dayNumber}
                  </Text>
                  <Text style={[
                    styles.dayName,
                    isSelected && styles.dayNameActive,
                  ]}>
                    {day.dayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choisissez un créneau horaire</Text>
            {loadingSlots && <ActivityIndicator size="small" color="#1A73E8" style={{ marginBottom: 12 }} />}
            <FlatList
              data={TIME_SLOTS}
              renderItem={({ item }) => {
                const isSelected = selectedSlot?.id === item.id;
                const isAvailableSlot = availableSlotsForDate.includes(item.time);
                const isDisabledSlot = !isAvailableSlot;

                return (
                  <TouchableOpacity
                    style={[
                      styles.slotCard,
                      isSelected && styles.slotCardActive,
                      isDisabledSlot && styles.slotCardBooked,
                    ]}
                    onPress={() => {
                      if (!isAvailableSlot) {
                        Alert.alert('Créneau indisponible', 'Ce créneau est déjà réservé.');
                        return;
                      }
                      setSelectedSlot(item);
                    }}
                    disabled={isDisabledSlot}
                  >
                    <Text style={[
                      styles.slotTime,
                      isSelected && styles.slotTextActive,
                      isDisabledSlot && styles.slotTextBooked,
                    ]}>
                      {item.time}
                    </Text>
                    <Text style={[
                      styles.slotPeriod,
                      isSelected && styles.slotTextActive,
                      isDisabledSlot && styles.slotTextBooked,
                    ]}>
                      {isDisabledSlot ? '🔒 Indisponible' : item.period}
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
  daysScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dayCard: {
    width: 60,
    height: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayCardActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  dayCardDisabled: {
    opacity: 0.4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191C23',
    marginBottom: 4,
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  dayName: {
    fontSize: 14,
    color: '#64748B',
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
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
