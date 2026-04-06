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

const packages = [
  { id: '1', amount: 5, price: 50, popular: false },
  { id: '2', amount: 10, price: 90, popular: true },
  { id: '3', amount: 20, price: 160, popular: false },
];

const history = [
  {
    id: '1',
    type: 'PURCHASE',
    label: 'Achat de tokens',
    date: '18 Oct, 14:20',
    value: '+5 tokens',
    icon: 'plus-circle',
    color: '#10B981',
  },
  {
    id: '2',
    type: 'REWARD',
    label: 'Avis 5 étoiles ⭐',
    date: '15 Oct, 16:45',
    value: '+0.5 token',
    icon: 'star-circle',
    color: '#FFB300',
  },
  {
    id: '3',
    type: 'DEDUCTION',
    label: 'Mission complétée',
    date: '15 Oct, 12:30',
    value: '-1 token',
    icon: 'minus-circle',
    color: '#EF4444',
  },
  {
    id: '4',
    type: 'PURCHASE',
    label: 'Achat de tokens',
    date: '10 Oct, 09:15',
    value: '+10 tokens',
    icon: 'plus-circle',
    color: '#10B981',
  },
];

const TokenWalletScreen = ({ navigation }) => {
  const renderPackage = ({ item }) => (
    <TouchableOpacity 
      style={[styles.packageCard, item.popular && styles.popularPackage]}
      activeOpacity={0.8}
      onPress={() => {
        // Package selection logic would go here
        // For now, just select the package
      }}
    >
      {item.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAIRE</Text>
        </View>
      )}
      <MaterialCommunityIcons name="toll" size={32} color={item.popular ? '#FFFFFF' : '#1A73E8'} />
      <Text style={[styles.packageAmount, item.popular && styles.textWhite]}>{item.amount} Tokens</Text>
      <Text style={[styles.packagePrice, item.popular && styles.textWhiteOpacity]}>{item.price} MAD</Text>
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
        <Text style={styles.headerTitle}>Mes Tokens</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <MaterialCommunityIcons name="toll" size={28} color="#FFFFFF" />
            <Text style={styles.balanceTitle}>Solde actuel</Text>
          </View>
          <Text style={styles.balanceValue}>4.5 <Text style={styles.balanceUnit}>Tokens</Text></Text>
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceSubtext}>1 réservé — 3.5 utilisables</Text>
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
            style={styles.buyButton} 
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buyButtonText}>Acheter maintenant</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  balanceCard: {
    backgroundColor: '#1A73E8',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  balanceUnit: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },
  balanceFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  balanceSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C23',
    marginBottom: 20,
  },
  packageList: {
    paddingBottom: 24,
  },
  packageCard: {
    width: 130,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  popularPackage: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
    transform: [{ scale: 1.05 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  packageAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C23',
    marginTop: 12,
  },
  packagePrice: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textWhiteOpacity: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buyButton: {
    backgroundColor: '#1A73E8',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  historyList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  historyIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  historyLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C23',
  },
  historyDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default TokenWalletScreen;