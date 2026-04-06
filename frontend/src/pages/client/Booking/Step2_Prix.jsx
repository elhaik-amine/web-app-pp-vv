import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const BookingStep2Screen = ({ navigation }) => {
  const [proposedPrice, setProposedPrice] = useState('200');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#191C23" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle Réservation</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>Étape 2 de 4</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimation IA</Text>
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <View style={styles.aiIconBg}>
                  <MaterialCommunityIcons name="robot" size={24} color="#1A73E8" />
                </View>
                <View style={styles.aiHeaderText}>
                  <Text style={styles.aiTitle}>Fourchette estimée pour Plomberie</Text>
                  <Text style={styles.aiSubtitle}>Basé sur des milliers de réservations similaires</Text>
                </View>
              </View>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceRange}>150 MAD — 300 MAD</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre prix proposé</Text>
            <Text style={styles.inputLabel}>Proposez un prix (MAD)</Text>
            <View style={styles.priceInputWrapper}>
              <TextInput style={styles.priceInput} keyboardType="numeric" value={proposedPrice} onChangeText={setProposedPrice} placeholder="0" placeholderTextColor="#94A3B8" />
              <Text style={styles.currencyLabel}>MAD</Text>
            </View>
            <Text style={styles.helperText}>Le prestataire pourra négocier ce prix</Text>
          </View>

          <View style={styles.adviceCard}>
            <View style={styles.adviceIconBg}>
              <Ionicons name="bulb" size={20} color="#F97316" />
            </View>
            <Text style={styles.adviceText}>
              <Text style={styles.adviceHighlight}>Conseil: </Text>
              Proposez un prix dans la fourchette estimée pour plus de chances d'acceptation.
            </Text>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('Step3')}>
            <Text style={styles.continueButtonText}>Continuer →</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 16 },
  aiCard: { backgroundColor: '#F0F7FF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#D0E4FF' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  aiIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  aiHeaderText: { marginLeft: 12, flex: 1 },
  aiTitle: { fontSize: 14, fontWeight: '700', color: '#1A73E8', marginBottom: 2 },
  aiSubtitle: { fontSize: 11, color: '#64748B' },
  priceRangeContainer: { alignItems: 'center', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12 },
  priceRange: { fontSize: 22, fontWeight: '800', color: '#1A73E8' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 20, height: 64 },
  priceInput: { flex: 1, fontSize: 24, fontWeight: '700', color: '#191C23' },
  currencyLabel: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginLeft: 10 },
  helperText: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  adviceCard: { flexDirection: 'row', backgroundColor: '#FFF7ED', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FFEDD5' },
  adviceIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  adviceText: { flex: 1, fontSize: 13, color: '#9A3412', lineHeight: 20 },
  adviceHighlight: { fontWeight: '800' },
  bottomSpacer: { height: 100 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16, backgroundColor: '#FFFFFF' },
  continueButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default BookingStep2Screen;