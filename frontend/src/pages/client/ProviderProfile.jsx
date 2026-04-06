import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, Dimensions, FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const availability = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const bookedDays = ['Mar', 'Ven'];

const reviews = [
  { id: '1', name: 'Karim M.', rating: 5, date: '12 Oct 2023', comment: 'Excellent travail ! Ahmed est très professionnel et a réglé ma fuite en un rien de temps.', avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100&auto=format&fit=crop' },
  { id: '2', name: 'Sara L.', rating: 4, date: '05 Oct 2023', comment: 'Très réactif et poli. Le prix était raisonnable par rapport à la qualité du service rendu.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' },
];

const ProviderProfileScreen = ({ navigation }) => {
  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{item.name}</Text>
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
        <View style={styles.reviewStars}>
          {[...Array(5)].map((_, i) => (
            <Ionicons key={i} name="star" size={12} color={i < item.rating ? '#FFB300' : '#E2E8F0'} />
          ))}
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header Photo */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1540560717464-578bad5d138b?q=80&w=800&auto=format&fit=crop' }} style={styles.headerImage} />
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#191C23" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="share-outline" size={24} color="#191C23" />
            </TouchableOpacity>
          </View>
          <View style={styles.nameCard}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName}>Ahmed B.</Text>
              <MaterialCommunityIcons name="check-decagram" size={20} color="#1A73E8" />
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.providerSpecialty}>Expert Plombier</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.9 ⭐</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>124</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3 ans</Text>
            <Text style={styles.statLabel}>Expérience</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.bioText}>Expert plombier certifié avec plus de 3 ans d'expérience. Disponible 7j/7 pour les urgences à Casablanca et environs.</Text>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilités</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.availabilityList}>
            {availability.map((day) => {
              const isBooked = bookedDays.includes(day);
              return (
                <View key={day} style={[styles.dayChip, isBooked ? styles.dayChipDisabled : styles.dayChipActive]}>
                  <Text style={[styles.dayText, isBooked ? styles.dayTextDisabled : styles.dayTextActive]}>{day}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avis Clients</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>Voir tout</Text></TouchableOpacity>
          </View>
          <FlatList data={reviews} renderItem={renderReview} keyExtractor={(item) => item.id} scrollEnabled={false} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <SafeAreaView style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>150 MAD<Text style={styles.priceUnit}>/h</Text></Text>
          <Text style={styles.priceLabel}>Prix indicatif</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('Step1')}>
          <Text style={styles.bookButtonText}>Réserver maintenant</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer: { height: width * 1.0, position: 'relative' },
  headerImage: { width: '100%', height: '100%' },
  headerOverlay: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  nameCard: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, elevation: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  providerName: { fontSize: 22, fontWeight: '800', color: '#191C23', marginRight: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginLeft: 8 },
  providerSpecialty: { fontSize: 14, color: '#64748B' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -12, marginBottom: 24 },
  statCard: { width: '30%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#94A3B8' },
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#191C23', marginBottom: 12 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  bioText: { fontSize: 15, color: '#64748B', lineHeight: 24 },
  availabilityList: { paddingVertical: 4 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1 },
  dayChipActive: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  dayChipDisabled: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  dayText: { fontSize: 14, fontWeight: '600' },
  dayTextActive: { color: '#64748B' },
  dayTextDisabled: { color: '#FFFFFF' },
  reviewCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewInfo: { flex: 1 },
  reviewName: { fontSize: 14, fontWeight: '700', color: '#191C23' },
  reviewDate: { fontSize: 12, color: '#94A3B8' },
  reviewStars: { flexDirection: 'row' },
  reviewComment: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  bottomSpacer: { height: 120 },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  priceContainer: { flex: 1 },
  priceValue: { fontSize: 20, fontWeight: '800', color: '#1A73E8' },
  priceUnit: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  priceLabel: { fontSize: 12, color: '#94A3B8' },
  bookButton: { backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, elevation: 4 },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default ProviderProfileScreen;