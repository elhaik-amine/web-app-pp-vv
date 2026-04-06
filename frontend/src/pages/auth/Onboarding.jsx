import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Dimensions, FlatList,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Trouvez le bon pro',
    subtitle: 'Accédez à des centaines de prestataires vérifiés près de chez vous',
    illustration: '🔍',
  },
  {
    id: '2',
    title: 'Négociez le prix',
    subtitle: 'Discutez directement avec le prestataire et trouvez le meilleur prix',
    illustration: '💬',
  },
  {
    id: '3',
    title: 'Mission validée par QR',
    subtitle: 'Scannez le QR à la fin pour valider la mission en toute sécurité',
    illustration: '📱',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef(null);

  const updateCurrentSlideIndex = (e) => {
    const currentIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlideIndex(currentIndex);
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentSlideIndex + 1;
    if (nextSlideIndex < slides.length) {
      flatListRef?.current?.scrollToOffset({ offset: nextSlideIndex * width });
      setCurrentSlideIndex(nextSlideIndex);
    } else {
      navigation.replace('Login');
    }
  };

  const skip = () => navigation.replace('Login');

  const Slide = ({ item }) => (
    <View style={styles.slideContainer}>
      <View style={styles.illustrationContainer}>
        <Text style={styles.illustrationText}>{item.illustration}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipTop} onPress={skip}>
        <Text style={styles.skipTopText}>Passer</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        showsHorizontalScrollIndicator={false}
        horizontal
        data={slides}
        pagingEnabled
        renderItem={({ item }) => <Slide item={item} />}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footerContainer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlideIndex === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={goToNextSlide} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentSlideIndex === slides.length - 1 ? 'Commencer 🚀' : 'Suivant →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  skipTop: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 16 },
  skipTopText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  slideContainer: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  illustrationContainer: { height: height * 0.4, justifyContent: 'center', alignItems: 'center' },
  illustrationText: { fontSize: 120 },
  textContainer: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#191C23', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  footerContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  indicator: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  activeIndicator: { backgroundColor: '#1A73E8', width: 24 },
  nextButton: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: '#1A73E8', justifyContent: 'center',
    alignItems: 'center', elevation: 8,
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default OnboardingScreen;