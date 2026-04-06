import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const filters = ['Tous', 'Mieux notés', 'Prix bas', 'Disponible'];

const providers = [
  { id: '1', name: 'Ahmed B.', specialty: 'Plombier Expert', rating: 4.9, reviews: 124, location: 'Casablanca, Maârif', price: 150, image: 'https://images.unsplash.com/photo-1540560717464-578bad5d138b?q=80&w=400&auto=format&fit=crop' },
  { id: '2', name: 'Karim L.', specialty: 'Plomberie & Chauffage', rating: 4.7, reviews: 86, location: 'Casablanca, Gauthier', price: 180, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
  { id: '3', name: 'Yassine M.', specialty: 'Installation Sanitaire', rating: 4.8, reviews: 52, location: 'Casablanca, Anfa', price: 160, image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop' },
  { id: '4', name: 'Omar S.', specialty: 'Dépannage Rapide', rating: 4.6, reviews: 41, location: 'Casablanca, Bourgogne', price: 140, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop' },
];

const ProviderListScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('Tous');

  const renderFilterChip = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
      onPress={() => setActiveFilter(item)}
    >
      <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderProviderCard = ({ item }) => (
    <TouchableOpacity style={styles.providerCard} onPress={() => navigation.navigate('ProviderProfile')}>
      <Image source={{ uri: item.image }} style={styles.providerImage} />
      <View style={styles.providerDetails}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.providerName}>{item.name}</Text>
            <Text style={styles.providerSpecialty}>{item.specialty}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFB300" />
            <Text style={styles.ratingValue}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.reviews})</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.priceLabel}>À partir de <Text style={styles.priceValue}>{item.price} MAD/h</Text></Text>
          <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('ProviderProfile')}>
            <Text style={styles.bookButtonText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plomberie</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="options-outline" size={24} color="#191C23" />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={providers}
        renderItem={renderProviderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#191C23' },
  iconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  filtersContainer: { marginBottom: 16 },
  filtersList: { paddingHorizontal: 24, paddingBottom: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F8FAFC', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  providerCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, overflow: 'hidden', elevation: 2 },
  providerImage: { width: '100%', height: 160, backgroundColor: '#F1F5F9' },
  providerDetails: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  providerSpecialty: { fontSize: 14, color: '#64748B' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingValue: { fontSize: 14, fontWeight: '700', color: '#191C23', marginLeft: 4 },
  reviewCount: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationText: { fontSize: 14, color: '#64748B', marginLeft: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  priceLabel: { fontSize: 13, color: '#64748B' },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#1A73E8' },
  bookButton: { backgroundColor: '#1A73E8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, elevation: 4 },
  bookButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

export default ProviderListScreen;