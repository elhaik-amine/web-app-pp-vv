import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, Image, FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const categories = [
  { id: '1', name: 'Ménage', icon: 'broom', color: '#E3F2FD' },
  { id: '2', name: 'Plomberie', icon: 'wrench', color: '#FFF3E0' },
  { id: '3', name: 'Électricité', icon: 'flash', color: '#FFFDE7' },
  { id: '4', name: 'Peinture', icon: 'palette', color: '#F3E5F5' },
  { id: '5', name: 'Jardinage', icon: 'leaf', color: '#E8F5E9' },
  { id: '6', name: 'Garde enfants', icon: 'baby-face-outline', color: '#FCE4EC' },
];

const providers = [
  { id: '1', name: 'Ahmed B.', category: 'Plomberie', rating: 4.9, reviews: 124, price: 150, image: 'https://images.unsplash.com/photo-1540560717464-578bad5d138b?q=80&w=200&auto=format&fit=crop' },
  { id: '2', name: 'Youssef L.', category: 'Électricité', rating: 4.8, reviews: 89, price: 200, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
  { id: '3', name: 'Sara K.', category: 'Ménage', rating: 5.0, reviews: 56, price: 100, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' },
];

const HomeScreen = ({ navigation }) => {
  const renderCategory = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard} onPress={() => navigation.navigate('ProviderList')}>
      <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
        <MaterialCommunityIcons name={item.icon} size={28} color="#1A73E8" />
      </View>
      <Text style={styles.categoryLabel}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderProvider = ({ item }) => (
    <TouchableOpacity style={styles.providerCard} onPress={() => navigation.navigate('ProviderProfile')}>
      <Image source={{ uri: item.image }} style={styles.providerImage} />
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{item.name}</Text>
        <Text style={styles.providerCategory}>{item.category}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFB300" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews} avis)</Text>
        </View>
        <Text style={styles.priceText}>À partir de <Text style={styles.priceValue}>{item.price} MAD/h</Text></Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100&auto=format&fit=crop' }} style={styles.avatar} />
            <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#191C23" />
              <View style={styles.unreadDot} />
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>Bonjour Karim 👋</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#64748B" />
            <TextInput placeholder="Rechercher un service..." style={styles.searchInput} placeholderTextColor="#64748B" />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos Services</Text>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.categoryRow}
          />
        </View>

        {/* Popular Providers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prestataires Populaires</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderList')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={providers}
            renderItem={renderProvider}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providersList}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9' },
  notificationBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#F8FAFC' },
  greeting: { fontSize: 24, fontWeight: '800', color: '#191C23' },
  searchContainer: { paddingHorizontal: 24, marginBottom: 32 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#191C23' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#191C23', paddingHorizontal: 24 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  categoryRow: { justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
  categoryCard: { width: '30%', alignItems: 'center' },
  categoryIconContainer: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  providersList: { paddingLeft: 24, paddingRight: 8 },
  providerCard: { width: 200, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', elevation: 3 },
  providerImage: { width: '100%', height: 120, backgroundColor: '#F1F5F9' },
  providerInfo: { padding: 12 },
  providerName: { fontSize: 16, fontWeight: '700', color: '#191C23', marginBottom: 2 },
  providerCategory: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#191C23', marginLeft: 4, marginRight: 4 },
  reviewsText: { fontSize: 12, color: '#94A3B8' },
  priceText: { fontSize: 12, color: '#64748B' },
  priceValue: { fontSize: 14, fontWeight: '700', color: '#1A73E8' },
  bottomSpacer: { height: 40 },
});

export default HomeScreen;