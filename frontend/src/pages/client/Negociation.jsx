import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NegociationScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [booking, setBooking] = useState(null);
  const [negotiationCount, setNegotiationCount] = useState(0);
  
  const { bookingId } = route.params || {};
  const API_URL = 'http://192.168.1.10:5000/api';
  const scrollViewRef = useRef();

  useEffect(() => {
    if (bookingId) {
      fetchMessages();
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Messages response:', data);
      
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBooking(data.data);
        // Count existing negotiations
        if (data.data.negotiations) {
          setNegotiationCount(data.data.negotiations.length);
        }
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      } else {
        Alert.alert('Erreur', data.message || 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.log('Error sending message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const sendNegotiation = async (price) => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}/negotiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposed_price: price }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Succès', `Offre de ${price} MAD envoyée`);
        fetchMessages();
        fetchBookingDetails();
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      console.log('Error sending negotiation:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'offre');
    }
  };

  const acceptOffer = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}/accept`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Succès', 'Offre acceptée !');
        navigation.navigate('BookingDetail', { bookingId });
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      console.log('Error accepting offer:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter l\'offre');
    }
  };

  const rejectOffer = async () => {
    try {
      const token = await AsyncStorage.getItem('khidmati_token');
      
      const response = await fetch(`${API_URL}/bookings/${bookingId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Succès', 'Offre refusée');
        navigation.goBack();
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (error) {
      console.log('Error rejecting offer:', error);
      Alert.alert('Erreur', 'Impossible de refuser l\'offre');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentUserRole = async () => {
    const userData = await AsyncStorage.getItem('khidmati_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role;
    }
    return 'CLIENT';
  };

  const [userRole, setUserRole] = useState('CLIENT');
  
  useEffect(() => {
    getCurrentUserRole().then(setUserRole);
  }, []);

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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#191C23" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Négociation</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>NÉGOCIATION</Text>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="person" size={20} color="#1A73E8" />
              </View>
              <View>
                <Text style={styles.summaryName}>{booking?.provider_name || 'Prestataire'}</Text>
                <Text style={styles.summaryDetails}>
                  {booking?.category_name || 'Service'} — {booking?.booking_date ? new Date(booking.booking_date).toLocaleDateString() : ''}
                </Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix actuel:</Text>
              <Text style={styles.priceValue}>{booking?.agreed_price || booking?.estimated_price || 0} MAD</Text>
            </View>
          </View>

          <View style={styles.chatArea}>
            {messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyChatText}>Aucun message</Text>
                <Text style={styles.emptyChatSubtext}>Commencez la négociation</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageWrapper, 
                    msg.sender_role === 'CLIENT' ? styles.clientWrapper : styles.providerWrapper
                  ]}
                >
                  {msg.sender_role !== 'CLIENT' && (
                    <Text style={styles.senderLabel}>{msg.sender_name}</Text>
                  )}
                  <View style={[
                    styles.bubble, 
                    msg.sender_role === 'CLIENT' ? styles.clientBubble : styles.providerBubble
                  ]}>
                    <Text style={[
                      styles.messageText, 
                      msg.sender_role === 'CLIENT' ? styles.clientText : styles.providerText
                    ]}>
                      {msg.content}
                    </Text>
                    <Text style={[
                      styles.timestamp, 
                      msg.sender_role === 'CLIENT' ? styles.clientTime : styles.providerTime
                    ]}>
                      {formatTime(msg.created_at)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.roundCounterContainer}>
            <View style={styles.roundCounter}>
              <Ionicons name="alert-circle" size={16} color="#F97316" />
              <Text style={styles.roundCounterText}>
                {negotiationCount}/3 rounds utilisés
              </Text>
            </View>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.actionSection}>
          <Text style={styles.actionLabel}>Votre réponse:</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={acceptOffer}
            >
              <Text style={styles.acceptBtnText}>
                Accepter {booking?.agreed_price || booking?.estimated_price || 0} MAD ✓
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.offerBtn]}
              onPress={() => {
                Alert.prompt(
                  'Proposer un prix',
                  'Entrez votre contre-offre (MAD)',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { 
                      text: 'Envoyer', 
                      onPress: (price) => {
                        const numPrice = parseInt(price);
                        if (!isNaN(numPrice) && numPrice > 0) {
                          sendNegotiation(numPrice);
                        } else {
                          Alert.alert('Erreur', 'Prix invalide');
                        }
                      }
                    }
                  ],
                  'plain-text'
                );
              }}
            >
              <Text style={styles.offerBtnText}>Faire une offre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.refuseBtn]} 
              onPress={rejectOffer}
            >
              <Text style={styles.refuseBtnText}>Refuser ✗</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn]} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
          
          {/* Message input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Écrivez un message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B' },
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
  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyChatText: { fontSize: 16, fontWeight: '600', color: '#64748B', marginTop: 12 },
  emptyChatSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
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
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  actionBtn: { width: '48%', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  acceptBtn: { backgroundColor: '#10B981' },
  acceptBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  offerBtn: { backgroundColor: '#1A73E8' },
  offerBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  refuseBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  refuseBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  cancelBtn: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, maxHeight: 80, borderWidth: 1, borderColor: '#E2E8F0' },
  sendButton: { width: 44, height: 44, backgroundColor: '#1A73E8', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  sendButtonDisabled: { opacity: 0.5 },
  bottomSpacer: { height: 20 },
});

export default NegociationScreen;