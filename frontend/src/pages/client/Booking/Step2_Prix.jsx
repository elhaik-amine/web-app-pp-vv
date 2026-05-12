import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookingStep2Screen = ({ navigation, route }) => {
  const [proposedPrice, setProposedPrice] = useState('200');
  const { providerId, providerName, description, photos } = route.params || {};

  const handleContinue = () => {
    const price = parseInt(proposedPrice);
    if (isNaN(price) || price < 50) {
      alert('Veuillez entrer un prix valide (minimum 50 MAD)');
      return;
    }
    
navigation.replace('Step3', { providerId, providerName, description, photos, proposedPrice });  };

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
            <Text style={styles.sectionTitle}>Votre prix proposé</Text>
            <Text style={styles.inputLabel}>Proposez un prix (MAD)</Text>
            <View style={styles.priceInputWrapper}>
              <TextInput 
                style={styles.priceInput} 
                keyboardType="numeric" 
                value={proposedPrice} 
                onChangeText={setProposedPrice} 
                placeholder="0" 
                placeholderTextColor="#94A3B8" 
              />
              <Text style={styles.currencyLabel}>MAD</Text>
            </View>
            <Text style={styles.helperText}>Le prestataire pourra négocier ce prix</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
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
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 20, height: 64 },
  priceInput: { flex: 1, fontSize: 24, fontWeight: '700', color: '#191C23' },
  currencyLabel: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginLeft: 10 },
  helperText: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  bottomSpacer: { height: 100 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default BookingStep2Screen;
