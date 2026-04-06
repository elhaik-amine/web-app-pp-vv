import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const AvisScreen = ({ navigation }) => {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');

  const getRatingText = () => {
    const texts = ['', 'Médiocre', 'Passable', 'Bien', 'Très bien', 'Excellent'];
    return `${rating}/5 — ${texts[rating]}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#191C23" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Laisser un Avis</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successBanner}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.successText}>Mission Complétée ! Merci d'évaluer Ahmed B.</Text>
          </View>

          <View style={styles.providerCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1540560717464-578bad5d138b?q=80&w=200&auto=format&fit=crop' }} style={styles.avatar} />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Ahmed B.</Text>
              <Text style={styles.providerCategory}>🔧 Plomberie</Text>
              <Text style={styles.dateText}>15 Oct 2023</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre note</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={40} color="#FFB300" style={styles.starIcon} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>{getRatingText()}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre commentaire</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                placeholder="Partagez votre expérience..."
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.rewardCard}>
            <View style={styles.rewardIconBg}>
              <MaterialCommunityIcons name="gift" size={24} color="#1A73E8" />
            </View>
            <View style={styles.rewardTextContainer}>
              <Text style={styles.rewardTitle}>Bonne nouvelle !</Text>
              <Text style={styles.rewardSubtitle}>
                Une note de 4 ou 5 étoiles offre <Text style={styles.rewardHighlight}>+0.5 token</Text> au prestataire.
              </Text>
            </View>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.publishButton} onPress={() => navigation.navigate('HomeClient')}>
            <Text style={styles.publishButtonText}>Publier l'avis ✓</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  placeholder: { width: 40 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 24 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  successText: { flex: 1, fontSize: 14, color: '#166534', fontWeight: '700' },
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 32, borderWidth: 1, borderColor: '#E2E8F0' },
  avatar: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F1F5F9' },
  providerInfo: { marginLeft: 16 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  providerCategory: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#94A3B8' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 16 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  starIcon: { marginHorizontal: 4 },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#FFB300' },
  textAreaContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16 },
  textArea: { height: 120, fontSize: 16, color: '#191C23', lineHeight: 24 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#D0E4FF' },
  rewardIconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 16, elevation: 2 },
  rewardTextContainer: { flex: 1 },
  rewardTitle: { fontSize: 15, fontWeight: '700', color: '#1A73E8', marginBottom: 2 },
  rewardSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  rewardHighlight: { fontWeight: '800', color: '#1A73E8' },
  bottomSpacer: { height: 120 },
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  publishButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  publishButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default AvisScreen;