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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const packages = [
  { id: '1', amount: 5, price: 50, popular: false },
  { id: '2', amount: 10, price: 90, popular: true },
  { id: '3', amount: 20, price: 160, popular: false },
  { id: '4', amount: 50, price: 350, popular: false },
];

const TokenWalletScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [reservedTokens, setReservedTokens] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const API_URL = 'http://192.168.1.10:5000/api';

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, []);

  const fetchBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/tokens/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.data.balance);
        setReservedTokens(Math.floor(data.data.balance * 0.2));
      }
    } catch (error) {
      console.log('Error fetching balance:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/tokens/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const formattedHistory = data.data.map(item => ({
          id: item.id.toString(),
          type: item.type,
          label: getTransactionLabel(item.type),
          date: new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          value: `${item.type === 'DEDUCTION' ? '-' : '+'}${item.amount} token${item.amount > 1 ? 's' : ''}`,
          icon: getTransactionIcon(item.type),
          color: getTransactionColor(item.type),
        }));
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.log('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'PURCHASE': return 'Achat de tokens';
      case 'DEDUCTION': return 'Mission complétée';
      case 'REWARD': return 'Avis 5 étoiles ⭐';
      default: return type;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'PURCHASE': return 'plus-circle';
      case 'DEDUCTION': return 'minus-circle';
      case 'REWARD': return 'star-circle';
      default: return 'circle';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'PURCHASE': return '#10B981';
      case 'DEDUCTION': return '#EF4444';
      case 'REWARD': return '#FFB300';
      default: return '#64748B';
    }
  };

  const purchaseTokens = async () => {
    if (!selectedPackage) {
      Alert.alert('Erreur', 'Veuillez sélectionner un forfait');
      return;
    }

    Alert.alert(
      'Confirmation',
      `Acheter ${selectedPackage.amount} tokens pour ${selectedPackage.price} MAD ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Acheter',
          onPress: async () => {
            setPurchasing(true);
            try {
              const token = await AsyncStorage.getItem('khidmati_token');
              const response = await fetch(`${API_URL}/tokens/buy`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount: selectedPackage.amount }),
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Succès', `${selectedPackage.amount} tokens achetés !`);
                setSelectedPackage(null);
                fetchBalance();
                fetchHistory();
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (error) {
              console.log('Error purchasing tokens:', error);
              Alert.alert('Erreur', 'Impossible d\'acheter des tokens');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const renderPackage = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.packageCard, 
        item.popular && styles.popularPackage,
        selectedPackage?.id === item.id && styles.selectedPackage
      ]}
      activeOpacity={0.8}
      onPress={() => setSelectedPackage(item)}
    >
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAIRE</Text>
        </View>
      )}
      {selectedPackage?.id === item.id && (
        <View style={styles.selectedCheck}>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
        </View>
      )}
      <MaterialCommunityIcons name="ticket" size={32} color={item.popular ? '#FFFFFF' : '#1A73E8'} />
      <Text style={[styles.packageAmount, item.popular && styles.textWhite]}>{item.amount} Tokens</Text>
      <Text style={[styles.packagePrice, item.popular && styles.textWhiteOpacity]}>{item.price} MAD</Text>
      <Text style={[styles.perToken, item.popular && styles.textWhiteOpacity]}>
        {(item.price / item.amount).toFixed(1)} MAD/token
      </Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={[styles.historyIconBg, { backgroundColor: `${item.color}15` }]}>
        <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyLabel}>{item.label}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
      <Text style={[styles.historyValue, { color: item.color }]}>{item.value}</Text>
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

  const usableTokens = balance - reservedTokens;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Tokens</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <MaterialCommunityIcons name="ticket" size={28} color="#FFFFFF" />
            <Text style={styles.balanceTitle}>Solde actuel</Text>
          </View>
          <Text style={styles.balanceValue}>
            {balance} <Text style={styles.balanceUnit}>Tokens</Text>
          </Text>
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceSubtext}>
              {reservedTokens} réservé — {usableTokens} utilisables
            </Text>
          </View>
        </View>

        {/* Purchase Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recharger mon compte</Text>
          <FlatList
            data={packages}
            renderItem={renderPackage}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packageList}
          />
          <TouchableOpacity 
            style={[styles.buyButton, (!selectedPackage || purchasing) && styles.buyButtonDisabled]} 
            activeOpacity={0.8}
            onPress={purchaseTokens}
            disabled={!selectedPackage || purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buyButtonText}>
                Acheter {selectedPackage?.amount || 0} tokens — {selectedPackage?.price || 0} MAD
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* History Section */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique des transactions</Text>
            <View style={styles.historyList}>
              {history.map((item) => (
                <View key={item.id}>
                  {renderHistoryItem({ item })}
                </View>
              ))}
            </View>
          </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  placeholder: { width: 40 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  balanceCard: { backgroundColor: '#1A73E8', borderRadius: 24, padding: 24, marginBottom: 32, shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  balanceTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  balanceValue: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
  balanceUnit: { fontSize: 18, fontWeight: '600', opacity: 0.8 },
  balanceFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', paddingTop: 12 },
  balanceSubtext: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 13 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191C23', marginBottom: 20 },
  packageList: { paddingBottom: 24 },
  packageCard: { width: 130, backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, marginRight: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  selectedPackage: { borderWidth: 2, borderColor: '#1A73E8', backgroundColor: '#F0F7FF' },
  selectedCheck: { position: 'absolute', top: -8, right: -8 },
  popularPackage: { backgroundColor: '#1A73E8', borderColor: '#1A73E8', transform: [{ scale: 1.02 }] },
  popularBadge: { position: 'absolute', top: -10, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  popularText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  packageAmount: { fontSize: 15, fontWeight: '700', color: '#191C23', marginTop: 12 },
  packagePrice: { fontSize: 13, color: '#64748B', marginTop: 4 },
  perToken: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  textWhite: { color: '#FFFFFF' },
  textWhiteOpacity: { color: 'rgba(255, 255, 255, 0.8)' },
  buyButton: { backgroundColor: '#1A73E8', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  buyButtonDisabled: { opacity: 0.6 },
  buyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  historyList: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 8 },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  historyIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1, marginLeft: 16 },
  historyLabel: { fontSize: 15, fontWeight: '700', color: '#191C23' },
  historyDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  historyValue: { fontSize: 15, fontWeight: '800' },
  bottomSpacer: { height: 40 },
});

export default TokenWalletScreen;