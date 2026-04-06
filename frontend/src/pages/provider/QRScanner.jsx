import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const QRScannerScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" transparent />
      
      {/* Mock Camera View Background */}
      <View style={styles.cameraView}>
        {/* Semi-transparent overlays for the scanning effect */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            {/* Corner Brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Scanning Line Animation Placeholder */}
            <View style={styles.scanLine} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Content Layer */}
      <SafeAreaView style={styles.contentLayer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner QR Client</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.instructionText}>Pointez la caméra vers le QR du client</Text>

        {/* Bottom Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.missionLabelContainer}>
            <View style={styles.pulseDot} />
            <Text style={styles.missionLabel}>Mission en cours</Text>
          </View>

          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.avatarText}>KM</Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>Karim M.</Text>
              <Text style={styles.missionDetails}>Plomberie — 15 Oct 12:00-15:00</Text>
            </View>
            <Text style={styles.priceText}>230 MAD</Text>
          </View>

          <TouchableOpacity 
            style={styles.scanButton} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('UploadPhotos')}
          >
            <Text style={styles.scanButtonText}>Scanner le QR de fin ✓</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>Le QR ne sera actif qu'à partir de 12:00</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayRow: {
    flexDirection: 'row',
    height: 260,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 260,
    height: 260,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  overlayBottom: {
    flex: 1.5,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#1A73E8',
    top: '50%',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  contentLayer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  instructionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  missionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  missionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A73E8',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#191C23',
  },
  missionDetails: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A73E8',
  },
  scanButton: {
    backgroundColor: '#1A73E8',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default QRScannerScreen;