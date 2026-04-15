import React, { useState } from "react";
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
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState("");

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const CLOUDINARY_URL = process.env.EXPO_PUBLIC_CLOUDINARY_URL;
  const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;
  console.log(CLOUDINARY_PRESET);
  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre nom complet");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre email");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Erreur", "Email invalide");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre numero de telephone");
      return false;
    }
    if (role === "provider" && !avatar) {
      Alert.alert("Erreur", "Veuillez ajouter une photo de profil");
      return false;
    }
    if (!password) {
      Alert.alert("Erreur", "Veuillez entrer un mot de passe");
      return false;
    }
    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caracteres",
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return false;
    }
    return true;
  };

  const uploadAvatarToCloudinary = async (imageUri) => {
    if (!CLOUDINARY_URL || !CLOUDINARY_PRESET) {
      throw new Error("Missing Cloudinary env vars");
    }

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `provider_avatar_${Date.now()}.jpg`,
    });
    formData.append("upload_preset", CLOUDINARY_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    return data.secure_url;
  };

  const pickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Erreur",
          "Autorisez l'acces a la galerie pour ajouter une photo",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      setUploadingAvatar(true);
      const uploadedUrl = await uploadAvatarToCloudinary(result.assets[0].uri);
      setAvatar(uploadedUrl);
    } catch (error) {
      console.log("Avatar upload error:", error);
      Alert.alert("Erreur", "Impossible d'envoyer la photo vers Cloudinary");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      let url = "";
      let body = {};

      if (role === "client") {
        url = `${API_URL}/auth/client/register`;
        body = {
          name: fullName,
          email: email.trim().toLowerCase(),
          password,
          phone,
        };
      } else {
        url = `${API_URL}/auth/provider/register`;
        body = {
          name: fullName,
          email: email.trim().toLowerCase(),
          password,
          phone,
          avatar,
          description: "Description du prestataire",
          city: "Casablanca",
          category_id: 1,
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        const { user, accessToken } = data.data;

        await AsyncStorage.setItem("khidmati_token", accessToken);
        await AsyncStorage.setItem("khidmati_user", JSON.stringify(user));

        Alert.alert("Succes", "Compte cree avec succes!", [
          {
            text: "OK",
            onPress: () => {
              if (user.role === "CLIENT") {
                navigation.replace("HomeClient");
              } else if (user.role === "PROVIDER") {
                navigation.replace("ProviderDashboard");
              }
            },
          },
        ]);
      } else {
        Alert.alert("Erreur", data.message || "Echec de l'inscription");
      }
    } catch (error) {
      console.log("Register error:", error);
      Alert.alert(
        "Erreur",
        "Impossible de contacter le serveur. Verifiez que le backend est demarre.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🏠</Text>
            </View>
            <Text style={styles.title}>Creer un compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez la communaute Khdimati
            </Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleCard,
                role === "client" && styles.roleCardActive,
              ]}
              onPress={() => setRole("client")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roleIconBg,
                  role === "client" && styles.roleIconBgActive,
                ]}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={role === "client" ? "#FFFFFF" : "#64748B"}
                />
              </View>
              <Text
                style={[
                  styles.roleLabel,
                  role === "client" && styles.roleLabelActive,
                ]}
              >
                Je suis un Client
              </Text>
              {role === "client" && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#1A73E8" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleCard,
                role === "provider" && styles.roleCardActive,
              ]}
              onPress={() => setRole("provider")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.roleIconBg,
                  role === "provider" && styles.roleIconBgActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="tools"
                  size={24}
                  color={role === "provider" ? "#FFFFFF" : "#64748B"}
                />
              </View>
              <Text
                style={[
                  styles.roleLabel,
                  role === "provider" && styles.roleLabelActive,
                ]}
              >
                Je suis un Prestataire
              </Text>
              {role === "provider" && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#1A73E8" />
                </View>
              )}
            </TouchableOpacity>
          </View>

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
              <Text style={styles.label}>Telephone</Text>
              <TextInput
                style={styles.input}
                placeholder="0612345678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {role === "provider" && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Photo de profil</Text>
                <TouchableOpacity
                  style={styles.avatarUpload}
                  onPress={pickAvatar}
                  disabled={loading || uploadingAvatar}
                  activeOpacity={0.8}
                >
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      style={styles.avatarPreview}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons
                        name="image-outline"
                        size={28}
                        color="#1A73E8"
                      />
                      <Text style={styles.avatarPlaceholderText}>
                        Choisir une image
                      </Text>
                    </View>
                  )}
                  {uploadingAvatar && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.avatarHint}>
                  La photo est envoyee vers Cloudinary et son URL sera
                  enregistree dans avatar.
                </Text>
              </View>
            )}

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
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading || uploadingAvatar}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Deja un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
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
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#191C23",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  roleCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    position: "relative",
  },
  roleCardActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#1A73E8",
    shadowColor: "#1A73E8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  roleIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  roleIconBgActive: {
    backgroundColor: "#1A73E8",
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  roleLabelActive: {
    color: "#1A73E8",
  },
  checkBadge: {
    position: "absolute",
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
    fontWeight: "700",
    color: "#191C23",
    marginBottom: 8,
  },
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
  avatarUpload: {
    height: 170,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  avatarPlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#1A73E8",
  },
  avatarPreview: {
    width: "100%",
    height: "100%",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
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
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#191C23",
  },
  registerButton: {
    height: 56,
    backgroundColor: "#1A73E8",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#1A73E8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#64748B",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A73E8",
  },
});

export default RegisterScreen;
