import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const stats = [
  { id: '1', label: 'Missions', value: '12', icon: 'assignment' },
  { id: '2', label: 'Note', value: '4.9 ⭐', icon: 'star' },
  { id: '3', label: 'Taux succès', value: '98%', icon: 'trending-up' },
];

const requests = [
  {
    id: '1',
    clientName: 'Karim M.',
    category: 'Plomberie',
    date: '15 Oct',
    time: '12:00-15:00',
    price: '230 MAD',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100&auto=format&fit=crop',
  },
  {
    id: '2',
    clientName: 'Sara L.',
    category: 'Plomberie',
    date: '16 Oct',
    time: '09:00-12:00',
    price: '180 MAD',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
  },
];

const ProviderDashboard = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Bar */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1540560717464-578bad5d138b?q=80&w=100&auto=format&fit=crop' }} 
              style={styles.avatar} 
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Bonjour Ahmed 👋</Text>
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
              <MaterialCommunityIcons name="toll" size={28} color="#FFFFFF" />
              <Text style={styles.tokenTitle}>Mes Tokens</Text>
            </View>
            <TouchableOpacity 
              style={styles.buyBtn}
              onPress={() => navigation.navigate('WalletTokens')}
            >
              <Text style={styles.buyBtnText}>Acheter</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tokenBalance}>4.5 <Text style={styles.tokenUnit}>Tokens</Text></Text>
          
          <View style={styles.tokenFooter}>
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={16} color="#FFD700" />
              <Text style={styles.warningText}>Token bas — Rechargez bientôt</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
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

          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <Image source={{ uri: request.avatar }} style={styles.clientAvatar} />
                <View style={styles.requestInfo}>
                  <Text style={styles.clientName}>{request.clientName}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{request.category}</Text>
                  </View>
                </View>
                <Text style={styles.requestPrice}>{request.price}</Text>
              </View>

              <View style={styles.requestMiddle}>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text style={styles.dateTimeText}>{request.date}</Text>
                </View>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text style={styles.dateTimeText}>{request.time}</Text>
                </View>
              </View>

              <View style={styles.requestActions}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.negotiateBtn]}
                  onPress={() => navigation.navigate('Negociation')}
                >
                  <Text style={styles.negotiateText}>Négocier</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => navigation.navigate('Step1')}
                >
                  <Text style={styles.acceptText}>Accepter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Nav Placeholder */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Ionicons name="home" size={24} color="#1A73E8" />
          <Text style={styles.navLabelActive}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MesReservations')}
        >
          <Ionicons name="assignment-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Missions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('QRScanner')}
        >
          <Ionicons name="qr-code-scanner" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profil')}
        >
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
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
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
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
    height: 100,
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