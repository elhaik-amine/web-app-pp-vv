import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState({ today: [], yesterday: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Notifications response:', data);
      
      if (data.success) {
        organizeNotifications(data.data);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const organizeNotifications = (notifList) => {
    const today = [];
    const yesterday = [];
    const todayDate = new Date().toDateString();
    const yesterdayDate = new Date(Date.now() - 86400000).toDateString();
    
    notifList.forEach(notif => {
      const notifDate = new Date(notif.created_at).toDateString();
      let parsedData = {};
      try {
        parsedData = typeof notif.data === 'string' ? JSON.parse(notif.data) : (notif.data || {});
      } catch (_) {
        parsedData = {};
      }
      const formattedNotif = {
        id: notif.id,
        title: notif.title,
        message: notif.message,
        time: new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: notif.type,
        is_read: notif.is_read === 1,
        data: parsedData,
      };
      
      if (notifDate === todayDate) {
        today.push(formattedNotif);
      } else if (notifDate === yesterdayDate) {
        yesterday.push(formattedNotif);
      }
    });
    
    setNotifications({ today, yesterday });
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.log('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchNotifications();
        Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
      }
    } catch (error) {
      console.log('Error marking all as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getIconAndColor = (type) => {
    const icons = {
      'PRICE_ACCEPTED': { icon: 'checkmark-circle', color: '#10B981', name: 'ios' },
'PRICE_ACCEPTED_BOTH': { icon: 'checkmark-done-circle', color: '#10B981', name: 'ios' },
'PRICE_REJECTED': { icon: 'close-circle', color: '#EF4444', name: 'ios' },
      'BOOKING_CONFIRMED': { icon: 'checkmark-circle', color: '#10B981', name: 'ios' },
      'BOOKING_PENDING': { icon: 'time-outline', color: '#F97316', name: 'ios' },
      'BOOKING_CANCELLED': { icon: 'close-circle', color: '#EF4444', name: 'ios' },
      'BOOKING_COMPLETED': { icon: 'checkmark-done-circle', color: '#1A73E8', name: 'ios' },
      'MESSAGE': { icon: 'chatbubbles', color: '#64748B', name: 'material' },
      'NEGOTIATION': { icon: 'swap-horizontal', color: '#8B5CF6', name: 'ios' },
      'TOKEN': { icon: 'toll', color: '#FFB300', name: 'material' },
      'REVIEW': { icon: 'star', color: '#FFB300', name: 'ios' },
      'WARNING': { icon: 'alert-circle', color: '#F97316', name: 'ios' },
      'OFFER_REJECTED': { icon: 'close-circle', color: '#EF4444', name: 'ios' },
      'PRICE_AGREED': { icon: 'checkmark-circle', color: '#10B981', name: 'ios' },
    };
    return icons[type] || { icon: 'notifications', color: '#64748B', name: 'ios' };
  };

  const handleNotificationPress = (item) => {
  if (!item.is_read) {
    markAsRead(item.id);
  }
  
  // Navigate based on notification type
  switch (item.type) {
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_PENDING':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_COMPLETED':
      navigation.navigate('BookingDetail', { bookingId: item.data?.booking_id });
      break;
    case 'NEGOTIATION':
    case 'MESSAGE':
    case 'OFFER_REJECTED':
    case 'PRICE_AGREED':
    case 'PRICE_ACCEPTED':
    case 'PRICE_ACCEPTED_BOTH':
    case 'PRICE_REJECTED':
      navigation.navigate('Negociation', { bookingId: item.data?.booking_id });
      break;
    case 'TOKEN':
      navigation.navigate('WalletTokens');
      break;
    case 'REVIEW':
      navigation.navigate('Avis', { bookingId: item.data?.booking_id });
      break;
    default:
      break;
  }
};

  const NotificationItem = ({ item }) => {
    const { icon, color, name } = getIconAndColor(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          {name === 'material' ? (
            <MaterialCommunityIcons name={icon} size={24} color={color} />
          ) : (
            <Ionicons name={icon} size={24} color={color} />
          )}
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
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

  const hasNotifications = notifications.today.length > 0 || notifications.yesterday.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markReadText}>Tout marquer lu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
        }
      >
        {!hasNotifications ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>Vous êtes à jour !</Text>
          </View>
        ) : (
          <>
            {/* Today Section */}
            {notifications.today.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aujourd'hui</Text>
                {notifications.today.map((item) => (
                  <NotificationItem key={item.id} item={item} />
                ))}
              </View>
            )}

            {/* Yesterday Section */}
            {notifications.yesterday.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hier</Text>
                {notifications.yesterday.map((item) => (
                  <NotificationItem key={item.id} item={item} />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191C23',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C23',
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A73E8',
  },
  scrollContent: {
    paddingTop: 16,
    flexGrow: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#F0F7FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C23',
  },
  unreadTitle: {
    color: '#1A73E8',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A73E8',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default NotificationsScreen;