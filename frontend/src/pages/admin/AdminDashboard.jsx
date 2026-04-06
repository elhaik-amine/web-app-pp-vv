import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const kpis = [
  { id: '1', label: 'Réservations', value: '156', icon: 'calendar-check', color: '#1A73E8', bg: '#E0EEFF' },
  { id: '2', label: 'Rapports ouverts', value: '8', icon: 'alert-circle', color: '#EF4444', bg: '#FEE2E2' },
  { id: '3', label: 'Utilisateurs actifs', value: '342', icon: 'account-group', color: '#10B981', bg: '#DCFCE7' },
  { id: '4', label: 'Tokens vendus', value: '1,240', icon: 'toll', color: '#F97316', bg: '#FFF7ED' },
];

const pendingReports = [
  {
    id: '1',
    reporter: 'Karim M.',
    type: 'NO_SHOW',
    ref: '#BK-8821',
    description: 'Le prestataire ne s\'est pas présenté à l\'heure prévue sans prévenir.',
    date: 'Il y a 2h',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100&auto=format&fit=crop',
  },
  {
    id: '2',
    reporter: 'Sara L.',
    type: 'COMPORTEMENT',
    ref: '#BK-9042',
    description: 'Langage inapproprié lors de la négociation du prix final.',
    date: 'Il y a 5h',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
  },
];

const latestBookings = [
  { id: '1', service: 'Plomberie', user: 'Ahmed B.', status: 'CONFIRMED', time: '14:20' },
  { id: '2', service: 'Ménage', user: 'Yassine K.', status: 'COMPLETED', time: '13:45' },
  { id: '3', service: 'Électricité', user: 'Omar S.', status: 'DISMISSED', time: '12:10' },
];

const AdminDashboard = ({ navigation }) => {
  const renderKPI = (item) => (
    <View key={item.id} style={[styles.kpiCard, { backgroundColor: item.bg }]}>
      <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
      <Text style={[styles.kpiValue, { color: item.color }]}>{item.value}</Text>
      <Text style={styles.kpiLabel}>{item.label}</Text>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return '#1A73E8';
      case 'COMPLETED': return '#10B981';
      case 'DISMISSED': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Admin Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.shieldBg}>
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="#191C23" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          {kpis.map(renderKPI)}
        </View>

        {/* Pending Reports Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rapports en attente</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminReports')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {pendingReports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportTop}>
                <View style={styles.reporterInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarFallback}>{report.reporter.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.reporterName}>{report.reporter}</Text>
                    <Text style={styles.reportDate}>{report.date}</Text>
                  </View>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: report.type === 'NO_SHOW' ? '#FEE2E2' : '#FFF7ED' }]}>
                  <Text style={[styles.typeText, { color: report.type === 'NO_SHOW' ? '#EF4444' : '#F97316' }]}>{report.type}</Text>
                </View>
              </View>

              <Text style={styles.reportRef}>Booking Ref: <Text style={styles.boldRef}>{report.ref}</Text></Text>
              <Text style={styles.reportDesc} numberOfLines={2}>{report.description}</Text>

              <View style={styles.reportActions}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.detailsBtn]}
                  onPress={() => navigation.navigate('AdminReports')}
                >
                  <Text style={styles.detailsBtnText}>Voir détails</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.resolveBtn]}
                  onPress={() => navigation.navigate('AdminReports')}
                >
                  <Text style={styles.resolveBtnText}>Résoudre</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Latest Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernières réservations</Text>
          <View style={styles.activityList}>
            {latestBookings.map((booking) => (
              <TouchableOpacity 
                key={booking.id} 
                style={styles.activityItem}
                onPress={() => navigation.navigate('BookingDetail')}
              >
                <View style={styles.activityInfo}>
                  <Text style={styles.activityService}>{booking.service}</Text>
                  <Text style={styles.activityUser}>{booking.user} — {booking.time}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>{booking.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Admin Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid" size={24} color="#1A73E8" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MesReservations')}
        >
          <Ionicons name="calendar" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminReports')}
        >
          <Ionicons name="alert-circle" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profil')}
        >
          <Ionicons name="people" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Users</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#191C23',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  kpiCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C23',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
  reportCard: {
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
  reportTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarFallback: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A73E8',
  },
  reporterName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C23',
  },
  reportDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reportRef: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  boldRef: {
    fontWeight: '700',
    color: '#191C23',
  },
  reportDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  detailsBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A73E8',
  },
  resolveBtn: {
    backgroundColor: '#10B981',
  },
  resolveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 8,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  activityInfo: {
    flex: 1,
  },
  activityService: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C23',
  },
  activityUser: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
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
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#1A73E8',
    fontWeight: '700',
  },
});

export default AdminDashboard;