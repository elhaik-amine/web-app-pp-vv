import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchDashboardData();
    fetchPendingProviders();
    fetchPendingReports();
    fetchRecentBookings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.log('Error fetching dashboard:', error);
    }
  };

  const fetchPendingProviders = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/admin/users?role=PROVIDER&status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPendingProviders(data.data);
      }
    } catch (error) {
      console.log('Error fetching pending providers:', error);
    }
  };

  const fetchPendingReports = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/admin/reports?status=PENDING`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPendingReports(data.data);
      }
    } catch (error) {
      console.log('Error fetching reports:', error);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/admin/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRecentBookings(data.data.slice(0, 5));
      }
    } catch (error) {
      console.log('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const approveProvider = async (userId) => {
    Alert.alert(
      'Approuver le prestataire',
      'Voulez-vous approuver ce prestataire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              const response = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Succès', 'Prestataire approuvé');
                fetchPendingProviders();
                fetchDashboardData();
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error) {
              console.log('Error approving provider:', error);
            }
          },
        },
      ]
    );
  };

  const rejectProvider = async (userId) => {
    Alert.alert(
      'Refuser le prestataire',
      'Voulez-vous refuser ce prestataire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Succès', 'Prestataire refusé');
                fetchPendingProviders();
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error) {
              console.log('Error rejecting provider:', error);
            }
          },
        },
      ]
    );
  };

  const resolveReport = async (reportId) => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Succès', 'Signalement résolu');
        fetchPendingReports();
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      console.log('Error resolving report:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    fetchPendingProviders();
    fetchPendingReports();
    fetchRecentBookings();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return '#1A73E8';
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      case 'PENDING': return '#F97316';
      default: return '#64748B';
    }
  };

  const kpis = dashboardData ? [
    { id: '1', label: 'Réservations', value: dashboardData.total_bookings || '0', icon: 'calendar-check', color: '#1A73E8', bg: '#E0EEFF' },
    { id: '2', label: 'Rapports ouverts', value: pendingReports.length.toString(), icon: 'alert-circle', color: '#EF4444', bg: '#FEE2E2' },
    { id: '3', label: 'Utilisateurs', value: dashboardData.total_users || '0', icon: 'account-group', color: '#10B981', bg: '#DCFCE7' },
    { id: '4', label: 'Prestataires', value: pendingProviders.length.toString(), icon: 'account-tie', color: '#F97316', bg: '#FFF7ED' },
  ] : [];

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

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
        }
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          {kpis.map((item) => (
            <View key={item.id} style={[styles.kpiCard, { backgroundColor: item.bg }]}>
              <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
              <Text style={[styles.kpiValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.kpiLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Pending Providers Section */}
        {pendingProviders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prestataires en attente</Text>
            </View>
            {pendingProviders.map((provider) => (
              <View key={provider.id} style={styles.providerCard}>
                <View style={styles.providerInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarFallback}>{provider.name?.charAt(0) || 'P'}</Text>
                  </View>
                  <View>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    <Text style={styles.providerEmail}>{provider.email}</Text>
                    <Text style={styles.providerDate}>
                      Inscrit le {new Date(provider.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.providerActions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => rejectProvider(provider.id)}
                  >
                    <Text style={styles.rejectBtnText}>Refuser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => approveProvider(provider.id)}
                  >
                    <Text style={styles.approveBtnText}>Approuver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending Reports Section */}
        {pendingReports.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Signalements en attente</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminReports')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {pendingReports.slice(0, 2).map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportTop}>
                  <View style={styles.reporterInfo}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarFallback}>{report.reporter_name?.charAt(0) || 'R'}</Text>
                    </View>
                    <View>
                      <Text style={styles.reporterName}>{report.reporter_name}</Text>
                      <Text style={styles.reportDate}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.typeText, { color: '#EF4444' }]}>{report.type}</Text>
                  </View>
                </View>
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
                    onPress={() => resolveReport(report.id)}
                  >
                    <Text style={styles.resolveBtnText}>Résoudre</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dernières réservations</Text>
            <View style={styles.activityList}>
              {recentBookings.map((booking) => (
                <TouchableOpacity 
                  key={booking.id} 
                  style={styles.activityItem}
                  onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
                >
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityService}>{booking.category_name || 'Service'}</Text>
                    <Text style={styles.activityUser}>
                      {booking.client_name} — {new Date(booking.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  shieldBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#191C23' },
  settingsBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 32 },
  kpiCard: { width: '48%', padding: 16, borderRadius: 20, marginBottom: 16 },
  kpiValue: { fontSize: 24, fontWeight: '800', marginTop: 12 },
  kpiLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  providerCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  providerInfo: { flexDirection: 'row', marginBottom: 16 },
  avatarContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarFallback: { fontSize: 18, fontWeight: '700', color: '#1A73E8' },
  providerName: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  providerEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  providerDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  providerActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: '#10B981' },
  approveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  rejectBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  rejectBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  reportCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  reportTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reporterInfo: { flexDirection: 'row', alignItems: 'center' },
  reporterName: { fontSize: 15, fontWeight: '700', color: '#191C23' },
  reportDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '800' },
  reportDesc: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 16 },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailsBtn: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  detailsBtnText: { fontSize: 14, fontWeight: '700', color: '#1A73E8' },
  resolveBtn: { backgroundColor: '#10B981' },
  resolveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  activityList: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 8 },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  activityInfo: { flex: 1 },
  activityService: { fontSize: 15, fontWeight: '700', color: '#191C23' },
  activityUser: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  bottomSpacer: { height: 20 },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 84, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  navLabelActive: { color: '#1A73E8', fontWeight: '700' },
});

export default AdminDashboard;
