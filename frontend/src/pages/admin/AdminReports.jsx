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

const AdminReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const status = filter === 'all' ? '' : filter.toUpperCase();
      const url = status ? `${API_URL}/admin/reports?status=${status}` : `${API_URL}/admin/reports`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.log('Error fetching reports:', error);
      Alert.alert('Erreur', 'Impossible de charger les signalements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveReport = async (reportId) => {
    Alert.alert(
      'Résoudre le signalement',
      'Voulez-vous marquer ce signalement comme résolu ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Résoudre',
          onPress: async () => {
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
                fetchReports();
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error) {
              console.log('Error resolving report:', error);
              Alert.alert('Erreur', 'Impossible de résoudre le signalement');
            }
          },
        },
      ]
    );
  };

  const suspendUser = async (userId) => {
    Alert.alert(
      'Suspendre l\'utilisateur',
      'Voulez-vous suspendre cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Suspendre',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Succès', 'Utilisateur suspendu');
                fetchReports();
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error) {
              console.log('Error suspending user:', error);
              Alert.alert('Erreur', 'Impossible de suspendre l\'utilisateur');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'NOSHOW': return '#EF4444';
      case 'ABSENT': return '#F97316';
      case 'OTHER': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'NOSHOW': return 'ABSENCE';
      case 'ABSENT': return 'CLIENT ABSENT';
      case 'OTHER': return 'AUTRE';
      default: return type;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'EN ATTENTE';
      case 'REVIEWED': return 'EXAMINÉ';
      case 'RESOLVED': return 'RÉSOLU';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#F97316';
      case 'REVIEWED': return '#1A73E8';
      case 'RESOLVED': return '#10B981';
      default: return '#64748B';
    }
  };

  const renderReportCard = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportTop}>
        <View style={styles.reporterInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarFallback}>{item.reporter_name?.charAt(0) || 'R'}</Text>
          </View>
          <View>
            <Text style={styles.reporterName}>{item.reporter_name || 'Signalement'}</Text>
            <Text style={styles.reportDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(item.type)}15` }]}>
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
      </View>

      <Text style={styles.reportRef}>
        Utilisateur signalé: <Text style={styles.boldRef}>{item.reported_user_name || 'N/A'}</Text>
      </Text>
      
      <Text style={styles.reportDesc} numberOfLines={3}>
        {item.description || 'Aucune description fournie'}
      </Text>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.reportActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.detailsBtn]}
          onPress={() => {
            // Navigate to booking detail if booking_id exists
            if (item.booking_id) {
              navigation.navigate('BookingDetail', { bookingId: item.booking_id });
            }
          }}
        >
          <Text style={styles.detailsBtnText}>Voir détails</Text>
        </TouchableOpacity>
        
        {item.status === 'PENDING' && (
          <>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.resolveBtn]}
              onPress={() => resolveReport(item.id)}
            >
              <Text style={styles.resolveBtnText}>Résoudre</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.suspendBtn]}
              onPress={() => suspendUser(item.reported_user_id)}
            >
              <Text style={styles.suspendBtnText}>Suspendre</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signalements</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => {
          const filters = ['all', 'pending', 'resolved'];
          const currentIndex = filters.indexOf(filter);
          const nextFilter = filters[(currentIndex + 1) % filters.length];
          setFilter(nextFilter);
        }}>
          <Ionicons name="filter-outline" size={24} color="#1A73E8" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterChipText, filter === 'pending' && styles.filterChipTextActive]}>En attente</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'resolved' && styles.filterChipActive]}
          onPress={() => setFilter('resolved')}
        >
          <Text style={[styles.filterChipText, filter === 'resolved' && styles.filterChipTextActive]}>Résolus</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Aucun signalement</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending' ? 'Aucun signalement en attente' : 'Tous les signalements sont résolus'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listSubtitle}>
              {reports.length} signalement{reports.length > 1 ? 's' : ''} au total
            </Text>
          </View>
        }
      />

      {/* Admin Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AdminDashboard')}>
          <Ionicons name="grid-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MesReservations')}>
          <Ionicons name="calendar-outline" size={24} color="#94A3B8" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <Ionicons name="alert-circle" size={24} color="#1A73E8" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Reports</Text>
          <View style={styles.activeDot} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profil')}>
          <Ionicons name="people-outline" size={24} color="#94A3B8" />
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
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#191C23' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, gap: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#1A73E8', borderColor: '#1A73E8' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },
  listContent: { padding: 24, paddingBottom: 100 },
  listHeader: { marginBottom: 16 },
  listSubtitle: { fontSize: 14, color: '#64748B' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#191C23', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  reportCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  reportTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  reporterInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarFallback: { fontSize: 16, fontWeight: '700', color: '#1A73E8' },
  reporterName: { fontSize: 15, fontWeight: '700', color: '#191C23' },
  reportDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '800' },
  reportRef: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  boldRef: { fontWeight: '700', color: '#191C23' },
  reportDesc: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 16 },
  statusContainer: { marginBottom: 20 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  detailsBtn: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  detailsBtnText: { fontSize: 14, fontWeight: '700', color: '#1A73E8' },
  resolveBtn: { backgroundColor: '#10B981' },
  resolveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  suspendBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  suspendBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 84, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navItemActive: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1A73E8', position: 'absolute', bottom: -8 },
  navLabel: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  navLabelActive: { color: '#1A73E8', fontWeight: '700' },
});

export default AdminReportsScreen;
