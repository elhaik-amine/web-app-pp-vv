import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const messages = [
  { id: '1', type: 'client', text: 'Prix proposé: 200 MAD', time: '14:30' },
  { id: '2', type: 'provider', text: 'Contre-offre: 250 MAD', time: '14:35', sender: 'Ahmed B.' },
  { id: '3', type: 'client', text: 'Contre-offre: 220 MAD', time: '14:40' },
];

const NegociationScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Négociation</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>NÉGOCIATION</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="person" size={20} color="#1A73E8" />
            </View>
            <View>
              <Text style={styles.summaryName}>Ahmed B.</Text>
              <Text style={styles.summaryDetails}>Plomberie — 15 Oct, 12:00-15:00</Text>
            </View>
          </View>
        </View>

        <View style={styles.chatArea}>
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageWrapper, msg.type === 'client' ? styles.clientWrapper : styles.providerWrapper]}>
              {msg.type === 'provider' && <Text style={styles.senderLabel}>{msg.sender}</Text>}
              <View style={[styles.bubble, msg.type === 'client' ? styles.clientBubble : styles.providerBubble]}>
                <Text style={[styles.messageText, msg.type === 'client' ? styles.clientText : styles.providerText]}>{msg.text}</Text>
                <Text style={[styles.timestamp, msg.type === 'client' ? styles.clientTime : styles.providerTime]}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.roundCounterContainer}>
          <View style={styles.roundCounter}>
            <Ionicons name="alert-circle" size={16} color="#F97316" />
            <Text style={styles.roundCounterText}>2/3 rounds utilisés</Text>
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.actionSection}>
        <Text style={styles.actionLabel}>Votre réponse:</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => navigation.navigate('BookingDetail')}>
            <Text style={styles.acceptBtnText}>Accepter 250 MAD ✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.offerBtn]}>
            <Text style={styles.offerBtnText}>Faire une offre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.refuseBtn]}>
            <Text style={styles.refuseBtnText}>Refuser ✗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  statusBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { color: '#C2410C', fontSize: 10, fontWeight: '800' },
  scrollContent: { padding: 24 },
  summaryCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E0EEFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryName: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  summaryDetails: { fontSize: 12, color: '#64748B' },
  chatArea: { marginBottom: 24 },
  messageWrapper: { marginBottom: 16, maxWidth: '85%' },
  clientWrapper: { alignSelf: 'flex-end' },
  providerWrapper: { alignSelf: 'flex-start' },
  senderLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4, marginLeft: 4 },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  clientBubble: { backgroundColor: '#1A73E8', borderBottomRightRadius: 4 },
  providerBubble: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, marginBottom: 4 },
  clientText: { color: '#FFFFFF' },
  providerText: { color: '#191C23' },
  timestamp: { fontSize: 10, textAlign: 'right' },
  clientTime: { color: 'rgba(255,255,255,0.7)' },
  providerTime: { color: '#94A3B8' },
  roundCounterContainer: { alignItems: 'center', marginBottom: 32 },
  roundCounter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roundCounterText: { color: '#F97316', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  actionSection: { padding: 24, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#191C23', marginBottom: 16 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  acceptBtn: { backgroundColor: '#10B981' },
  acceptBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  offerBtn: { backgroundColor: '#1A73E8' },
  offerBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  refuseBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  refuseBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  cancelBtn: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  bottomSpacer: { height: 20 },
});

export default NegociationScreen;