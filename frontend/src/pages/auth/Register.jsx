import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  
  // Common fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Erreur', 'Email invalide');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return false;
    }
    if (!password) {
      Alert.alert('Erreur', 'Veuillez entrer un mot de passe');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      let url = '';
      let body = {};

      if (role === 'client') {
        // CORRECT ENDPOINT for client
        url = `${API_URL}/auth/client/register`;
        body = {
          name: fullName,
          email: email.trim().toLowerCase(),
          password: password,
          phone: phone,
        };
      } else {
        // CORRECT ENDPOINT for provider
        url = `${API_URL}/auth/provider/register`;
        body = {
          name: fullName,
          email: email.trim().toLowerCase(),
          password: password,
          phone: phone,
          avatar: 'https://via.placeholder.com/150',
          description: 'Description du prestataire',
          city: 'Casablanca',
          category_id: 1,
        };
      }

      console.log('Calling:', url);
      console.log('Body:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        const { user, accessToken } = data.data;
        
        await AsyncStorage.setItem('khidmati_token', accessToken);
        await AsyncStorage.setItem('khidmati_user', JSON.stringify(user));
        
        Alert.alert('Succès', 'Compte créé avec succès!', [
          {
            text: 'OK',
            onPress: () => {
              if (user.role === 'CLIENT') {
                navigation.replace('HomeClient');
              } else if (user.role === 'PROVIDER') {
                navigation.replace('ProviderDashboard');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Erreur', data.message || 'Échec de l\'inscription');
      }
    } catch (error) {
      console.log('Register error:', error);
      Alert.alert('Erreur', 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🏠</Text>
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez la communauté Khdimati</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'client' && styles.roleCardActive]}
              onPress={() => setRole('client')}
              activeOpacity={0.7}
            >
              <View style={[styles.roleIconBg, role === 'client' && styles.roleIconBgActive]}>
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={role === 'client' ? '#FFFFFF' : '#64748B'} 
                />
              </View>
              <Text style={[styles.roleLabel, role === 'client' && styles.roleLabelActive]}>
                Je suis un Client
              </Text>
              {role === 'client' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#1A73E8" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'provider' && styles.roleCardActive]}
              onPress={() => setRole('provider')}
              activeOpacity={0.7}
            >
              <View style={[styles.roleIconBg, role === 'provider' && styles.roleIconBgActive]}>
                <MaterialCommunityIcons 
                  name="tools" 
                  size={24} 
                  color={role === 'provider' ? '#FFFFFF' : '#64748B'} 
                />
              </View>
              <Text style={[styles.roleLabel, role === 'provider' && styles.roleLabelActive]}>
                Je suis un Prestataire
              </Text>
              {role === 'provider' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#1A73E8" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={styles.input}
                placeholder="Ahmed Benani"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="0612345678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#191C23',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  roleCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  roleCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1A73E8',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  roleIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleIconBgActive: {
    backgroundColor: '#1A73E8',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  roleLabelActive: {
    color: '#1A73E8',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C23',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#191C23',
    backgroundColor: '#F8FAFC',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#191C23',
  },
  registerButton: {
    height: 56,
    backgroundColor: '#1A73E8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A73E8',
  },
});

export default RegisterScreen;
