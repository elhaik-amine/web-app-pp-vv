import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, FlatList, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const filters = ['Toutes', 'En cours', 'Complétées', 'Annulées'];

const bookings = [
  { id: '1', providerName: 'Ahmed B.', category: 'Plomberie', date: '15 Oct 2023', timeSlot: '12:00 - 15:00', status: 'CONFIRMED', icon: 'wrench' },
  { id: '2', providerName: 'Youssef L.', category: 'Électricité', date: '18 Oct 2023', timeSlot: '09:00 - 12:00', status: 'NEGOTIATING', icon: 'flash' },
  { id: '3', providerName: 'Sara K.', category: 'Ménage', date: '12 Oct 2023', timeSlot: '14:00 - 17:00', status: 'COMPLETED', icon: 'broom' },
  { id: '4', providerName: 'Karim M.', category: 'Peinture', date: '20 Oct 2023', timeSlot: '08:00 - 12:00', status: 'PENDING', icon: 'palette' },
];

const getStatusStyles = (status) => {
  switch (status) {
    case 'CONFIRMED': return { bg: '#DCFCE7', text: '#166534', label: 'CONFIRMÉ' };
    case 'NEGOTIATING': return { bg: '#FFF7ED', text: '#9A3412', label: 'NÉGOCIATION' };
    case 'COMPLETED': return { bg: '#F0FDF4', text: '#15803d', label: 'TERMINÉ' };
    case 'PENDING': return { bg: '#EFF6FF', text: '#1E40AF', label: 'EN ATTENTE' };
    default: return { bg: '#F1F5F9', text: '#475569', label: status };
  }
};

const MesReservationsScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('Toutes');

  const renderFilter = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
      onPress={() => setActiveFilter(item)}
    >
      <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderBookingCard = ({ item }) => {
    const statusStyle = getStatusStyles(item.status);
    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={styles.providerInfo}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={item.icon} size={24} color="#1A73E8" />
            </View>
            <View>
              <Text style={styles.providerName}>{item.providerName}</Text>
              <Text style={styles.categoryBadge}>{item.category}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>{item.timeSlot}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('BookingDetail')}>
          <Text style={styles.detailsButtonText}>Voir détails</Text>
          <Ionicons name="chevron-forward" size={16} color="#1A73E8" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Réservations</Text>
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
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, marginBottom: 20 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 13, color: '#475569', marginLeft: 6 },
  detailsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  detailsButtonText: { fontSize: 14, fontWeight: '700', color: '#1A73E8', marginRight: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
});

export default MesReservationsScreen;