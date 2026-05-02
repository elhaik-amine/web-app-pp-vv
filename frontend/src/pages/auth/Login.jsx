import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../context/AuthContext";

const appLogo = require("../../../public/logo.png");

const LoginScreen = ({ navigation }) => {
  const { setUserRole } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  console.log(API_URL);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
      // Try client login first (this works for admin too)
      const response = await fetch(`${API_URL}/auth/client/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        const { user, accessToken } = data.data;

        await AsyncStorage.setItem("khidmati_token", accessToken);
        await AsyncStorage.setItem("khidmati_user", JSON.stringify(user));
        await AsyncStorage.setItem("khidmati_role", user.role);
        setUserRole(user.role);

        console.log("User role:", user.role);

        // Navigate based on role - CHANGE THIS LINE
        if (user.role === "CLIENT") {
          navigation.replace("ClientApp");
        } else if (user.role === "PROVIDER") {
          navigation.replace("ProviderApp");
        } else if (user.role === "ADMIN") {
          navigation.replace("AdminApp");
        } else {
          Alert.alert("Erreur", "Rôle utilisateur non reconnu");
        }
      } else {
        // Try provider login as fallback
        const providerResponse = await fetch(`${API_URL}/auth/provider/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: password }),
        });

        const providerData = await providerResponse.json();

        if (providerData.success) {
          const { user, accessToken } = providerData.data;

          await AsyncStorage.setItem("khidmati_token", accessToken);
          await AsyncStorage.setItem("khidmati_user", JSON.stringify(user));
          await AsyncStorage.setItem("khidmati_role", user.role);
          setUserRole(user.role);

          if (user.role === "PROVIDER") {
            navigation.replace("ProviderApp");
          } else if (user.role === "CLIENT") {
            navigation.replace("ClientApp");
          } else if (user.role === "ADMIN") {
            navigation.replace("AdminApp");
          }
        } else {
          Alert.alert("Erreur", "Email ou mot de passe incorrect");
        }
      }
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Erreur", "Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={appLogo} style={styles.logoImage} />
            </View>
            <Text style={styles.appName}>Khdimati</Text>
            <Text style={styles.greeting}>Bon retour 👋</Text>
          </View>

          {/* Social */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU AVEC EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#A0AEC0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[styles.checkbox, rememberMe && styles.checkboxActive]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Se souvenir de moi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Nouveau sur Khdimati ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.signUpText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
  header: { alignItems: "center", marginBottom: 40 },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  logoImage: { width: 52, height: 52, resizeMode: "contain" },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A73E8",
    marginBottom: 8,
  },
  greeting: { fontSize: 20, fontWeight: "600", color: "#191C23" },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#191C23",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  form: { marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#191C23", marginBottom: 8 },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#191C23",
    backgroundColor: "#F8FAFC",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
  },
  passwordInput: { flex: 1, fontSize: 16, color: "#191C23" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  checkboxContainer: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  checkboxLabel: { fontSize: 14, color: "#64748B" },
  forgotPassword: { fontSize: 14, fontWeight: "600", color: "#1A73E8" },
  loginButton: {
    height: 56,
    backgroundColor: "#1A73E8",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 14, color: "#64748B" },
  signUpText: { fontSize: 14, fontWeight: "700", color: "#1A73E8" },
});

export default LoginScreen;
