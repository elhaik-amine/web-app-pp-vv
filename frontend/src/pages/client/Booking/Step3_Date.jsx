import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Dimensions, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const timeSlots = [
  { id: '1', time: '08:00 - 12:00', period: 'Matin' },
  { id: '2', time: '12:00 - 15:00', period: 'Midi' },
  { id: '3', time: '15:00 - 18:00', period: 'Après-midi' },
  { id: '4', time: '18:00 - 21:00', period: 'Soir' },
];

const BookingStep3Screen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(15);
  const [selectedSlot, setSelectedSlot] = useState('2');
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const renderTimeSlot = ({ item }) => {
    const isSelected = selectedSlot === item.id;
    return (
      <TouchableOpacity style={[styles.slotCard, isSelected && styles.slotCardActive]} onPress={() => setSelectedSlot(item.id)}>
        <Text style={[styles.slotTime, isSelected && styles.slotTextActive]}>{item.time}</Text>
        <Text style={[styles.slotPeriod, isSelected && styles.slotTextActive]}>{item.period}</Text>
        {isSelected && <View style={styles.slotCheck}><Ionicons name="checkmark-circle" size={18} color="#FFFFFF" /></View>}
      </TouchableOpacity>
    );
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
            <TouchableOpacity style={styles.monthSelector}>
              <Text style={styles.monthText}>Octobre 2023</Text>
              <Ionicons name="chevron-down" size={16} color="#1A73E8" />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarContainer}>
            <View style={styles.weekRow}>
              {weekDays.map(day => <Text key={day} style={styles.weekDayText}>{day}</Text>)}
            </View>
            <View style={styles.daysGrid}>
              {daysInMonth.map(day => {
                const isSelected = selectedDate === day;
                const isPast = day < 12;
                return (
                  <TouchableOpacity key={day} disabled={isPast} onPress={() => setSelectedDate(day)}
                    style={[styles.dayButton, isSelected && styles.dayButtonActive, isPast && styles.dayButtonDisabled]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextActive, isPast && styles.dayTextDisabled]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisissez un créneau horaire</Text>
          <FlatList data={timeSlots} renderItem={renderTimeSlot} keyExtractor={(item) => item.id} numColumns={2} scrollEnabled={false} columnWrapperStyle={styles.slotRow} />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('Step4')}>
          <Text style={styles.continueButtonText}>Continuer →</Text>
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
  monthSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  monthText: { fontSize: 13, fontWeight: '700', color: '#1A73E8', marginRight: 4 },
  calendarContainer: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekDayText: { width: (width - 112) / 7, textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayButton: { width: (width - 112) / 7, height: 44, alignItems: 'center', justifyContent: 'center', marginVertical: 4, borderRadius: 12 },
  dayButtonActive: { backgroundColor: '#1A73E8', elevation: 4 },
  dayButtonDisabled: { opacity: 0.3 },
  dayText: { fontSize: 14, fontWeight: '600', color: '#191C23' },
  dayTextActive: { color: '#FFFFFF', fontWeight: '800' },
  dayTextDisabled: { color: '#94A3B8' },
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