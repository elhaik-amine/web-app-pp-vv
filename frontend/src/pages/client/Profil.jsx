import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fes",
  "Tangier",
  "Agadir",
  "Meknes",
  "Oujda",
  "Kenitra",
  "Tetouan",
  "Safi",
  "El Jadida",
];

const SERVICE_CATEGORIES = [
  "Plomberie",
  "Électricité",
  "Ménage",
  "Jardinage",
  "Climatisation",
  "Peinture",
  "Menuiserie",
  "Plâtrerie",
];

const UserProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [userRole, setUserRole] = useState("client");

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const CLOUDINARY_URL = process.env.EXPO_PUBLIC_CLOUDINARY_URL;
  const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const uploadImageToCloudinary = async (imageUri) => {
    try {
      setUploadingImage(true);

      // Create form data
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: `avatar_${Date.now()}.jpg`,
      });
      formData.append("upload_preset", CLOUDINARY_PRESET);

      // Upload to Cloudinary
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.log("Error uploading to Cloudinary:", error);
      Alert.alert("Erreur", "Impossible de télécharger l'image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("khidmati_token");
      const storedUser = await AsyncStorage.getItem("khidmati_user");

      if (!token) {
        navigation.replace("Login");
        return;
      }

      // First endpoint: GET /api/users/me
      const userResponse = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const userData = await userResponse.json();

      if (userData.success) {
        const userInfo = userData.data;
        setUser(userInfo);
        setFullName(userInfo.name || "");
        setPhone(userInfo.phone || "");
        setEmail(userInfo.email || "");
        setAvatar(userInfo.avatar);
        setUserRole(userInfo.role?.toLowerCase() || "client");

        // If user is provider, fetch provider profile
        if (userInfo.role?.toLowerCase() === "provider") {
          await fetchProviderProfile(userInfo.id, token);
        }
      } else if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFullName(parsedUser.name || "");
        setPhone(parsedUser.phone || "");
        setEmail(parsedUser.email || "");
        setAvatar(parsedUser.avatar);
        setUserRole(parsedUser.role?.toLowerCase() || "client");

        if (parsedUser.role?.toLowerCase() === "provider") {
          await fetchProviderProfile(parsedUser.id, token);
        }
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
      const storedUser = await AsyncStorage.getItem("khidmati_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFullName(parsedUser.name || "");
        setPhone(parsedUser.phone || "");
        setEmail(parsedUser.email || "");
        setAvatar(parsedUser.avatar);
        setUserRole(parsedUser.role?.toLowerCase() || "client");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderProfile = async (userId, token) => {
    try {
      // Second endpoint: GET /api/providers/:id
      const providerResponse = await fetch(`${API_URL}/providers/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const providerData = await providerResponse.json();

      if (providerData.success) {
        const profile = providerData.data;
        setProviderProfile(profile);
        setCity(profile.city || "");
        setDescription(profile.description || "");
        setCategoryId(profile.category_id?.toString() || "");
      }
    } catch (error) {
      console.log("Error fetching provider profile:", error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Vous devez autoriser l'accès à la galerie",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      // First upload to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary(result.assets[0].uri);
      if (cloudinaryUrl) {
        setAvatar(cloudinaryUrl);
        // Then save profile with Cloudinary URL
        await saveProfile(cloudinaryUrl);
      }
    }
  };

  const saveProfile = async (newAvatarUrl = null) => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("khidmati_token");

      // Prepare user update data (common for both client and provider)
      const userUpdateData = {
        name: fullName,
        phone: phone,
      };

      if (newAvatarUrl) {
        userUpdateData.avatar = newAvatarUrl;
      }

      // First endpoint: PUT /api/users/me
      const userResponse = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userUpdateData),
      });

      const userData = await userResponse.json();

      if (!userData.success) {
        Alert.alert(
          "Erreur",
          userData.message ||
            "Erreur lors de la mise à jour du profil utilisateur",
        );
        return;
      }

      // If user is a provider, update provider profile
      if (userRole === "provider" && user && user.id) {
        const providerUpdateData = {
          city: city,
          description: description,
          category_id: parseInt(categoryId),
        };

        // Second endpoint: PUT /api/providers/:id
        const providerResponse = await fetch(
          `${API_URL}/providers/${user.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(providerUpdateData),
          },
        );

        const providerData = await providerResponse.json();

        if (!providerData.success) {
          Alert.alert(
            "Erreur",
            providerData.message ||
              "Erreur lors de la mise à jour du profil prestataire",
          );
          return;
        }
      }

      // Update local storage
      const storedUser = await AsyncStorage.getItem("khidmati_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const updatedUser = {
          ...parsed,
          ...userUpdateData,
        };
        await AsyncStorage.setItem(
          "khidmati_user",
          JSON.stringify(updatedUser),
        );
      }

      Alert.alert("Succès", "Profil mis à jour avec succès");
    } catch (error) {
      console.log("Error saving profile:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("khidmati_token");
          await AsyncStorage.removeItem("khidmati_user");
          navigation.replace("Login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: "1",
      title: "Mes Réservations",
      icon: "calendar-outline",
      route: "MesReservations",
    },
    {
      id: "2",
      title: "Notifications",
      icon: "notifications-outline",
      route: "Notifications",
    },
    {
      id: "3",
      title: "Aide & Support",
      icon: "help-circle-outline",
      route: null,
    },
    {
      id: "4",
      title: "Conditions d'utilisation",
      icon: "document-text-outline",
      route: null,
    },
  ];

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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={pickImage}
            disabled={uploadingImage}
          >
            <Ionicons name="camera-outline" size={24} color="#191C23" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    avatar || "https://randomuser.me/api/portraits/men/32.jpg",
                }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.editBadge}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{email}</Text>
            {userRole === "provider" && (
              <View style={styles.providerBadge}>
                <MaterialCommunityIcons
                  name="tools"
                  size={14}
                  color="#1A73E8"
                />
                <Text style={styles.providerBadgeText}>Prestataire</Text>
              </View>
            )}
          </View>

          {/* Edit Fields */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!saving}
                  placeholder="Votre nom complet"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!saving}
                  placeholder="Votre numéro de téléphone"
                />
              </View>
            </View>

            {/* Provider-specific fields */}
            {userRole === "provider" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Catégorie de service *</Text>
                  <View style={styles.categoryList}>
                    {SERVICE_CATEGORIES.map((cat, index) => {
                      const catId = index + 1;
                      return (
                        <TouchableOpacity
                          key={catId}
                          style={[
                            styles.categoryChip,
                            categoryId === catId.toString() &&
                              styles.categoryChipActive,
                          ]}
                          onPress={() => setCategoryId(catId.toString())}
                          disabled={saving}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              categoryId === catId.toString() &&
                                styles.categoryChipTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ville *</Text>
                  <View style={styles.cityList}>
                    {MOROCCAN_CITIES.map((cityOption) => (
                      <TouchableOpacity
                        key={cityOption}
                        style={[
                          styles.cityChip,
                          city === cityOption && styles.cityChipActive,
                        ]}
                        onPress={() => setCity(cityOption)}
                        disabled={saving}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.cityChipText,
                            city === cityOption && styles.cityChipTextActive,
                          ]}
                        >
                          {cityOption}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description des services</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Décrivez vos services, votre expérience, etc..."
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                    editable={!saving}
                  />
                </View>
              </>
            )}

            {/* Client-specific fields
            {userRole === "client" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ville</Text>
                <View style={styles.cityList}>
                  {MOROCCAN_CITIES.map((cityOption) => (
                    <TouchableOpacity
                      key={cityOption}
                      style={[
                        styles.cityChip,
                        city === cityOption && styles.cityChipActive,
                      ]}
                      onPress={() => setCity(cityOption)}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.cityChipText,
                          city === cityOption && styles.cityChipTextActive,
                        ]}
                      >
                        {cityOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )} */}

            <TouchableOpacity
              style={[
                styles.saveButton,
                (saving || uploadingImage) && styles.saveButtonDisabled,
              ]}
              onPress={() => saveProfile()}
              disabled={saving || uploadingImage}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Enregistrer les modifications
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => {
                  if (item.route) {
                    navigation.navigate(item.route);
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon} size={22} color="#1A73E8" />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#191C23",
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    borderWidth: 4,
    borderColor: "#F8FAFC",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A73E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#191C23",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F1FE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  providerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A73E8",
  },
  section: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191C23",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#191C23",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    minHeight: 100,
    fontSize: 16,
    color: "#191C23",
    backgroundColor: "#F8FAFC",
  },
  cityList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cityChipActive: {
    backgroundColor: "#E8F1FE",
    borderColor: "#1A73E8",
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  cityChipTextActive: {
    color: "#1A73E8",
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#E8F1FE",
    borderColor: "#1A73E8",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  categoryChipTextActive: {
    color: "#1A73E8",
  },
  saveButton: {
    height: 50,
    backgroundColor: "#1A73E8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  menuSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 8,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#1A73E8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191C23",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default UserProfileScreen;
