import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookingStep1Screen = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([
    { id: '1', uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200&auto=format&fit=crop' },
    { id: '2', uri: 'https://images.unsplash.com/photo-1595467795924-279093847524?q=80&w=200&auto=format&fit=crop' },
  ]);

  const removePhoto = (id) => setPhotos(photos.filter(photo => photo.id !== id));

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
            <View style={[styles.progressBarFill, { width: '25%' }]} />
          </View>
          <Text style={styles.progressText}>Étape 1 de 4</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Décrivez votre problème</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                placeholder="Ex: Ma robinetterie fuit depuis 2 jours..."
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos du problème (2-5 photos)</Text>
            <TouchableOpacity style={styles.uploadZone}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="camera" size={32} color="#1A73E8" />
              </View>
              <Text style={styles.uploadText}>Appuyez pour ajouter des photos</Text>
            </TouchableOpacity>
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                  <TouchableOpacity style={styles.removeBadge} onPress={() => removePhoto(photo.id)}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <Text style={styles.noteText}>⚠️ Les photos ne peuvent pas être modifiées après soumission</Text>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('Step2')}>
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
  progressContainer: { paddingHorizontal: 24, marginBottom: 32 },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#1A73E8', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 16 },
  textAreaContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16 },
  textArea: { height: 120, fontSize: 16, color: '#191C23', lineHeight: 24 },
  uploadZone: { height: 140, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', marginBottom: 20 },
  uploadIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadText: { fontSize: 14, color: '#64748B' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  photoWrapper: { width: 80, height: 80, marginRight: 12, marginBottom: 12, position: 'relative' },
  thumbnail: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#F1F5F9' },
  removeBadge: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  noteText: { fontSize: 12, color: '#94A3B8', lineHeight: 18 },
  bottomSpacer: { height: 100 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  continueButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default BookingStep1Screen;