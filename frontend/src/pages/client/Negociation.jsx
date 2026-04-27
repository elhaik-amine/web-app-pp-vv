import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const NegociationScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [myRounds, setMyRounds] = useState(0);

  const { bookingId } = route.params || {};
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  const scrollViewRef = useRef();
  const socketRef = useRef(null);
  const acceptingRef = useRef(false);
  const confirmedAlertShownRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      await loadUserData();
      if (bookingId) {
        await Promise.all([fetchMessages(), fetchBookingDetails(), fetchMyRounds()]);
      }
      setLoading(false);
    };
    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId || !userId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', userId);
      socket.emit('join:booking', bookingId);
    });

    socket.on('negotiation:new', (message) => {
      setMessages(prev => [...prev, message]);
      fetchBookingDetails();
      fetchMyRounds();
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('booking:confirmed', ({ agreed_price }) => {
      if (confirmedAlertShownRef.current) return;
      confirmedAlertShownRef.current = true;
      Alert.alert('Succès', `Réservation confirmée avec le prix de ${agreed_price} MAD !`);
      navigation.goBack();
    });

    return () => {
      socket.emit('leave:booking', bookingId);
      socket.disconnect();
    };
  }, [bookingId, userId]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('khidmati_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
        setUserId(user.id);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBooking(data.data);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const fetchMyRounds = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const myOffers = data.data.filter(m => m.is_negotiation && Number(m.sender_id) === Number(userId));
        setMyRounds(myOffers.length);
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const sendNegotiation = async (price) => {
    if (myRounds >= 3) {
      Alert.alert('Limite', 'Vous avez utilisé vos 3 rounds');
      return;
    }
    
    setSendingOffer(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/offer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposed_price: price }),
      });

      const data = await response.json();

      if (data.success) {
        setOfferPrice('');
        setModalVisible(false);
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer');
    } finally {
      setSendingOffer(false);
    }
  };

  const getLatestPrice = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].is_negotiation && Number(messages[i].proposed_price) > 0) {
        return Number(messages[i].proposed_price);
      }
    }
    return Number(booking?.estimated_price || booking?.agreed_price || 0);
  };

  const acceptOffer = async () => {
    if (acceptingRef.current) {
      return;
    }

    const price = getLatestPrice();
    if (!price || price <= 0) {
      Alert.alert('Erreur', 'Aucune offre à accepter');
      return;
    }

    acceptingRef.current = true;
    setAccepting(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/accept-price`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: price }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.data.bothAccepted) {
          if (confirmedAlertShownRef.current) {
            return;
          }

          confirmedAlertShownRef.current = true;
          Alert.alert('Succès', 'Prix accepté par les deux parties ! Réservation confirmée.');
          navigation.goBack();
        } else {
          Alert.alert('Succès', 'Prix accepté. En attente de l\'acceptation de l\'autre partie.');
          fetchMessages();
          fetchBookingDetails();
        }
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accepter');
    } finally {
      acceptingRef.current = false;
      setAccepting(false);
    }
  };

  const rejectPriceOffer = async () => {
    setRejecting(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      const response = await fetch(`${API_URL}/bookings/${bookingId}/reject-price`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Succès', 'Prix refusé. La négociation continue.');
        fetchMessages();
        fetchBookingDetails();
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de refuser');
    } finally {
      setRejecting(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      </SafeAreaView>
    );
  }

  const currentPrice = getLatestPrice();
  const roundsLeft = 3 - myRounds;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#191C23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Négociation</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{booking?.status || 'NÉGOCIATION'}</Text>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="person" size={20} color="#1A73E8" />
            </View>
            <View>
              <Text style={styles.summaryName}>
                {userRole === 'PROVIDER' ? booking?.client_name : booking?.provider_name}
              </Text>
              <Text style={styles.summaryDetails}>
                {booking?.category_name} — {booking?.date_meeting ? new Date(booking.date_meeting).toLocaleDateString() : ''}
              </Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix actuel:</Text>
            <Text style={styles.priceValue}>{currentPrice} MAD</Text>
          </View>
        </View>

        <View style={styles.chatArea}>
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyChatText}>Aucune offre</Text>
            </View>
          ) : (
            messages.filter(m => m.is_negotiation).map((msg) => {
              const isMine = Number(msg.sender_id) === Number(userId);
              return (
                <View key={msg.id} style={[styles.messageWrapper, isMine ? styles.clientWrapper : styles.providerWrapper]}>
                  {!isMine && <Text style={styles.senderLabel}>{msg.sender_name}</Text>}
                  <View style={[styles.bubble, isMine ? styles.clientBubble : styles.providerBubble]}>
                    <Text style={styles.messageText}>Offre: {Number(msg.proposed_price)} MAD</Text>
                    <Text style={styles.timestamp}>{formatTime(msg.created_at)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.roundCounterContainer}>
          <View style={styles.roundCounter}>
            <Ionicons name="alert-circle" size={16} color={roundsLeft === 0 ? "#EF4444" : "#F97316"} />
            <Text style={styles.roundCounterText}>Vos rounds: {myRounds}/3 ({roundsLeft} restants)</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionSection}>
        <Text style={styles.actionLabel}>Votre réponse:</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={acceptOffer} disabled={accepting}>
            {accepting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.acceptBtnText}>Accepter {currentPrice} MAD ✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.offerBtn, roundsLeft === 0 && styles.buttonDisabled]} onPress={() => setModalVisible(true)} disabled={roundsLeft === 0}>
            <Text style={styles.offerBtnText}>Faire une offre ({roundsLeft})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.refuseBtn]} onPress={rejectPriceOffer} disabled={rejecting}>
            {rejecting ? <ActivityIndicator size="small" color="#EF4444" /> : <Text style={styles.refuseBtnText}>Refuser ✗</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Proposer un prix</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="Ex: 250" value={offerPrice} onChangeText={setOfferPrice} autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => { setModalVisible(false); setOfferPrice(''); }}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSendButton]} onPress={() => {
                const price = parseInt(offerPrice);
                if (price > 0) sendNegotiation(price);
                else Alert.alert('Erreur', 'Prix invalide');
              }} disabled={sendingOffer}>
                {sendingOffer ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalSendText}>Envoyer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#191C23' },
  statusBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { color: '#C2410C', fontSize: 10, fontWeight: '800' },
  scrollContent: { padding: 24, paddingBottom: 20 },
  summaryCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E0EEFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryName: { fontSize: 16, fontWeight: '700', color: '#191C23' },
  summaryDetails: { fontSize: 12, color: '#64748B' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#1A73E8' },
  chatArea: { marginBottom: 24, minHeight: 200 },
  emptyChat: { alignItems: 'center', paddingVertical: 40 },
  emptyChatText: { fontSize: 16, fontWeight: '600', color: '#64748B', marginTop: 12 },
  messageWrapper: { marginBottom: 16, maxWidth: '85%' },
  clientWrapper: { alignSelf: 'flex-end' },
  providerWrapper: { alignSelf: 'flex-start' },
  senderLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4, marginLeft: 4 },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  clientBubble: { backgroundColor: '#1A73E8', borderBottomRightRadius: 4 },
  providerBubble: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, marginBottom: 4, color: '#FFF' },
  timestamp: { fontSize: 10, textAlign: 'right', color: 'rgba(255,255,255,0.7)' },
  roundCounterContainer: { alignItems: 'center', marginBottom: 32 },
  roundCounter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roundCounterText: { color: '#F97316', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  actionSection: { padding: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#191C23', marginBottom: 16 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  acceptBtn: { backgroundColor: '#10B981' },
  acceptBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  offerBtn: { backgroundColor: '#1A73E8' },
  offerBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  refuseBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  refuseBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  cancelBtn: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#191C23', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  modalInput: { width: '100%', height: 56, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, textAlign: 'center', backgroundColor: '#F8FAFC' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, width: '100%' },
  modalButton: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  modalCancelButton: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  modalSendButton: { backgroundColor: '#1A73E8' },
  modalSendText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default NegociationScreen;
