import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ProviderDashboard = ({ navigation }) => {
  const [provider, setProvider] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    missions: 0,
    rating: 0,
    successRate: 0,
  });

  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    loadProviderData();
    fetchBookings();
    fetchTokenBalance();
  }, []);

  const loadProviderData = async () => {
    try {
      const userData = await AsyncStorage.getItem('khidmati_user');
      if (userData) {
        const user = JSON.parse(userData);
        setProvider(user);
        
        // Fetch provider profile
        const token = await AsyncStorage.getItem('khidmati_token');
        const response = await fetch(`${API_URL}/providers/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setStats({
            missions: data.data.total_bookings || 0,
            rating: data.data.rating || 0,
            successRate: data.data.success_rate || 98,
          });
        }
      }
    } catch (error) {
      console.log('Error loading provider:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings?status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.log('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTokenBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/tokens/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTokenBalance(data.data.balance);
      }
    } catch (error) {
      console.log('Error fetching token balance:', error);
    }
  };

  const acceptBooking = async (bookingId) => {
  try {
    const token = await AsyncStorage.getItem('khidmati_token');
    
    // Use the correct endpoint: /confirm (not /accept)
    const response = await fetch(`${API_URL}/bookings/${bookingId}/confirm`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('Accept response:', data);
    
    if (data.success) {
      Alert.alert('Succès', 'Réservation acceptée');
      fetchBookings(); // Refresh the list
    } else {
      Alert.alert('Erreur', data.message || 'Erreur lors de l\'acceptation');
    }
  } catch (error) {
    console.log('Error accepting booking:', error);
    Alert.alert('Erreur', 'Impossible d\'accepter la réservation');
  }
};

  const rejectBooking = async (bookingId) => {
    Alert.alert(
      'Refuser la réservation',
      'Voulez-vous vraiment refuser cette réservation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              const response = await fetch(`${API_URL}/bookings/${bookingId}/reject`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Succès', 'Réservation refusée');
                fetchBookings();
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error) {
              console.log('Error rejecting booking:', error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProviderData();
    fetchBookings();
    fetchTokenBalance();
  };

  const statsCards = [
    { id: '1', label: 'Missions', value: stats.missions.toString(), icon: 'assignment' },
    { id: '2', label: 'Note', value: `${stats.rating} ⭐`, icon: 'star' },
    { id: '3', label: 'Taux succès', value: `${stats.successRate}%`, icon: 'trending-up' },
  ];

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
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
        }
      >
        {/* Top Bar */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: provider?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
              style={styles.avatar} 
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Bonjour {provider?.name?.split(' ')[0] || 'Ahmed'} 👋</Text>
              <Text style={styles.subGreeting}>Prêt pour de nouvelles missions ?</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#191C23" />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>

        {/* Token Balance Card */}
        <View style={styles.tokenCard}>
          <View style={styles.tokenHeader}>
            <View style={styles.tokenLabelGroup}>
              <Ionicons name="cash-outline" size={28} color="#FFFFFF" />
              <Text style={styles.tokenTitle}>Mes Tokens</Text>
            </View>
            <TouchableOpacity 
              style={styles.buyBtn}
              onPress={() => navigation.navigate('WalletTokens')}
            >
              <Text style={styles.buyBtnText}>Acheter</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tokenBalance}>
            {tokenBalance} <Text style={styles.tokenUnit}>Tokens</Text>
          </Text>
          
          <View style={styles.tokenFooter}>
            <View style={[styles.warningBox, tokenBalance < 2 && styles.warningBoxDanger]}>
              <Ionicons name="alert-circle" size={16} color={tokenBalance < 2 ? "#FF4444" : "#FFD700"} />
              <Text style={[styles.warningText, tokenBalance < 2 && styles.warningTextDanger]}>
                {tokenBalance < 2 ? 'Token critique — Rechargez immédiatement' : 'Token bas — Rechargez bientôt'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {statsCards.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <MaterialCommunityIcons name={stat.icon} size={24} color="#1A73E8" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* New Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nouvelles Demandes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="inbox-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Aucune nouvelle demande</Text>
            </View>
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{booking.client_name?.charAt(0) || 'C'}</Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.clientName}>{booking.client_name || 'Client'}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{booking.category_name || 'Service'}</Text>
                    </View>
                  </View>
                  <Text style={styles.requestPrice}>{booking.agreed_price || booking.estimated_price || 0} MAD</Text>
                </View>

                <View style={styles.requestMiddle}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <Text style={styles.dateTimeText}>
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.dateTimeText}>{booking.time_slot || 'Flexible'}</Text>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity 
  style={[styles.actionBtn, styles.negotiateBtn]}
  onPress={() => navigation.navigate('Negociation', { bookingId: booking.id })}
>
  <Text style={styles.negotiateText}>Négocier</Text>
</TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => acceptBooking(booking.id)}
                  >
                    <Text style={styles.acceptText}>Accepter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Nav */}
      {/* Bottom Nav */}
<View style={styles.bottomNav}>
  <TouchableOpacity style={styles.navItemActive} onPress={() => setActiveTab('home')}>
    <Ionicons name="home" size={24} color="#1A73E8" />
    <Text style={[styles.navLabel, styles.navLabelActive]}>Accueil</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MesReservations')}>
    <Ionicons name="calendar" size={24} color="#94A3B8" />
    <Text style={styles.navLabel}>Missions</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('QRScanner')}>
    <Ionicons name="scan" size={24} color="#94A3B8" />
    <Text style={styles.navLabel}>Scanner</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
    <Ionicons name="person-outline" size={24} color="#94A3B8" />
    <Text style={styles.navLabel}>Profil</Text>
  </TouchableOpacity>
</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  greetingContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C23',
  },
  subGreeting: {
    fontSize: 12,
    color: '#64748B',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  tokenCard: {
    backgroundColor: '#1A73E8',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tokenBalance: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tokenUnit: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  tokenFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningBoxDanger: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
  },
  warningTextDanger: {
    color: '#FF8888',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '30%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191C23',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#191C23',
  },
  seeAll: {
    color: '#1A73E8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A73E8',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191C23',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A73E8',
  },
  requestPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A73E8',
  },
  requestMiddle: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  negotiateBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  negotiateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A73E8',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 84,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  navLabelActive: {
    fontSize: 10,
    color: '#1A73E8',
    fontWeight: '700',
    marginTop: 4,
  },
});

export default ProviderDashboard;