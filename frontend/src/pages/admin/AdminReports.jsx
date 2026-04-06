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

const reports = [
  {
    id: '1',
    reporter: 'Karim M.',
    type: 'NO_SHOW',
    ref: '#BK-8821',
    description: 'Le prestataire ne s\'est pas présenté à l\'heure prévue sans prévenir.',
    date: 'Il y a 2h',
    status: 'PENDING',
  },
  {
    id: '2',
    reporter: 'Sara L.',
    type: 'COMPORTEMENT',
    ref: '#BK-9042',
    description: 'Langage inapproprié lors de la négociation du prix final.',
    date: 'Il y a 5h',
    status: 'PENDING',
  },
  {
    id: '3',
    reporter: 'Ahmed B.',
    type: 'LATE_ARRIVAL',
    ref: '#BK-7751',
    description: 'Arrivée avec plus d\'une heure de retard sans explication.',
    date: 'Hier',
    status: 'RESOLVED',
  },
];

const AdminReportsScreen = ({ navigation }) => {
  const getStatusColor = (type) => {
    switch (type) {
      case 'NO_SHOW': return '#EF4444';
      case 'COMPORTEMENT': return '#F97316';
      case 'LATE_ARRIVAL': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const renderReportCard = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportTop}>
        <View style={styles.reporterInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarFallback}>{item.reporter.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.reporterName}>{item.reporter}</Text>
            <Text style={styles.reportDate}>{item.date}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: `${getStatusColor(item.type)}15` }]}>
          <Text style={[styles.typeText, { color: getStatusColor(item.type) }]}>{item.type}</Text>
        </View>
      </View>

      <Text style={styles.reportRef}>Booking Ref: <Text style={styles.boldRef}>{item.ref}</Text></Text>
      <Text style={styles.reportDesc} numberOfLines={3}>{item.description}</Text>

      <View style={styles.reportActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.detailsBtn]}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Text style={styles.detailsBtnText}>Voir détails</Text>
        </TouchableOpacity>
        {item.status === 'PENDING' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.resolveBtn]}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            <Text style={styles.resolveBtnText}>Résoudre</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signalements</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={24} color="#1A73E8" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listSubtitle}>Gérer les signalements des utilisateurs</Text>
          </View>
        }
      />

      {/* Admin Bottom Nav Placeholder */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Ionicons name="grid-outline" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MesReservations')}
        >
          <Ionicons name="calendar-outline" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItemActive}
          onPress={() => navigation.navigate('AdminReports')}
        >
          <Ionicons name="alert-circle" size={24} color="#1A73E8" />
          <View style={styles.activeDot} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profil')}
        >
          <Ionicons name="people-outline" size={24} color="#94A3B8" />
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#191C23',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 24,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
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
    width: 44,
    height: 44,
    borderRadius: 14,
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
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  detailsBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
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
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 90,
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
    padding: 12,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    position: 'relative',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A73E8',
    position: 'absolute',
    bottom: 4,
  },
});

export default AdminReportsScreen;