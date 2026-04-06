import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const EndMissionPhotosScreen = ({ navigation }) => {
  const [afterPhotos, setAfterPhotos] = useState([
    { id: '1', uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200&auto=format&fit=crop', captured: true },
    { id: '2', uri: null, captured: false },
  ]);

  const beforePhotos = [
    { id: 'b1', uri: 'https://images.unsplash.com/photo-1595467795924-279093847524?q=80&w=200&auto=format&fit=crop' },
    { id: 'b2', uri: 'https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=200&auto=format&fit=crop' },
  ];

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
        <Text style={styles.headerTitle}>Photos de fin de mission</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>QR SCANNÉ ✓</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.successText}>
            QR validé à 14:32 — Uploadez maintenant les photos après
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Comparaison Avant / Après</Text>

        {/* Comparison Grid */}
        <View style={styles.comparisonGrid}>
          {/* Header Row */}
          <View style={styles.gridHeader}>
            <Text style={[styles.columnLabel, styles.beforeLabel]}>AVANT</Text>
            <Text style={[styles.columnLabel, styles.afterLabel]}>APRÈS</Text>
          </View>

          {/* Photos Row 1 */}
          <View style={styles.photoRow}>
            <View style={styles.photoContainer}>
              <Image source={{ uri: beforePhotos[0].uri }} style={styles.photo} />
            </View>
            <TouchableOpacity style={[styles.photoContainer, styles.cameraBox]}>
              <Image source={{ uri: afterPhotos[0].uri }} style={styles.photo} />
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Photos Row 2 */}
          <View style={styles.photoRow}>
            <View style={styles.photoContainer}>
              <Image source={{ uri: beforePhotos[1].uri }} style={styles.photo} />
            </View>
            <TouchableOpacity style={[styles.photoContainer, styles.cameraBox, styles.emptyBox]}>
              <Ionicons name="camera" size={32} color="#1A73E8" />
              <Text style={styles.cameraText}>Prendre photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="camera-outline" size={20} color="#F97316" />
          <Text style={styles.infoText}>
            Photos via caméra uniquement — galerie désactivée pour garantir l'authenticité.
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressValue}>1/2 photos minimum</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '50%' }]} />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.finishButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Avis')}
        >
          <Text style={styles.finishButtonText}>Terminer la mission ✓</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#191C23',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 24,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 32,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C23',
    marginBottom: 20,
  },
  comparisonGrid: {
    marginBottom: 32,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  columnLabel: {
    width: '48%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 6,
    borderRadius: 8,
  },
  beforeLabel: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
  },
  afterLabel: {
    backgroundColor: '#DCFCE7',
    color: '#10B981',
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  cameraBox: {
    borderWidth: 2,
    borderColor: '#1A73E8',
    borderStyle: 'dashed',
    position: 'relative',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 115, 232, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  cameraText: {
    fontSize: 12,
    color: '#1A73E8',
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#9A3412',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C23',
  },
  progressValue: {
    fontSize: 12,
    color: '#64748B',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  finishButton: {
    backgroundColor: '#10B981',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default EndMissionPhotosScreen;