import React, { useRef, useState, useEffect } from 'react';
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
import { io } from 'socket.io-client';

const { width } = Dimensions.get('window');

const ProviderDashboard = ({ navigation }) => {
  const [provider, setProvider] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('demandes');
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const acceptingBookingRef = useRef(null);
  const [stats, setStats] = useState({
    missions: 0,
    rating: 0,
    successRate: 98,
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL.replace('/api', '');

  useEffect(() => {
    loadProviderData();
    fetchPendingBookings();
    fetchConfirmedBookings();
    fetchTokenBalance();
    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const initSocket = async () => {
    const token = await AsyncStorage.getItem('khidmati_token');
    const userData = await AsyncStorage.getItem('khidmati_user');
    if (userData && token) {
      const user = JSON.parse(userData);
      const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
      
      newSocket.on('connect', () => {
        newSocket.emit('join', user.id);
        newSocket.emit('join:provider', user.id);
      });
      
      newSocket.on('booking:new', () => {
        fetchPendingBookings();
        fetchConfirmedBookings();
      });
      
      newSocket.on('booking:updated', () => {
        fetchPendingBookings();
        fetchConfirmedBookings();
      });
      
      newSocket.on('booking:confirmed', () => {
        fetchPendingBookings();
        fetchConfirmedBookings();
      });
      
      newSocket.on('booking:price_updated', () => {
        fetchPendingBookings();
        fetchConfirmedBookings();
      });
      
      socketRef.current = newSocket;
      setSocket(newSocket);
    }
  };

  const loadProviderData = async () => {
    try {
      const userData = await AsyncStorage.getItem('khidmati_user');
      if (userData) {
        const user = JSON.parse(userData);
        setProvider(user);
        
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

  const fetchPendingBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings?status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPendingBookings(data.data);
      }
    } catch (error) {
      console.log('Error fetching pending bookings:', error);
    }
  };

  const fetchConfirmedBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings?status=CONFIRMED`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setConfirmedBookings(data.data);
      }
    } catch (error) {
      console.log('Error fetching confirmed bookings:', error);
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const acceptBooking = async (bookingId) => {
    if (acceptingBookingRef.current === bookingId) {
      return;
    }

    if (tokenBalance < 1) {
      Alert.alert('Solde insuffisant', "Vous n'avez pas assez de tokens pour accepter une réservation. Veuillez recharger votre compte.");
      return;
    }
    acceptingBookingRef.current = bookingId;
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Succès', 'Réservation acceptée');
        fetchPendingBookings();
        fetchConfirmedBookings();
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      console.log('Error accepting booking:', error);
    } finally {
      acceptingBookingRef.current = null;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProviderData();
    fetchPendingBookings();
    fetchConfirmedBookings();
    fetchTokenBalance();
  };

  const getLatestPrice = (booking) => {
    if (booking.agreed_price && booking.agreed_price > 0) return booking.agreed_price;
    if (booking.estimated_price && booking.estimated_price > 0) return booking.estimated_price;
    return 0;
  };

  const statsCards = [
    { id: '1', label: 'Missions', value: stats.missions.toString(), icon: 'briefcase' },
    { id: '2', label: 'Note', value: `${stats.rating} ⭐`, icon: 'star' },
    { id: '3', label: 'Taux succès', value: `${stats.successRate}%`, icon: 'trending-up' },
  ];

  const renderBookingCard = (item, isPending = true) => {
    const price = getLatestPrice(item);
    const isConfirmed = item.status === 'CONFIRMED';
    
    return (
      <View key={item.id} style={styles.requestCard}>
        <View style={styles.requestTop}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{item.client_name?.charAt(0) || 'C'}</Text>
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.clientName}>{item.client_name || 'Client'}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category_name || 'Service'}</Text>
            </View>
          </View>
          <Text style={[styles.requestPrice, price === 0 && styles.priceZero]}>
            {price > 0 ? `${price} MAD` : 'À négocier'}
          </Text>
        </View>

        <View style={styles.requestMiddle}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.dateTimeText}>
              {new Date(item.date_meeting).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.dateTimeText}>{item.time_slot || 'Flexible'}</Text>
          </View>
        </View>

        {isPending && !isConfirmed && (
          <View style={styles.requestActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.negotiateBtn]}
              onPress={() => {
                if (tokenBalance < 1) {
                  Alert.alert('Solde insuffisant', "Vous n'avez pas assez de tokens pour négocier. Veuillez recharger votre compte.");
                } else {
                  navigation.navigate('Negociation', { bookingId: item.id });
                }
              }}
            >
              <Text style={styles.negotiateText}>Négocier</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => acceptBooking(item.id)}
            >
              <Text style={styles.acceptText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!isPending && (
          <TouchableOpacity 
            style={styles.viewDetailsBtn}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
          >
            <Text style={styles.viewDetailsText}>Voir détails</Text>
            <Ionicons name="chevron-forward" size={16} color="#1A73E8" />
          </TouchableOpacity>
        )}
        
        {isConfirmed && (
          <View style={styles.confirmedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.confirmedText}>Confirmé</Text>
          </View>
        )}
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
              <MaterialCommunityIcons name="ticket" size={28} color="#FFFFFF" />
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

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'demandes' && styles.tabActive]}
            onPress={() => setActiveTab('demandes')}
          >
            <Text style={[styles.tabText, activeTab === 'demandes' && styles.tabTextActive]}>
              Nouvelles Demandes ({pendingBookings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'missions' && styles.tabActive]}
            onPress={() => setActiveTab('missions')}
          >
            <Text style={[styles.tabText, activeTab === 'missions' && styles.tabTextActive]}>
              Mes Missions ({confirmedBookings.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'demandes' && (
          <>
            {pendingBookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="inbox-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>Aucune nouvelle demande</Text>
              </View>
            ) : (
              pendingBookings.map((booking) => renderBookingCard(booking, true))
            )}
          </>
        )}

        {activeTab === 'missions' && (
          <>
            {confirmedBookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>Aucune mission en cours</Text>
              </View>
            ) : (
              confirmedBookings.map((booking) => renderBookingCard(booking, false))
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9' },
  greetingContainer: { marginLeft: 12 },
  greetingText: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  subGreeting: { fontSize: 12, color: '#64748B' },
  iconBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#F8FAFC' },
  tokenCard: { backgroundColor: '#1A73E8', borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  tokenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tokenLabelGroup: { flexDirection: 'row', alignItems: 'center' },
  tokenTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  buyBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  buyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tokenBalance: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  tokenUnit: { fontSize: 16, fontWeight: '600', opacity: 0.8 },
  tokenFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },
  warningBox: { flexDirection: 'row', alignItems: 'center' },
  warningBoxDanger: { backgroundColor: 'rgba(255,68,68,0.2)', padding: 8, borderRadius: 8 },
  warningText: { color: '#FFFFFF', fontSize: 12, marginLeft: 6 },
  warningTextDanger: { color: '#FF8888' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statCard: { width: '30%', backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#191C23', marginTop: 8, marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#1A73E8' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 12 },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  requestTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: '#1A73E8' },
  requestInfo: { flex: 1, marginLeft: 12 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 4 },
  categoryBadge: { backgroundColor: '#F0F7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#1A73E8' },
  requestPrice: { fontSize: 18, fontWeight: '800', color: '#1A73E8' },
  priceZero: { color: '#F97316', fontSize: 14 },
  requestMiddle: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, marginBottom: 20 },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  dateTimeText: { fontSize: 13, color: '#64748B', marginLeft: 6 },
  requestActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', width: '48%' },
  negotiateBtn: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  negotiateText: { fontSize: 14, fontWeight: '700', color: '#1A73E8' },
  acceptBtn: { backgroundColor: '#10B981' },
  acceptText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  viewDetailsText: { fontSize: 14, fontWeight: '700', color: '#1A73E8', marginRight: 4 },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  confirmedText: { fontSize: 14, fontWeight: '600', color: '#10B981', marginLeft: 6 },
  bottomSpacer: { height: 20 },
});

export default ProviderDashboard;
