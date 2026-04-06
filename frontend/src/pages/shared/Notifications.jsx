import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const notifications = {
  today: [
    {
      id: '1',
      title: 'Réservation confirmée',
      message: 'Ahmed B. a accepté votre demande de plomberie',
      time: '14:32',
      type: 'BOOKING',
      icon: 'notifications',
      iconColor: '#1A73E8',
      unread: true,
    },
    {
      id: '2',
      title: 'Mission complétée',
      message: 'Votre mission #KH-0892 est terminée. Laissez un avis !',
      time: '12:45',
      type: 'COMPLETION',
      icon: 'checkmark-circle',
      iconColor: '#10B981',
      unread: true,
    },
    {
      id: '3',
      title: 'Token reçu 🪙',
      message: 'Vous avez reçu +0.5 token pour votre avis 5 étoiles',
      time: '10:00',
      type: 'TOKEN',
      icon: 'toll',
      iconColor: '#FFB300',
      unread: false,
    },
  ],
  yesterday: [
    {
      id: '4',
      title: 'Token bas',
      message: 'Votre solde est inférieur à 1 token. Rechargez pour continuer.',
      time: '18:20',
      type: 'WARNING',
      icon: 'alert-circle',
      iconColor: '#F97316',
      unread: false,
    },
    {
      id: '5',
      title: 'Nouvelle contre-offre reçue',
      message: 'Ahmed B. propose un nouveau prix: 250 MAD',
      time: '15:10',
      type: 'NEGOTIATION',
      icon: 'chatbubbles',
      iconColor: '#64748B',
      unread: false,
    },
  ],
};

const NotificationItem = ({ item, navigation }) => (
  <TouchableOpacity 
    style={[styles.notificationItem, item.unread && styles.unreadItem]}
    activeOpacity={0.7}
    onPress={() => {
      // Navigate based on notification type
      if (item.type === 'BOOKING') {
        navigation.navigate('BookingDetail');
      } else if (item.type === 'COMPLETION') {
        navigation.navigate('Avis');
      } else if (item.type === 'TOKEN') {
        navigation.navigate('WalletTokens');
      } else if (item.type === 'WARNING') {
        navigation.navigate('WalletTokens');
      } else if (item.type === 'NEGOTIATION') {
        navigation.navigate('Negociation');
      }
    }}
  >
    <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
      {item.type === 'TOKEN' || item.type === 'WARNING' ? (
        <MaterialCommunityIcons name={item.icon} size={24} color={item.iconColor} />
      ) : (
        <Ionicons name={item.icon} size={24} color={item.iconColor} />
      )}
    </View>
    <View style={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, item.unread && styles.unreadTitle]}>{item.title}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
    </View>
    {item.unread && <View style={styles.unreadDot} />}
  </TouchableOpacity>
);

const NotificationsScreen = ({ navigation }) => {
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
        <TouchableOpacity>
          <Text style={styles.markReadText}>Tout marquer lu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Today Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          {notifications.today.map((item) => (
            <NotificationItem key={item.id} item={item} navigation={navigation} />
          ))}
        </View>

        {/* Yesterday Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hier</Text>
          {notifications.yesterday.map((item) => (
            <NotificationItem key={item.id} item={item} navigation={navigation} />
          ))}
        </View>

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