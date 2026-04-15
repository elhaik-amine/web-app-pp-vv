import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, FlatList, Image,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProviderListScreen = ({ navigation, route }) => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tous');
  
  const { categoryId, categoryName, search, city } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const filters = ['Tous', 'Mieux notés'];

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      let url = `${API_URL}/providers`;
      
      const params = [];
      if (categoryId) params.push(`category_id=${categoryId}`);
      if (city) params.push(`city=${encodeURIComponent(city)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log('Fetching providers from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data);
        applyFilter(activeFilter, data.data);
      } else if (data.message === 'Not authorized, no token') {
        navigation.replace('Login');
      }
    } catch (error) {
      console.log('Error fetching providers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (filter, providerList = providers) => {
    let filtered = [...providerList];
    
    if (filter === 'Mieux notés') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    setFilteredProviders(filtered);
  };

  const handleFilterPress = (filter) => {
    setActiveFilter(filter);
    applyFilter(filter);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProviders();
  };

  const renderFilterChip = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
      onPress={() => handleFilterPress(item)}
    >
      <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderProviderCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.providerCard} 
      onPress={() => navigation.navigate('ProviderProfile', { providerId: item.id })}
    >
      <Image 
        source={{ uri: item.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
        style={styles.providerImage} 
      />
      <View style={styles.providerDetails}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.providerName}>{item.name}</Text>
            <Text style={styles.providerSpecialty}>{item.category_name || 'Prestataire'}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFB300" />
            <Text style={styles.ratingValue}>{item.rating || '4.5'}</Text>
            <Text style={styles.reviewCount}>({item.total_reviews || 0})</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.locationText}>{item.city || 'Maroc'}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.priceLabel}>
            À partir de <Text style={styles.priceValue}>150 MAD/h</Text>
          </Text>
          <TouchableOpacity 
            style={styles.bookButton} 
            onPress={() => navigation.navigate('ProviderProfile', { providerId: item.id })}
          >
            <Text style={styles.bookButtonText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#191C23" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>{categoryName || 'Prestataires'}</Text>
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

      {filteredProviders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Aucun prestataire trouvé</Text>
          <Text style={styles.emptyText}>
            {categoryName ? `Aucun prestataire dans la catégorie ${categoryName}` : 'Aucun prestataire disponible'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProviders}
          renderItem={renderProviderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#191C23', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  placeholder: { width: 40 },
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
