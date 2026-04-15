import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, Image, FlatList,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import tab screens
import ProviderListScreen from './ProviderList';
import MesReservationsScreen from './MesReservations';
import ProfilScreen from './Profil';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    loadUserData();
    fetchCategories();
    fetchProviders();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('khidmati_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name.split(' ')[0]);
      }
    } catch (error) {
      console.log('Error loading user:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const iconMap = {
          'Plomberie': 'pipe-wrench',
          'Électricité': 'lightning-bolt',
          'Ménage': 'broom',
          'Jardinage': 'leaf',
          'Climatisation': 'snowflake',
          'Peinture': 'brush',
          'Menuiserie': 'hammer-wrench',
          'Plâtrerie': 'wall',
        };
        
        const colorMap = {
          'Plomberie': '#E3F2FD',
          'Électricité': '#FFF3E0',
          'Ménage': '#E8F5E9',
          'Jardinage': '#F3E5F5',
          'Climatisation': '#E0F7FA',
          'Peinture': '#FCE4EC',
          'Menuiserie': '#FFF8E1',
          'Plâtrerie': '#EFEBE9',
        };
        
        const formattedCategories = data.data.slice(0, 6).map(cat => ({
          id: cat.id.toString(),
          name: cat.name,
          icon: iconMap[cat.name] || 'tools',
          color: colorMap[cat.name] || '#F8FAFC',
        }));
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.log('Error fetching categories:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/providers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProviders(data.data.slice(0, 3));
      }
    } catch (error) {
      console.log('Error fetching providers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
    fetchProviders();
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard} 
      onPress={() => navigation.navigate('ProviderList', { categoryId: item.id, categoryName: item.name })}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
        <MaterialCommunityIcons name={item.icon} size={28} color="#1A73E8" />
      </View>
      <Text style={styles.categoryLabel}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProvider = ({ item }) => (
    <TouchableOpacity 
      style={styles.providerCard} 
      onPress={() => navigation.navigate('ProviderProfile', { providerId: item.id })}
    >
      <Image 
        source={{ uri: item.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
        style={styles.providerImage} 
      />
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{item.name}</Text>
        <Text style={styles.providerSpecialty}>{item.category_name || 'Prestataire'}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFB300" />
          <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
          <Text style={styles.reviewsText}>({item.total_reviews || 0} avis)</Text>
        </View>
        <Text style={styles.priceText}>
          À partir de <Text style={styles.priceValue}>{item.min_price || 150} MAD/h</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHomeContent = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Bonjour</Text>
            <Text style={styles.userName}>{userName || 'Karim'} 🎉</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#191C23" />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#64748B" />
          <TextInput 
            placeholder="Rechercher un service..." 
            style={styles.searchInput} 
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => navigation.navigate('ProviderList', { search: searchQuery })}
          />
        </View>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Besoin d'aide urgente ?</Text>
        <Text style={styles.heroSubtitle}>On vous trouve un pro en moins de 30 minutes.</Text>
        <TouchableOpacity style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Appeler Khdimati</Text>
          <Ionicons name="call-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Nos Services</Text>
            <Text style={styles.sectionSubtitle}>Trouvez le professionnel idéal pour vos besoins</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProviderList')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={styles.categoryRow}
        />
      </View>

      {/* Popular Providers */}
      {providers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Prestataires Populaires</Text>
              <Text style={styles.sectionSubtitle}>Recommandés par la communauté</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderList')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={providers}
            renderItem={renderProvider}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providersList}
          />
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'search':
        return <ProviderListScreen navigation={navigation} route={{ params: {} }} />;
      case 'bookings':
        return <MesReservationsScreen navigation={navigation} route={{ params: {} }} />;
      case 'profile':
        return <ProfilScreen navigation={navigation} route={{ params: {} }} />;
      default:
        return renderHomeContent();
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
      
      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]} 
          onPress={() => setActiveTab('home')}
        >
          <Ionicons name={activeTab === 'home' ? 'home' : 'home-outline'} size={24} color={activeTab === 'home' ? '#1A73E8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'search' && styles.tabItemActive]} 
          onPress={() => setActiveTab('search')}
        >
          <Ionicons name={activeTab === 'search' ? 'search' : 'search-outline'} size={24} color={activeTab === 'search' ? '#1A73E8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'search' && styles.tabLabelActive]}>Recherche</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'bookings' && styles.tabItemActive]} 
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons name={activeTab === 'bookings' ? 'calendar' : 'calendar-outline'} size={24} color={activeTab === 'bookings' ? '#1A73E8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'bookings' && styles.tabLabelActive]}>Réservations</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]} 
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons name={activeTab === 'profile' ? 'person' : 'person-outline'} size={24} color={activeTab === 'profile' ? '#1A73E8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 14, color: '#64748B' },
  userName: { fontSize: 24, fontWeight: '800', color: '#191C23', marginTop: 4 },
  notificationBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  unreadDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  searchContainer: { paddingHorizontal: 24, marginBottom: 24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, height: 56, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#191C23' },
  heroBanner: { marginHorizontal: 24, marginBottom: 32, backgroundColor: '#1A73E8', borderRadius: 20, padding: 20, elevation: 4 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 16 },
  heroButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' },
  heroButtonText: { fontSize: 14, fontWeight: '700', color: '#1A73E8', marginRight: 8 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#191C23' },
  sectionSubtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  categoryRow: { justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
  categoryCard: { width: '30%', alignItems: 'center' },
  categoryIconContainer: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  providersList: { paddingLeft: 24, paddingRight: 8 },
  providerCard: { width: 200, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 16, overflow: 'hidden', elevation: 3 },
  providerImage: { width: '100%', height: 120, backgroundColor: '#F1F5F9' },
  providerInfo: { padding: 12 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  providerSpecialty: { fontSize: 12, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#191C23', marginLeft: 4, marginRight: 4 },
  reviewsText: { fontSize: 12, color: '#94A3B8' },
  priceText: { fontSize: 12, color: '#64748B' },
  priceValue: { fontSize: 14, fontWeight: '700', color: '#1A73E8' },
  bottomSpacer: { height: 80 },
  // Bottom Tab Bar Styles
  bottomTabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: { 
    color: '#1A73E8',
    fontWeight: '600',
  },
});

export default HomeScreen;