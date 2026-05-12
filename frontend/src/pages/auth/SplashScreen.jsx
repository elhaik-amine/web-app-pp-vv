import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const appLogo = require("../../../public/logo.png");

const SplashScreen = ({ navigation }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the dots
    const animate = (val, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);

    const navigateNext = async () => {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');

      setTimeout(() => {
        navigation.replace(onboardingCompleted === 'true' ? 'Login' : 'Onboarding');
      }, 2500);
    };
    
    navigateNext();
  }, [dot1, dot2, dot3, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A73E8" />
      <View style={styles.centerContent}>
        <View style={styles.logoSquare}>
          <Image source={appLogo} style={styles.logoImage} />
        </View>
        <Text style={styles.appName}>Khdimati</Text>
        <Text style={styles.tagline}>Votre maison entre de bonnes mains</Text>
      </View>
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 100,
  },
  logoSquare: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 5,
  },
  logoImage: { width: 64, height: 64, resizeMode: 'contain' },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
});

export default SplashScreen;
