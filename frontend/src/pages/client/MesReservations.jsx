import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, FlatList, StatusBar,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const filters = ['Toutes', 'En cours', 'Complétées', 'Annulées'];

const getStatusStyles = (status) => {
  switch (status) {
    case 'CONFIRMED': return { bg: '#DCFCE7', text: '#166534', label: 'CONFIRMÉ', icon: 'checkmark-circle' };
    case 'PENDING': return { bg: '#EFF6FF', text: '#1E40AF', label: 'EN ATTENTE', icon: 'time-outline' };
    case 'IN_PROGRESS': return { bg: '#FFF7ED', text: '#9A3412', label: 'EN COURS', icon: 'construct-outline' };
    case 'COMPLETED': return { bg: '#F0FDF4', text: '#15803d', label: 'TERMINÉ', icon: 'checkmark-done-circle' };
    case 'CANCELLED': return { bg: '#FEF2F2', text: '#991B1B', label: 'ANNULÉ', icon: 'close-circle' };
    default: return { bg: '#F1F5F9', text: '#475569', label: status, icon: 'help-circle' };
  }
};

const getCategoryIcon = (categoryName) => {
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
  return iconMap[categoryName] || 'tools';
};

const MesReservationsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Toutes');
  const [userRole, setUserRole] = useState('');

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    loadUserRole();
    fetchBookings();
  }, []);

  const loadUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('khidmati_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    } catch (error) {
      console.log('Error loading user role:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const userData = await AsyncStorage.getItem('khidmati_user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      const response = await fetch(`${API_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Bookings response:', data);
      
      if (data.success) {
        let filteredData = data.data;
        
        // Privacy filter: only show relevant bookings based on role
        if (user?.role === 'PROVIDER') {
          // Provider sees bookings where THEY are the provider
          filteredData = data.data.filter(b => b.provider_id === user.id);
        } else if (user?.role === 'CLIENT') {
          // Client sees bookings where THEY are the client
          filteredData = data.data.filter(b => b.client_id === user.id);
        }
        
        setBookings(filteredData);
        applyFilter(activeFilter, filteredData);
      }
    } catch (error) {
      console.log('Error fetching bookings:', error);
      Alert.alert('Erreur', 'Impossible de charger vos réservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (filter, bookingList = bookings) => {
    let filtered = [...bookingList];
    
    switch (filter) {
      case 'En cours':
        filtered = filtered.filter(b => b.status === 'IN_PROGRESS' || b.status === 'CONFIRMED');
        break;
      case 'Complétées':
        filtered = filtered.filter(b => b.status === 'COMPLETED');
        break;
      case 'Annulées':
        filtered = filtered.filter(b => b.status === 'CANCELLED');
        break;
      default:
        break;
    }
    
    setFilteredBookings(filtered);
  };

  const handleFilterPress = (filter) => {
    setActiveFilter(filter);
    applyFilter(filter);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const cancelBooking = async (bookingId) => {
    Alert.alert(
      'Annuler la réservation',
      'Voulez-vous vraiment annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              
              const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Succès', 'Réservation annulée');
                fetchBookings();
              } else {
                Alert.alert('Erreur', data.message || 'Erreur lors de l\'annulation');
              }
            } catch (error) {
              console.log('Error cancelling booking:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la réservation');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
      onPress={() => handleFilterPress(item)}
    >
      <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderBookingCard = ({ item }) => {
    const statusStyle = getStatusStyles(item.status);
    const categoryIcon = getCategoryIcon(item.category_name);
    
    // Show different name based on role
    const displayName = userRole === 'PROVIDER' ? item.client_name : item.provider_name;
    
    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.providerInfo}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={categoryIcon} size={24} color="#1A73E8" />
            </View>
            <View>
              <Text style={styles.providerName}>{displayName || (userRole === 'PROVIDER' ? 'Client' : 'Prestataire')}</Text>
              <Text style={styles.categoryBadge}>{item.category_name || 'Service'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Ionicons name={statusStyle.icon} size={12} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>{formatDate(item.booking_date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>{item.time_slot || 'Flexible'}</Text>
          </View>
        </View>

        {item.agreed_price && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix convenu:</Text>
            <Text style={styles.priceValue}>{item.agreed_price} MAD</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.detailsButton} 
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
          >
            <Text style={styles.detailsButtonText}>Voir détails</Text>
            <Ionicons name="chevron-forward" size={16} color="#1A73E8" />
          </TouchableOpacity>
          
          {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => cancelBooking(item.id)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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

  // Check if we can go back (not on main tab)
  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#191C23" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.title}>
          {userRole === 'PROVIDER' ? 'Mes Missions' : 'Mes Réservations'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilter}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {userRole === 'PROVIDER' ? 'Aucune mission' : 'Aucune réservation'}
            </Text>
            <Text style={styles.emptyText}>
              {userRole === 'PROVIDER' ? 'Aucune mission pour le moment' : 'Vous n\'avez pas encore de réservation'}
            </Text>
            {userRole === 'CLIENT' && (
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => navigation.navigate('HomeClient')}
              >
                <Text style={styles.exploreButtonText}>Explorer les services</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#191C23' },
  placeholder: { width: 40 },
  filtersContainer: { marginVertical: 16 },
  filtersList: { paddingHorizontal: 24 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F8FAFC', marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  providerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  categoryBadge: { fontSize: 12, color: '#64748B' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 10, fontWeight: '800', marginLeft: 4 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, color: '#475569', marginLeft: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  priceLabel: { fontSize: 13, color: '#64748B' },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#1A73E8' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  detailsButton: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  detailsButtonText: { fontSize: 14, fontWeight: '700', color: '#1A73E8', marginRight: 4 },
  cancelButton: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cancelButtonText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#191C23', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginBottom: 24 },
  exploreButton: { backgroundColor: '#1A73E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});

export default MesReservationsScreen;
